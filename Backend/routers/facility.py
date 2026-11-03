"""Facility endpoints: create, list (paginated + search), map markers, archive, restore.

Mounted in main.py as:  app.include_router(facility.router, prefix="/facilities", tags=["facilities"])
"""

import asyncio
import math
import re
import time
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError, WriteError

from database import db
from db_schema import BARANGAYS, FACILITY_TYPES

router = APIRouter()

# ---------------------------------------------------------------- settings (edit here)
PAGE_SIZE = 5                  # max facilities returned per request (prevents lag)
SUBMIT_COOLDOWN_SECONDS = 3    # min seconds between two "add" requests from the same client
CONTACT_PATTERN = re.compile(r"^[0-9+()\-\s]{7,20}$")

# Coordinates must fall inside this box (roughly Biñan City). x = longitude, y = latitude.
MIN_LAT, MAX_LAT = 14.25, 14.40
MIN_LNG, MAX_LNG = 121.02, 121.14

facilities = db["facilities"]
_last_submit: dict[str, float] = {}   # client ip -> time of last add request


# ---------------------------------------------------------------- indexes (duplicates blocked by MongoDB)
async def ensure_facility_indexes() -> None:
    """Call once on startup (see main.py). Unique indexes make duplicates impossible,
    even if two requests arrive at the same moment."""
    only_new_docs = {"name_key": {"$type": "string"}}   # ignore old docs without name_key
    await facilities.create_index(
        [("name_key", ASCENDING), ("barangay", ASCENDING)],
        unique=True, name="uniq_name_per_barangay", partialFilterExpression=only_new_docs,
    )
    await facilities.create_index(
        "coord_key", unique=True, name="uniq_coordinates",
        partialFilterExpression={"coord_key": {"$type": "string"}},
    )
    await facilities.create_index([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created")


# ---------------------------------------------------------------- request model (first line of defence)
class FacilityIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=3, max_length=100)
    facility_type: str
    address: str = Field(min_length=5, max_length=200)
    barangay: str
    contact_number: str
    longitude: float   # "Coordinates x"
    latitude: float    # "Coordinates y"

    @field_validator("facility_type")
    @classmethod
    def check_type(cls, v):
        if v not in FACILITY_TYPES:
            raise ValueError("Pick a valid facility type")
        return v

    @field_validator("barangay")
    @classmethod
    def check_barangay(cls, v):
        if v not in BARANGAYS:
            raise ValueError("Pick a valid barangay")
        return v

    @field_validator("contact_number")
    @classmethod
    def check_contact(cls, v):
        if not CONTACT_PATTERN.match(v):
            raise ValueError("Contact number may only have digits, spaces, + ( ) - (7-20 characters)")
        return v

    @field_validator("longitude")
    @classmethod
    def check_lng(cls, v):
        if not math.isfinite(v) or not MIN_LNG <= v <= MAX_LNG:
            raise ValueError(f"Coordinates x (longitude) must be between {MIN_LNG} and {MAX_LNG}")
        return v

    @field_validator("latitude")
    @classmethod
    def check_lat(cls, v):
        if not math.isfinite(v) or not MIN_LAT <= v <= MAX_LAT:
            raise ValueError(f"Coordinates y (latitude) must be between {MIN_LAT} and {MAX_LAT}")
        return v


# ---------------------------------------------------------------- helpers
def to_json(doc: dict) -> dict:
    """Turn a MongoDB document into what the frontend needs."""
    lng, lat = doc["location"]["coordinates"]
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "facility_type": doc["facility_type"],
        "address": doc["address"],
        "barangay": doc["barangay"],
        "contact_number": doc.get("contact_number", ""),
        "longitude": lng,
        "latitude": lat,
        "status": doc.get("status", "active"),
    }


def parse_id(facility_id: str) -> ObjectId:
    try:
        return ObjectId(facility_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid facility id")


def check_cooldown(request: Request, action: str) -> None:
    """Server-side backup for the 3 second submit cooldown (separate timer for "add" and "edit")."""
    client = f"{action}:{request.client.host if request.client else 'unknown'}"
    now = time.monotonic()
    wait = SUBMIT_COOLDOWN_SECONDS - (now - _last_submit.get(client, 0))
    if wait > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {math.ceil(wait)}s before submitting again")
    if len(_last_submit) > 1000:   # keep memory small
        _last_submit.clear()
    _last_submit[client] = now


def build_fields(data: FacilityIn) -> dict:
    """The facility fields that get saved (used by both add and edit)."""
    return {
        "name": data.name,
        "name_key": " ".join(data.name.split()).lower(),   # for duplicate check
        "facility_type": data.facility_type,
        "address": data.address,
        "barangay": data.barangay,
        "contact_number": data.contact_number,
        "location": {"type": "Point", "coordinates": [data.longitude, data.latitude]},
        "coord_key": f"{data.longitude:.5f},{data.latitude:.5f}",   # for duplicate check
    }


# ---------------------------------------------------------------- endpoints
@router.post("", status_code=201)
async def create_facility(data: FacilityIn, request: Request):
    check_cooldown(request, "add")

    doc = {
        **build_fields(data),
        "status": "active",
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await facilities.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Duplicate facility: same name in this barangay, or same coordinates (check the archive too)",
        )
    except WriteError as e:
        raise HTTPException(status_code=422, detail=f"Database rejected the data: {e.details.get('errmsg', e)}")
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database error. Please try again.")

    doc["_id"] = result.inserted_id
    return to_json(doc)


@router.put("/{facility_id}")
async def edit_facility(facility_id: str, data: FacilityIn, request: Request):
    """Edit an active facility. Same validation and duplicate rules as adding."""
    check_cooldown(request, "edit")

    try:
        doc = await facilities.find_one_and_update(
            {"_id": parse_id(facility_id), "status": "active"},
            {"$set": {**build_fields(data), "updated_at": datetime.now(timezone.utc)}},
            return_document=True,
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Duplicate facility: same name in this barangay, or same coordinates (check the archive too)",
        )
    except WriteError as e:
        raise HTTPException(status_code=422, detail=f"Database rejected the data: {e.details.get('errmsg', e)}")
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database error. Please try again.")

    if doc is None:
        raise HTTPException(status_code=404, detail="Facility not found or already archived")
    return to_json(doc)


@router.get("")
async def list_facilities(
    status: str = Query("active", pattern="^(active|archived)$"),
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(PAGE_SIZE, ge=1, le=PAGE_SIZE),   # never more than PAGE_SIZE
):
    query: dict = {"status": status}
    search = search.strip()
    if search:
        pattern = {"$regex": re.escape(search), "$options": "i"}   # escape = safe from regex injection
        query["$or"] = [{"name": pattern}, {"address": pattern}, {"barangay": pattern}, {"facility_type": pattern}]

    try:
        cursor = facilities.find(query).sort("created_at", DESCENDING).skip((page - 1) * limit).limit(limit)
        total, docs = await asyncio.gather(          # count and fetch at the same time = faster
            facilities.count_documents(query),
            cursor.to_list(length=limit),
        )
        items = [to_json(d) for d in docs]
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database error. Please try again.")

    return {"items": items, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}


@router.get("/map")
async def map_facilities():
    """All active facilities, for the map markers."""
    try:
        return [to_json(d) async for d in facilities.find({"status": "active"})]
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database error. Please try again.")


async def _set_status(facility_id: str, from_status: str, to_status: str) -> dict:
    changes = {"status": to_status}
    changes["archived_at" if to_status == "archived" else "restored_at"] = datetime.now(timezone.utc)
    try:
        doc = await facilities.find_one_and_update(
            {"_id": parse_id(facility_id), "status": from_status},
            {"$set": changes},
            return_document=True,
        )
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Database error. Please try again.")
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Facility not found or not {from_status}")
    return to_json(doc)


@router.patch("/{facility_id}/archive")
async def archive_facility(facility_id: str):
    return await _set_status(facility_id, "active", "archived")


@router.patch("/{facility_id}/restore")
async def restore_facility(facility_id: str):
    return await _set_status(facility_id, "archived", "active")