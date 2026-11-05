# Import timedelta to set how long an access token remains valid.
from datetime import timedelta

# Import bcrypt to securely hash and check passwords.
import bcrypt

# Import jwt to create and read authentication tokens.
import jwt

from schemas.common import utcnow
from config import settings


# Create a dummy password hash to use when a username does not exist.
# This helps make login attempts take a similar amount of time
# for unknown usernames and incorrect passwords.
_DUMMY_HASH = bcrypt.hashpw(
    b"dummy-password",
    bcrypt.gensalt()
).decode()


# Check if the entered password matches the saved password hash.
def verify_password(plain: str, hashed: str) -> bool:
    try:
        # Compare the entered password with the saved hash.
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    # Return False if the password cannot be checked.
    # For example, bcrypt cannot check passwords longer than 72 bytes.
    except ValueError:
        return False


# Perform a password check to help prevent timing differences
# when the username does not exist.
def burn_time(plain: str) -> None:
    verify_password(plain, _DUMMY_HASH)


# Create an access token for a logged-in user.
def create_access_token(user_id: str, role: str) -> str:
    # Get the current date and time.
    now = utcnow()

    # Prepare the information to store inside the token.
    payload = {
        "sub": user_id,  # Store the user's ID.
        "role": role,  # Store the role for display purposes only.
        "iat": now,  # Store the time when the token was created.
        "exp": now + timedelta(
            minutes=settings.jwt_expire_minutes
        ),  # Set when the token expires.
    }

    # Create and return the signed access token.
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )


# Check the token and read its stored information.
def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,  # Use the secret key to verify the token.
        algorithms=[settings.jwt_algorithm],  # Allow the configured algorithm.
        options={"require": ["exp", "sub"]},  # Require an expiry time and user ID.
    )


# Convert a plain password into a secure hash before saving it.
def hash_password_sync(plain: str) -> str:
    # Generate a new salt, hash the password, and return the hash as text.
    return bcrypt.hashpw(
        plain.encode(),
        bcrypt.gensalt()
    ).decode()
