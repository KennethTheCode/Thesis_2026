"""MongoDB-side validation ($jsonSchema) so bad data is rejected even if it
bypasses the API. Pydantic = first line of defence, this = last line."""

_NUM = ["double", "int", "long"]

GEOJSON_POINT = {
    "bsonType": "object",
    "required": ["type", "coordinates"],
    "properties": {
        "type": {"enum": ["Point"]},
        "coordinates": {"bsonType": "array", "minItems": 2, "maxItems": 2, "items": {"bsonType": _NUM}},
    },
}

VALIDATORS = {
    "users": {
        "bsonType": "object",
        "required": ["username", "password_hash", "email", "contact_number", "address", "role", "status", "created_at"],
        "properties": {
            "username": {"bsonType": "string", "minLength": 4, "maxLength": 30},
            "password_hash": {"bsonType": "string"},
            "email": {"bsonType": "string"},
            "contact_number": {"bsonType": "string"},
            "address": {"bsonType": "string"},
            "role": {"enum": ["admin", "responder", "barangay_official", "citizen"]},
            "status": {"enum": ["active", "inactive", "suspended"]},
            "created_at": {"bsonType": "date"},
        },
    },
    "incidents": {
        "bsonType": "object",
        "required": ["reference_no", "incident_type", "severity", "status", "barangay", "location", "created_at"],
        "properties": {
            "reference_no": {"bsonType": "string"},
            "incident_type": {"enum": ["collision", "pedestrian", "motorcycle", "hit_and_run", "other"]},
            "severity": {"enum": ["minor", "moderate", "severe", "fatal"]},
            "status": {"enum": ["reported", "verified", "dispatched", "resolved", "cancelled"]},
            "location": GEOJSON_POINT,
            "created_at": {"bsonType": "date"},
        },
    },
    "facilities": {
        "bsonType": "object",
        "required": ["name", "facility_type", "location"],
        "properties": {
            "name": {"bsonType": "string"},
            "facility_type": {"enum": ["hospital", "fire_station", "police_station", "cdrrmo", "ambulance_base"]},
            "location": GEOJSON_POINT,
        },
    },
    "tickets": {
        "bsonType": "object",
        "required": ["ticket_number", "incident_id", "status", "priority", "created_at"],
        "properties": {
            "ticket_number": {"bsonType": "string"},
            "status": {"enum": ["open", "assigned", "en_route", "on_scene", "closed"]},
            "priority": {"enum": ["low", "medium", "high", "critical"]},
            "created_at": {"bsonType": "date"},
        },
    },
    "historical_accidents": {
        "bsonType": "object",
        "required": ["accident_date", "barangay", "location"],
        "properties": {
            "accident_date": {"bsonType": "date"},
            "location": GEOJSON_POINT,
        },
    },
}


async def ensure_collections(db) -> None:
    """Create each collection with its validator; update the validator if it already exists."""
    existing = set(await db.list_collection_names())
    for name, schema in VALIDATORS.items():
        opts = {
            "validator": {"$jsonSchema": schema},
            "validationLevel": "moderate",   # don't break old docs already in the DB
            "validationAction": "error",
        }
        if name in existing:
            await db.command({"collMod": name, **opts})
        else:
            await db.create_collection(name, **opts)
