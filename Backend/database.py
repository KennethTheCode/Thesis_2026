from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

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