import database
from auth import require_admin, to_user_out
from schemas.user import UserOut

from typing import List, Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, model_validator
from pymongo import ReturnDocument
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError, WriteError

# dependencies=[...] on the router => EVERY route below is admin-only, even ones added later
router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

Role = Literal["admin", "responder", "barangay_official", "citizen"]
Status = Literal["active", "inactive", "suspended"]


class UserAdminUpdate(BaseModel):
    role: Optional[Role] = None
    status: Optional[Status] = None

    @model_validator(mode="after")
    def at_least_one(self):
        if self.role is None and self.status is None:
            raise ValueError("provide role and/or status")
        return self


@router.get("/dashboard")
async def dashboard():
    try:
        counts = {}
        for name in ("users", "incidents", "facilities", "tickets", "historical_accidents"):
            counts[name] = await database.db[name].count_documents({})
        open_tickets = await database.db.tickets.count_documents({"status": {"$ne": "closed"}})
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(503, "Database is unavailable. Please try again.")
    return {"counts": counts, "open_tickets": open_tickets}


@router.get("/users", response_model=List[UserOut])
async def list_users(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    try:
        cursor = (database.db.users.find({}, {"password_hash": 0})
                  .sort("created_at", -1).skip(skip).limit(limit))
        docs = await cursor.to_list(length=limit)
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(503, "Database is unavailable. Please try again.")
    return [to_user_out(d) for d in docs]


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserAdminUpdate, admin: dict = Depends(require_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id.")

    is_self = str(admin["_id"]) == user_id
    if is_self and (payload.role not in (None, "admin") or payload.status not in (None, "active")):
        raise HTTPException(400, "You cannot demote or deactivate your own account.")

    changes = payload.model_dump(exclude_none=True)
    try:
        doc = await database.db.users.find_one_and_update(
            {"_id": ObjectId(user_id)}, {"$set": changes},
            return_document=ReturnDocument.AFTER, projection={"password_hash": 0},
        )
    except WriteError as e:
        raise HTTPException(422 if e.code == 121 else 500, "Could not update the user.")
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(503, "Database is unavailable. Please try again.")

    if doc is None:
        raise HTTPException(404, "User not found.")
    return to_user_out(doc)
