from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import check_connection, create_indexes, client
from database import db

from routers import users

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_connection()
    await create_indexes()
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

# WAG GAGALAWIN PERO PAG KAILANGAN SIGE LANG
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health") # Wag gagalawin
async def health():
    try:
        await db.command("ping")
        return {"api": "ok", "mongodb": "connected"}
    except Exception as e:
        return {"api": "ok", "mongodb": "not connected", "error": str(e)}
    
# Dito mo sa baba lagay mga routers migz one line lang pang tawag
app.include_router(users.router, prefix="/users", tags=["users"])
