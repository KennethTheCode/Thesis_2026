"""MongoDB-side validation ($jsonSchema) so bad data is rejected even if it
bypasses the API. Pydantic = first line of defence, this = last line."""

_NUM = ["double", "int", "long"]

# ---- Dropdown options (single source of truth: the API and the DB both use these) ----
# If you edit these, edit BARANGAYS / FACILITY_TYPES in facilityOptions.js (frontend) too.
FACILITY_TYPES = ["hospital", "fire_station", "police_station", "cdrrmo", "ambulance_base"]

BARANGAYS = [
    "Biñan (Poblacion)", "Bungahan", "Canlalay", "Casile", "De La Paz", "Ganado",
    "Langkiwa", "Loma", "Malaban", "Malamig", "Mampalasan", "Mamplasan", "Platero",
    "San Antonio", "San Francisco (Halang)", "San Jose", "San Vicente", "Sto. Domingo",
    "Sto. Niño", "Sto. Tomas (Calabuso)", "Soro-soro", "Timbao", "Tubigan", "Zapote",
]

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
            "role": {"enum": ["admin", "responder", "barangay_official", "citizen", "user"]},
            "status": {"enum": ["active", "inactive", "suspended"]},
            "created_at": {"bsonType": "date"},
        },
    },
    "incidents": {
        "bsonType": "object",
        "required": ["reference_no", "incident_type", "status", "barangay", "location", "created_at"],
        "properties": {
            "reference_no": {"bsonType": "string"},
            "user_id": {"bsonType": ["string", "null"]},
            "email": {"bsonType": ["string", "null"]},
            "contact_number": {"bsonType": ["string", "null"]},
            "incident_type": {"bsonType": "string"},
            "status": {"enum": ["pending", "verified", "dispatched", "resolved", "rejected"]},
            "barangay": {"enum": BARANGAYS},
            "landmark_reference": {"bsonType": ["string", "null"]},
            "accident_date": {"bsonType": ["string", "date", "null"]},
            "year": {"bsonType": ["int", "long", "null"]},
            "month": {"bsonType": ["int", "long", "null"]},
            "source": {"bsonType": ["string", "null"]},
            "voicemail_file_id": {"bsonType": ["string", "null"]},
            "location": GEOJSON_POINT,
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": ["date", "null"]},
        },
    },
    "facilities": {
        "bsonType": "object",
        "required": [
            "name", "facility_type", "address", "barangay", "contact_number",
            "location", "status", "created_at",
        ],
        "properties": {
            "name": {"bsonType": "string", "minLength": 3, "maxLength": 100},
            "facility_type": {"enum": FACILITY_TYPES},
            "address": {"bsonType": "string", "minLength": 5, "maxLength": 200},
            "barangay": {"enum": BARANGAYS},
            "contact_number": {"bsonType": "string"},
            "location": GEOJSON_POINT,
            "status": {"enum": ["active", "archived"]},
            "created_at": {"bsonType": "date"},
        },
    },
    "tickets": {
        "bsonType": "object",
        "required": ["ticket_number", "incident_id", "status", "priority", "created_at"],
        "properties": {
            "ticket_number": {"bsonType": "string"},
            "incident_id": {"bsonType": "string"},
            "status": {"enum": ["open", "in_progress", "assigned", "en_route", "on_scene", "closed", "rejected"]},
            "priority": {"enum": ["low", "medium", "high", "critical"]},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    },
    "historical_accidents": {
        "bsonType": "object",
        "required": ["accident_date", "barangay", "location"],
        "properties": {
            "accident_date": {"bsonType": "date"},
            "barangay": {"enum": BARANGAYS},
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