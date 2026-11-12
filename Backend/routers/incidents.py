import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from database import db
from fastapi.responses import StreamingResponse
from bson import ObjectId

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

async def ensure_incident_indexes():
    """Ensure unique reference_no, ticket_number, and 2dsphere spatial indexes."""
    await db["incidents"].create_index("reference_no", unique=True)
    await db["incidents"].create_index([("location", "2dsphere")])
    await db["tickets"].create_index("ticket_number", unique=True)

class IncidentCreate(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    incident_type: str = Field("other", pattern="^(collision|pedestrian|motorcycle|hit_and_run|other)$")
    severity: str = Field("severe", pattern="^(minor|moderate|severe|fatal)$")
    barangay: str
    latitude: float
    longitude: float

# --- 1. GET ACTIVE USER INCIDENT CHECK ---
@router.get("/active/{user_id_or_email}")
async def check_active_user_incident(user_id_or_email: str):
    """Check if the user already has an active, unresolved incident in MongoDB."""
    query = {
        "status": {"$ne": "resolved"},
        "$or": [
            {"user_id": user_id_or_email},
            {"email": user_id_or_email}
        ]
    }
    incident = await db["incidents"].find_one(query)
    if not incident:
        return {"has_active": False, "incident": None}

    return {
        "has_active": True,
        "incident": {
            "id": str(incident["_id"]),
            "reference_no": incident.get("reference_no"),
            "status": incident.get("status"),
            "createdAt": incident.get("created_at").isoformat() if incident.get("created_at") else None,
            "voicemail_file_id": incident.get("voicemail_file_id")
        }
    }

# --- 2. GET MAP INCIDENTS ENDPOINT ---
@router.get("/map")
async def get_map_incidents():
    cursor = db["incidents"].find({"status": {"$ne": "resolved"}}).sort("created_at", -1).limit(50)
    incidents = []
    async for doc in cursor:
        coords = doc.get("location", {}).get("coordinates", [121.0820, 14.3323])
        incidents.append({
            "id": str(doc["_id"]),
            "reference_no": doc.get("reference_no"),
            "email": doc.get("email"),
            "contact_number": doc.get("contact_number"),
            "incident_type": doc.get("incident_type"),
            "severity": doc.get("severity"),
            "status": doc.get("status"),
            "barangay": doc.get("barangay"),
            "voicemail_file_id": doc.get("voicemail_file_id"),
            "latitude": coords[1],
            "longitude": coords[0],
            "createdAt": doc.get("created_at").isoformat() if doc.get("created_at") else None
        })
    return incidents

# --- 3. WEBSOCKET ENDPOINT ---
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- 4. POST CREATE INCIDENT ENDPOINT (With DB duplicate check) ---
@router.post("")
async def create_sos_incident(payload: IncidentCreate):
    # Search for an existing active (unresolved) request from this user
    query_conditions = []
    if payload.user_id:
        query_conditions.append({"user_id": payload.user_id})
    if payload.email:
        query_conditions.append({"email": payload.email})

    if query_conditions:
        existing = await db["incidents"].find_one({
            "status": {"$ne": "resolved"},
            "$or": query_conditions
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active SOS request in progress."
            )

    reference_no = f"INC-{uuid.uuid4().hex[:8].upper()}"
    ticket_no = f"TCK-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()

    incident_doc = {
        "reference_no": reference_no,
        "user_id": payload.user_id,
        "email": payload.email,
        "contact_number": payload.contact_number,
        "incident_type": payload.incident_type,
        "severity": payload.severity,
        "status": "reported",
        "barangay": payload.barangay,
        "voicemail_file_id": None,
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude]
        },
        "created_at": now
    }

    try:
        inc_result = await db["incidents"].insert_one(incident_doc)
        incident_id = str(inc_result.inserted_id)

        ticket_doc = {
            "ticket_number": ticket_no,
            "incident_id": incident_id,
            "user_id": payload.user_id,
            "email": payload.email,
            "contact_number": payload.contact_number,
            "status": "open",
            "priority": "critical" if payload.severity in ["severe", "fatal"] else "medium",
            "created_at": now
        }
        await db["tickets"].insert_one(ticket_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record incident/ticket: {str(e)}")

    broadcast_payload = {
        "event": "NEW_INCIDENT",
        "data": {
            "id": incident_id,
            "reference_no": reference_no,
            "ticket_number": ticket_no,
            "email": payload.email,
            "contact_number": payload.contact_number,
            "incident_type": payload.incident_type,
            "severity": payload.severity,
            "status": "reported",
            "barangay": payload.barangay,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "createdAt": now.isoformat()
        }
    }
    
    await manager.broadcast(broadcast_payload)

    return {
        "id": incident_id,
        "reference_no": reference_no,
        "ticket_number": ticket_no,
        "user_id": payload.user_id,
        "email": payload.email,
        "contact_number": payload.contact_number,
        "incident_type": payload.incident_type,
        "severity": payload.severity,
        "status": "reported",
        "barangay": payload.barangay,
        "location": incident_doc["location"],
        "created_at": now.isoformat()
    }

# --- 5. POST VOICEMAIL ENDPOINT ---
@router.post("/{reference_no}/voicemail")
async def upload_voicemail(reference_no: str, audio_file: UploadFile = File(...)):
    incident = await db["incidents"].find_one({"reference_no": reference_no})
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if incident.get("voicemail_file_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voicemail has already been submitted for this incident.")

    file_bytes = await audio_file.read()

    fs = AsyncIOMotorGridFSBucket(db)
    grid_in = fs.open_upload_stream(
        filename=f"{reference_no}_voicemail.webm",
        metadata={"reference_no": reference_no, "content_type": audio_file.content_type}
    )
    await grid_in.write(file_bytes)
    await grid_in.close()

    file_id = str(grid_in._id)

    await db["incidents"].update_one(
        {"reference_no": reference_no},
        {"$set": {"voicemail_file_id": file_id}}
    )

    return {"message": "Voicemail uploaded successfully", "file_id": file_id}

@router.get("/voicemail/{file_id}")
async def get_voicemail_audio(file_id: str):
    """Stream voicemail audio file directly from GridFS bucket."""
    try:
        fs = AsyncIOMotorGridFSBucket(db)
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        
        async def audio_stream():
            while chunk := await grid_out.readchunk():
                yield chunk

        content_type = grid_out.metadata.get("content_type", "audio/webm") if grid_out.metadata else "audio/webm"

        return StreamingResponse(
            audio_stream(),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={grid_out.filename}",
                "Accept-Ranges": "bytes"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Voicemail audio file not found.")