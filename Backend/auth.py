# This file handles user authentication and checks user permissions.
# It gets the user's role from the database, not from the token.

import jwt
from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError

import database
from security import decode_token
from schemas.user import UserOut


# Allows the system to receive an authentication token from a request.
# auto_error=False lets us handle missing tokens with our own error message.
bearer = HTTPBearer(auto_error=False)

# Adds the required authentication header to 401 error responses.
_401 = {"WWW-Authenticate": "Bearer"}


# Converts user data from the database into a UserOut object.
def to_user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),  # Convert the database ID into a string.
        username=doc.get("username", ""),  # Get the username or use an empty string.
        contact_number=doc.get("contact_number", ""),  # Get the contact number.
        status=doc.get("status", "active"),  # Get the account status.
        email=doc.get("email"),  # Get the user's email address.
        role=doc.get("role", "citizen"),  # Get the user's role.
    )


# Checks if the user has a valid token and an active account.
async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer)
) -> dict:

    # Check if the request includes an authentication token.
    if creds is None:
        raise HTTPException(401, "Not authenticated.", headers=_401)

    try:
        # Decode the token to get the user's information.
        payload = decode_token(creds.credentials)

    # Show an error if the token has expired.
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            401,
            "Session expired. Please log in again.",
            headers=_401
        )

    # Show an error if the token is invalid.
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token.", headers=_401)

    # Get the user's ID from the token.
    user_id = payload.get("sub")

    # Check if the user ID is a valid string and MongoDB ObjectId.
    if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
        raise HTTPException(401, "Invalid token.", headers=_401)

    try:
        # Find the user in the database using their ID.
        # The user's current role is taken from the database.
        doc = await database.db.users.find_one(
            {"_id": ObjectId(user_id)}
        )

    # Show an error if the database cannot be reached.
    except (ServerSelectionTimeoutError, AutoReconnect):
        raise HTTPException(
            503,
            "Database is unavailable. Please try again."
        )

    # Check if the user still exists in the database.
    if doc is None:
        raise HTTPException(401, "Invalid token.", headers=_401)

    # Allow access only if the account is active.
    if doc.get("status", "active") != "active":
        raise HTTPException(403, "Your account is not active.")

    # Return the user's database information.
    return doc


# Checks if the user has one of the required roles.
def require_roles(*roles: str):

    # Get the currently logged-in user.
    async def checker(user: dict = Depends(get_current_user)):

        # Check if the user's role is allowed to access the resource.
        if user.get("role", "citizen") not in roles:
            raise HTTPException(
                403,
                "You do not have permission to access this resource."
            )

        # Return the user if their role is allowed.
        return user

    # Return the checker for use in protected API endpoints.
    return checker


# Allows only users with the admin role to access protected resources.
require_admin = require_roles("admin")
