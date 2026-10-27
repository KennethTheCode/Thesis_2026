from datetime import datetime, timezone, timedelta
import html
import bcrypt
from fastapi import APIRouter, HTTPException, File, Form, UploadFile, status
from pydantic import BaseModel, field_validator
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from database import db
from schemas.user import UserOut

router = APIRouter()

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


# Schema for login payload with input sanitization
class LoginSchema(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def sanitize_username(cls, v: str) -> str:
        return html.escape(v.strip())

    @field_validator("password")
    @classmethod
    def sanitize_password(cls, v: str) -> str:
        return v.strip()


# 1. Read all users: GET /users/
@router.get("/", response_model=list[UserOut])
async def get_users():
    users = []
    async for user in db.users.find({}, {"password_hash": 0}).sort("created_at", -1):
        user["id"] = str(user.pop("_id"))
        users.append(UserOut(**user))
    return users


# 2. Create a new user: POST /users/
@router.post("/", response_model=UserOut, status_code=201)
async def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    birthday: str = Form(...),
    gender: str = Form(...),
    valid_id_type: str = Form(...),
    address: str = Form(...),
    contact_number: str = Form(...),
    terms_accepted: bool = Form(...),
    valid_id_picture: UploadFile = File(...)
):
    # Validate file type and size before writing to DB
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if valid_id_picture.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPEG, PNG, and WebP are allowed."
        )

    file_bytes = await valid_id_picture.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds the 5MB limit."
        )

    # Save ID picture directly into MongoDB GridFS (NO LOCAL DISK STORAGE)
    fs = AsyncIOMotorGridFSBucket(db)
    grid_in = fs.open_upload_stream(
        filename=valid_id_picture.filename,
        metadata={
            "content_type": valid_id_picture.content_type,
            "uploaded_by": username.lower()
        }
    )
    await grid_in.write(file_bytes)
    await grid_in.close()

    # Hash the password
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Construct MongoDB document
    doc = {
        "username": username.lower(),
        "email": email.strip().lower(),
        "password_hash": password_hash,
        "birthday": birthday,
        "gender": gender,
        "valid_id_type": valid_id_type,
        "valid_id_file_id": str(grid_in._id),  # Reference to GridFS binary object
        "address": address,
        "contact_number": contact_number,
        "terms_accepted": terms_accepted,
        "role": "citizen",
        "status": "active",
        "failed_attempts": 0,
        "lockout_until": None,
        "created_at": datetime.now(timezone.utc)
    }

    # Save document into MongoDB
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or contact number already exists."
        )

    doc["id"] = str(result.inserted_id)
    doc.pop("password_hash", None)
    return doc


# 3. Authenticate user: POST /users/login/
@router.post("/login/")
async def login_user(data: LoginSchema):
    username_clean = data.username.lower()

    # 1. Fetch user from MongoDB
    user = await db.users.find_one({"username": username_clean})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    now_utc = datetime.now(timezone.utc)
    failed_attempts = user.get("failed_attempts", 0)
    lockout_until = user.get("lockout_until")

    # 2. Verify Lockout Expiration Status
    if lockout_until:
        if lockout_until.tzinfo is None:
            lockout_until = lockout_until.replace(tzinfo=timezone.utc)

        if now_utc < lockout_until:
            remaining_seconds = int((lockout_until - now_utc).total_seconds())
            remaining_minutes = max(1, remaining_seconds // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked due to 5 failed attempts. Please try again in {remaining_minutes} minute(s)."
            )
        else:
            # Reset counters once lockout period passes
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"failed_attempts": 0, "lockout_until": None}}
            )
            failed_attempts = 0

    # 3. Check Account Status
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or pending approval."
        )

    # 4. Check Password against Hash
    stored_hash = user.get("password_hash")
    is_password_valid = stored_hash and bcrypt.checkpw(
        data.password.encode("utf-8"),
        stored_hash.encode("utf-8")
    )

    if not is_password_valid:
        new_failed_attempts = failed_attempts + 1
        update_payload = {"failed_attempts": new_failed_attempts}

        # Apply lockout on 5th failure
        if new_failed_attempts >= MAX_FAILED_ATTEMPTS:
            update_payload["lockout_until"] = now_utc + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_payload})
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked due to 5 consecutive failed attempts. Try again in {LOCKOUT_DURATION_MINUTES} minutes."
            )

        await db.users.update_one({"_id": user["_id"]}, {"$set": update_payload})
        remaining_tries = MAX_FAILED_ATTEMPTS - new_failed_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid username or password. {remaining_tries} attempt(s) remaining before account lockout."
        )

    # 5. Clear Failed Counters on Successful Login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_attempts": 0, "lockout_until": None, "last_login": now_utc}}
    )

    return {
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "role": user.get("role", "user")
        }
    }