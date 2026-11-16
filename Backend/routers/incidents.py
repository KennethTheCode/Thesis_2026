import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId
from database import db
import csv
import io
from pymongo import UpdateOne

router = APIRouter()

# Strict state machine: pending -> verified -> dispatched -> resolved / rejected
ALLOWED_TRANSITIONS = {
    "pending": {"verified", "rejected"},
    "verified": {"dispatched", "rejected"},
    "dispatched": {"resolved", "rejected"},
    "resolved": set(),
    "rejected": set(),
}

TERMINAL_STATUSES = ["resolved", "rejected"]


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
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


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


class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(verified|dispatched|rejected|resolved)$")


# --- 1. GET ACTIVE USER INCIDENT CHECK ---
@router.get("/active/{user_id_or_email}")
async def check_active_user_incident(user_id_or_email: str):
    """Check if the user already has an active (non-resolved, non-rejected) incident."""
    query = {
        "status": {"$nin": TERMINAL_STATUSES},
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
    cursor = db["incidents"].find({"status": {"$nin": TERMINAL_STATUSES}}).sort("created_at", -1).limit(50)
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


# --- 4. POST CREATE INCIDENT ENDPOINT ---
@router.post("")
async def create_sos_incident(payload: IncidentCreate):
    query_conditions = []
    if payload.user_id:
        query_conditions.append({"user_id": payload.user_id})
    if payload.email:
        query_conditions.append({"email": payload.email})

    if query_conditions:
        existing = await db["incidents"].find_one({
            "status": {"$nin": TERMINAL_STATUSES},
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
        "status": "pending",
        "barangay": payload.barangay,
        "voicemail_file_id": None,
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude]
        },
        "created_at": now,
        "updated_at": now
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
            "created_at": now,
            "updated_at": now
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
            "status": "pending",
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
        "status": "pending",
        "barangay": payload.barangay,
        "location": incident_doc["location"],
        "created_at": now.isoformat()
    }


# --- 5. PATCH UPDATE INCIDENT STATUS (ATOMIC & VALIDATED) ---
@router.patch("/{reference_no}/status")
async def update_incident_status(reference_no: str, payload: IncidentStatusUpdate):
    incident = await db["incidents"].find_one({"reference_no": reference_no})
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    current_status = incident.get("status", "pending")
    target_status = payload.status

    if current_status == target_status:
        return {"reference_no": reference_no, "status": current_status}

    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{target_status}'."
        )

    now = datetime.utcnow()

    # Atomic conditional update prevents race conditions if two admins click simultaneously
    result = await db["incidents"].update_one(
        {"reference_no": reference_no, "status": current_status},
        {"$set": {"status": target_status, "updated_at": now}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Incident status was already modified by another dispatcher."
        )

    # Sync corresponding ticket status
    ticket_status_map = {
        "verified": "in_progress",
        "dispatched": "in_progress",
        "resolved": "closed",
        "rejected": "rejected"
    }
    await db["tickets"].update_one(
        {"incident_id": str(incident["_id"])},
        {"$set": {"status": ticket_status_map[target_status], "updated_at": now}}
    )

    await manager.broadcast({
        "event": "INCIDENT_STATUS_UPDATED",
        "data": {
            "id": str(incident["_id"]),
            "reference_no": reference_no,
            "status": target_status,
            "updatedAt": now.isoformat()
        }
    })

    return {
        "reference_no": reference_no,
        "status": target_status,
        "updated_at": now.isoformat()
    }


# --- 6. POST VOICEMAIL ENDPOINT ---
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

    await manager.broadcast({
        "event": "VOICEMAIL_ATTACHED",
        "data": {
            "reference_no": reference_no,
            "voicemail_file_id": file_id
        }
    })

    return {"message": "Voicemail uploaded successfully", "file_id": file_id}


# --- 7. GET STREAM VOICEMAIL AUDIO FROM GRIDFS ---
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
    except Exception:
        raise HTTPException(status_code=404, detail="Voicemail audio file not found.")

@router.post("/import-csv")
async def import_incidents_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a valid .csv file.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    required_cols = {
        "source_record_id",
        "accident_date",
        "year",
        "month",
        "incident_type",
        "barangay",
        "latitude",
        "longitude",
        "landmark_reference",
        "status",
    }

    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        missing = sorted(required_cols - set(reader.fieldnames or []))
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV columns: {', '.join(missing)}",
        )

    operations = []
    skipped = 0
    now = datetime.now(timezone.utc)

    for idx, row in enumerate(reader, start=1):
        try:
            ref_no = (row.get("source_record_id") or f"LEMS-ROW-{idx}").strip()
            lat = float(row["latitude"])
            lng = float(row["longitude"])
            raw_date = (row.get("accident_date") or "").strip()

            try:
                created_dt = datetime.strptime(raw_date, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            except ValueError:
                created_dt = now

            year = int(row["year"]) if row.get("year") else created_dt.year
            month = int(row["month"]) if row.get("month") else created_dt.month
            status_val = (row.get("status") or "resolved").strip().lower()
            if status_val not in {"pending", "verified", "dispatched", "resolved", "rejected"}:
                status_val = "resolved"

            doc = {
                "reference_no": ref_no,
                "incident_type": (row.get("incident_type") or "OTHERS").strip().upper(),
                "barangay": (row.get("barangay") or "").strip(),
                "landmark_reference": (row.get("landmark_reference") or "").strip(),
                "location": {
                    "type": "Point",
                    "coordinates": [lng, lat],  # GeoJSON order: [longitude, latitude]
                },
                "year": year,
                "month": month,
                "status": status_val,
                "source": "csv_import",
                "created_at": created_dt,
                "updated_at": now,
            }

            operations.append(
                UpdateOne({"reference_no": ref_no}, {"$set": doc}, upsert=True)
            )
        except (ValueError, KeyError):
            skipped += 1

    if not operations:
        raise HTTPException(status_code=400, detail="No valid incident rows found in CSV.")

    result = await db["incidents"].bulk_write(operations, ordered=False)

    return {
        "message": "CSV imported into incidents collection.",
        "inserted": result.upserted_count,
        "updated": result.modified_count,
        "total_processed": len(operations),
        "skipped": skipped,
    }


@router.get("/resolved")
async def get_resolved_incidents():
    cursor = db["incidents"].find({"status": "resolved"}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        coords = (doc.get("location") or {}).get("coordinates") or [0.0, 0.0]
        created_at = doc.get("created_at")
        if isinstance(created_at, datetime):
            date_str = created_at.strftime("%Y-%m-%d %H:%M")
            year = doc.get("year") or created_at.year
            month = doc.get("month") or created_at.month
        else:
            date_str = str(created_at or "")
            year = doc.get("year") or ""
            month = doc.get("month") or ""

        items.append({
            "id": str(doc["_id"]),
            "source_record_id": doc.get("reference_no"),
            "accident_date": date_str,
            "year": year,
            "month": month,
            "incident_type": doc.get("incident_type") or "SOS INCIDENT",
            "barangay": doc.get("barangay") or "",
            "latitude": coords[1] if len(coords) > 1 else 0.0,
            "longitude": coords[0] if len(coords) > 0 else 0.0,
            "landmark_reference": doc.get("landmark_reference") or doc.get("barangay") or "",
            "status": doc.get("status", "resolved"),
        })

    return items