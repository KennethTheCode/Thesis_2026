from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import check_connection, init_db, client
from database import db

from routers import users
from routers.auth_routes import router as auth_router      # T05
from routers.admin_routes import router as admin_router    # T05
from routers.user_routes import router as user_router      # T05


@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_connection()
    await init_db()          # creates collections + indexes (includes create_indexes)
    yield
    client.close()


app = FastAPI(title="ResQ:Binan API", lifespan=lifespan)

# WAG GAGALAWIN PERO PAG KAILANGAN SIGE LANG
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/health") # Wag gagalawin
async def health():
    try:
        await db.command("ping")
        return {"api": "ok", "mongodb": "connected"}
    except Exception as e:
        return {"api": "ok", "mongodb": "not connected", "error": str(e)}


# Dito mo sa baba lagay mga routers migz one line lang pang tawag
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(auth_router)     # T05: /api/auth/...
app.include_router(admin_router)    # T05: /api/admin/...
app.include_router(user_router)     # T05: /api/user/...
