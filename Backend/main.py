import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import check_connection, init_db, client, db

from routers import users, facility, incidents, analytics, getis_ord

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_connection()
    await init_db()                            # runs ensure_collections(db) + create_indexes()
    await facility.ensure_facility_indexes()   # unique indexes = no duplicate facilities
    await incidents.ensure_incident_indexes()   # unique indexes for incident reference nos & 2dsphere index
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

# Allowed origins for local Vite dev + Railway frontend deployment
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url:
    allowed_origins.append(frontend_url)

# Support comma-separated extra origins if needed (e.g. custom domain + railway.app URL)
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    allowed_origins.extend(
        [origin.strip().rstrip("/") for origin in extra_origins.split(",") if origin.strip()]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"api": "ok", "mongodb": "connected"}
    except Exception as e:
        return {"api": "ok", "mongodb": "not connected", "error": str(e)}

# Routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(facility.router, prefix="/facilities", tags=["facilities"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(getis_ord.router)