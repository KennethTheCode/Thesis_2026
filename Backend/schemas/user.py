# (LIZ) 
# Sample lang to liz pwede mo dagdagan pwede rin bawasan, Depende sa data na need hingiin. 
# Para lang table to, pero collection tawag 
# Example next data natin puro accidents naman, gawa ka lang isa pang file pero sa next collection 
#(ex. accidents.py)

# (MIGZ) 
# Dito ka mag base palagi kung ano lalagay na data ni liz, ayun lalagay mo sa pang backend.

from pydantic import BaseModel, Field

class UserCreate(BaseModel):          # what the client sends
    username: str = Field(min_length=4, max_length=30)
    password: str = Field(min_length=8)
    contact_number: str
    address: str

class UserOut(BaseModel):             # what we send back (no password!)
    id: str
    username: str
    contact_number: str
    status: str

from datetime import datetime, timezone
import bcrypt
from fastapi import APIRouter, HTTPException, File, Form, UploadFile, status
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from database import db
from schemas.user import UserOut

router = APIRouter()


# Schema for login payload
class LoginSchema(BaseModel):
    username: str
    password: str


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
        "password_hash": password_hash,
        "birthday": birthday,
        "gender": gender,
        "valid_id_type": valid_id_type,
        "valid_id_file_id": str(grid_in._id),  # Reference to GridFS binary object
        "address": address,
        "contact_number": contact_number,
        "terms_accepted": terms_accepted,
        "role": "user",
        "status": "active",
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
    # 1. Check if user exists
    user = await db.users.find_one({"username": data.username.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # 2. Check password against bcrypt hash
    stored_hash = user.get("password_hash")
    if not stored_hash or not bcrypt.checkpw(data.password.encode("utf-8"), stored_hash.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # 3. Check status
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or pending approval."
        )

    return {
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "role": user.get("role", "user")
        }
    }