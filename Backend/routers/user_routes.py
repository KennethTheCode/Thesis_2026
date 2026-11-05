from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError

import database
from auth import get_current_user, to_user_out

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/panel")
async def user_panel(user: dict = Depends(get_current_user)):
    """Any logged-in, active account. Only returns the caller's own data."""
    try:
        cursor = (database.db.incidents
                  .find({"reported_by": str(user["_id"])}, {"reference_no": 1, "status": 1, "created_at": 1})
                  .sort("created_at", -1).limit(5))
        docs = await cursor.to_list(length=5)
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(503, "Database is unavailable. Please try again.")
    return {
        "profile": to_user_out(user),
        "recent_incidents": [
            {"id": str(d["_id"]), "reference_no": d.get("reference_no"),
             "status": d.get("status"), "created_at": d.get("created_at")}
            for d in docs
        ],
    }
