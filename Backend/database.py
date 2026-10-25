from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from db_schema import ensure_collections  # NEW

# Pang connect sa database/mongodb
client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
db = client[settings.db_name]


# Wag gagalawin
async def check_connection():
    try:
        await client.admin.command("ping")
        print("Connected to MongoDB")
    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}") from e

# (LIZ) Pwede mo to dagdagan pwede rin bawasan example lang to 
# dito ka mag seset ng mga index parang primary key ganon yung mga data na bawal may kaparehas pwede rin dito yun
async def create_indexes():
    await db.users.create_index("username", unique=True)
    await db.users.create_index("contact_number", unique=True)
    await db.facilities.create_index([("location", "2dsphere")])
    await db.tickets.create_index([("status", 1), ("created_at", -1)])

    # ---- NEW (T02) ----
    # users: email unique. Partial so old user docs without email don't collide on null.
    await db.users.create_index(
        "email", unique=True, partialFilterExpression={"email": {"$type": "string"}}
    )
    await db.users.create_index("role")

    # incidents
    await db.incidents.create_index([("location", "2dsphere")])
    await db.incidents.create_index("reference_no", unique=True)
    await db.incidents.create_index([("status", 1), ("created_at", -1)])
    await db.incidents.create_index("barangay")

    # facilities
    await db.facilities.create_index([("name", 1), ("facility_type", 1)], unique=True)
    await db.facilities.create_index("facility_type")

    # tickets
    await db.tickets.create_index("ticket_number", unique=True)
    await db.tickets.create_index("incident_id")
    await db.tickets.create_index("assigned_to")

    # historical_accidents
    await db.historical_accidents.create_index([("location", "2dsphere")])
    await db.historical_accidents.create_index([("accident_date", -1)])
    await db.historical_accidents.create_index([("barangay", 1), ("accident_date", -1)])
    await db.historical_accidents.create_index(    # re-importing the same CSV won't duplicate rows
        "source_record_id", unique=True,
        partialFilterExpression={"source_record_id": {"$type": "string"}},
    )


# NEW (T02): single call for startup -> collections (with validators) + indexes
async def init_db():
    try:
        await ensure_collections(db)
        await create_indexes()
        print("Collections and indexes ready")
    except Exception as e:
        raise RuntimeError(f"Database initialisation failed: {e}") from e