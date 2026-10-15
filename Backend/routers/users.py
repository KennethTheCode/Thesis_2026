from datetime import datetime, timezone

import bcrypt 
from fastapi import APIRouter, HTTPException
from pymongo.errors import DuplicateKeyError

from database import db
from schemas.user import UserCreate, UserOut

#MIGZ: dito ka gagawa sample yang mga functions na yan pag gagawa ka ng bagong feature bagong file yon
#Etong file na to eto yung nag hahandle ng users (view and register) kaya users.py file name 
#Pero pag gagawa ka bago file mas maganda pag specific yung name kunwari (view_users or create_users) di bale na madami basta organized

#MIGZ DITO KA MAG TETEST http://127.0.0.1:8000/docs

# 1. Create the router. Every router file starts with this line.
router = APIRouter()

# 2. Read all users: GET /users/
@router.get("/", response_model=list[UserOut]) #MIGZ ETO YUNG NAG V VIEW NG USERS
async def get_users():
    users = []
    async for user in db.users.find({}, {"password_hash": 0}).sort("created_at", -1):
        user["id"] = str(user.pop("_id"))
        users.append(UserOut(**user))
    return users

# 3. Create a new user: POST /users/
@router.post("/", response_model=UserOut, status_code=201) #MIGZ ETO YUNG NAG C CREATE NG USER
async def create_user(data: UserCreate):
    # 4. Turn the validated request into a dictionary, without the plain password
    doc = data.model_dump(exclude={"password"})

    # 4. Hash the password. Never save the real one.
    doc["password_hash"] = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    # 5. Add the fields the server controls (the user can't choose these)
    doc["role"] = "user"
    doc["status"] = "active"
    doc["created_at"] = datetime.now(timezone.utc)

    # 6. Save it. The unique indexes in database.py block duplicates.
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Username or contact number already exists")

    # 7. Return the user. UserOut leaves out the password hash automatically.
    doc["id"] = str(result.inserted_id)
    return doc