# Import tools for creating API routes, checking users, and handling errors.
from fastapi import APIRouter, Depends, HTTPException

# Import tools for validating input data.
from pydantic import BaseModel, Field, field_validator

# Import errors that may happen when connecting to the database.
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError

# Allows synchronous functions to run without blocking the main process.
from starlette.concurrency import run_in_threadpool

# auth_routes.py
import database
from auth import get_current_user, to_user_out
from schemas.common import utcnow
from security import burn_time, create_access_token, verify_password
from schemas.user import UserOut

# Create a router for authentication-related API endpoints.
router = APIRouter(prefix="/api/auth", tags=["auth"])


# Define the information needed when a user logs in.
class LoginRequest(BaseModel):
    # Username must contain 1 to 30 characters.
    username: str = Field(min_length=1, max_length=30)

    # Password must contain 1 to 72 characters.
    password: str = Field(min_length=1, max_length=72)

    # Clean the username before using it.
    @field_validator("username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        # Remove extra spaces and convert the username to lowercase.
        # This follows the same rule used during registration.
        return v.strip().lower()


# Define the information returned after a successful login.
class TokenOut(BaseModel):
    access_token: str  # The token used to access protected endpoints.
    token_type: str = "bearer"  # The type of token used for authentication.
    user: UserOut  # The user's information.


# Create an endpoint that allows users to log in.
@router.post("/login", response_model=TokenOut)
async def login(payload: LoginRequest):

    try:
        # Find the user in the database using their username.
        doc = await database.db.users.find_one(
            {"username": payload.username}
        )

    # Show an error if the database is unavailable.
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(
            503,
            "Database is unavailable. Please try again."
        )

    # Get the saved password hash if the user exists.
    hashed = (doc or {}).get("password_hash")

    # Check if the user does not exist or has no saved password hash.
    if not doc or not hashed:
        # Use extra processing time to help prevent username checking attacks.
        await run_in_threadpool(burn_time, payload.password)

        # Show a general error instead of revealing whether the username exists.
        raise HTTPException(401, "Invalid username or password.")

    # Check if the entered password matches the saved password hash.
    if not await run_in_threadpool(
        verify_password, payload.password, hashed
    ):
        # Reject the login if the password is incorrect.
        raise HTTPException(401, "Invalid username or password.")

    # Check if the account is active after confirming the password is correct.
    if doc.get("status", "active") != "active":
        # Prevent inactive or suspended accounts from logging in.
        raise HTTPException(
            403,
            "Your account is not active. Contact the administrator."
        )

    try:
        # Save the current time as the user's last login time.
        await database.db.users.update_one(
            {"_id": doc["_id"]},
            {"$set": {"last_login_at": utcnow()}}
        )

    except Exception:
        # Continue the login even if updating the last login time fails.
        pass

    # Create an access token using the user's ID and role.
    token = create_access_token(
        str(doc["_id"]),
        doc.get("role", "citizen")
    )

    # Return the access token and the user's information.
    return TokenOut(
        access_token=token,
        user=to_user_out(doc)
    )


# Create an endpoint that returns the current logged-in user's information.
@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):

    # Convert the user's database information into a UserOut object.
    return to_user_out(user)
