# T05: Test if users can access features based on their roles.
# This test uses a separate test database to protect real data.

import os, sys

# Set the name of the database used only for testing.
TEST_DB = "resqbinan_test_t05"

# Tell the application to use the test database.
os.environ["DB_NAME"] = TEST_DB

# Set a secret key for creating and checking test tokens.
os.environ["JWT_SECRET"] = "test-secret-test-secret-test-secret-123456"

# Add the project folder to Python's search path.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import timedelta  # noqa: E402

import bcrypt  # noqa: E402
import jwt  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402

from schemas.common import utcnow  # noqa: E402
from config import settings  # noqa: E402


# Set the password used by the test accounts.
PW = "Passw0rd!x"

# List the endpoints that only admins can access.
ADMIN_ONLY = ["/api/admin/dashboard", "/api/admin/users"]


# Create sample user information for testing.
def _user(username, role, status="active", n=0):
    return {
        "username": username,

        # Hash the test password before storing it.
        "password_hash": bcrypt.hashpw(
            PW.encode(), bcrypt.gensalt()
        ).decode(),

        # Create sample contact information for the test user.
        "email": f"{username}@test.com",
        "contact_number": f"0917000000{n}",
        "address": "Biñan",

        # Set the user's role and account status.
        "role": role,
        "status": status,

        # Save the account creation time.
        "created_at": utcnow()
    }


# Prepare the test database and API client.
@pytest.fixture(scope="module")
def client():

    # Stop the test if the application is not using the test database.
    assert settings.db_name == TEST_DB, (
        "Refusing to run: not pointing at the test database"
    )

    # Connect to MongoDB using a synchronous client.
    sync = MongoClient(settings.mongodb_url)

    # Clear the old test database before running the tests.
    sync.drop_database(TEST_DB)

    # Import the FastAPI application.
    from main import app

    # Start the application and create a test client.
    # The application startup also prepares collections and indexes.
    with TestClient(app) as c:

        # Add an admin, a normal citizen, and a suspended citizen.
        sync[TEST_DB].users.insert_many([
            _user("admin_t", "admin", n=1),
            _user("citizen_t", "citizen", n=2),
            _user("suspended_t", "citizen", "suspended", n=3),
        ])

        # Save user IDs so the tests can use them later.
        c.ids = {
            u["username"]: str(u["_id"])
            for u in sync[TEST_DB].users.find()
        }

        # Provide the client to the test functions.
        yield c

    # Delete the test database after the tests finish.
    sync.drop_database(TEST_DB)

    # Close the MongoDB connection.
    sync.close()


# Log in a user and return the API response.
def login(c, username, password=PW):
    return c.post(
        "/api/auth/login",
        json={"username": username, "password": password}
    )


# Create the authorization header using an access token.
def hdr(token):
    return {"Authorization": f"Bearer {token}"}


# Check that an admin can log in and receives the admin role.
def test_admin_login_gets_admin_role(client):
    r = login(client, "admin_t")

    # Check the login succeeds and the returned role is admin.
    assert r.status_code == 200 and r.json()["user"]["role"] == "admin"

    # Make sure the response does not expose a password.
    assert "password" not in r.text


# Check that a normal citizen logs in with the citizen role.
def test_user_login_gets_non_admin_role(client):
    r = login(client, "citizen_t")

    # Check the login succeeds and the role is citizen.
    assert r.status_code == 200 and r.json()["user"]["role"] == "citizen"


# Check that wrong passwords and unknown usernames return the same error.
def test_wrong_password_and_unknown_user_same_401(client):
    a = login(client, "admin_t", "wrong-pass1")
    b = login(client, "nobody_here")

    # Both attempts should return HTTP 401.
    assert a.status_code == b.status_code == 401

    # Both attempts should show the same error message.
    assert a.json()["detail"] == b.json()["detail"]


# Check that protected endpoints reject requests without a token.
@pytest.mark.parametrize(
    "path",
    ADMIN_ONLY + ["/api/user/panel", "/api/auth/me"]
)
def test_no_token_is_401(client, path):
    # A request without a token should return HTTP 401.
    assert client.get(path).status_code == 401


# Check that normal users cannot access admin endpoints.
@pytest.mark.parametrize("path", ADMIN_ONLY)
def test_user_token_gets_403_on_admin_api(client, path):

    # Log in as a citizen and get their access token.
    token = login(client, "citizen_t").json()["access_token"]

    # The citizen should receive HTTP 403 when accessing admin endpoints.
    assert client.get(
        path, headers=hdr(token)
    ).status_code == 403


# Check that admins can access admin endpoints.
@pytest.mark.parametrize("path", ADMIN_ONLY)
def test_admin_token_gets_200_on_admin_api(client, path):

    # Log in as an admin and get their access token.
    token = login(client, "admin_t").json()["access_token"]

    # The admin should receive HTTP 200 when accessing admin endpoints.
    assert client.get(
        path, headers=hdr(token)
    ).status_code == 200


# Check that a logged-in citizen can open their user panel.
def test_user_can_open_user_panel(client):

    # Log in as a citizen and get their access token.
    token = login(client, "citizen_t").json()["access_token"]

    # Open the user's panel using the token.
    r = client.get(
        "/api/user/panel",
        headers=hdr(token)
    )

    # Check that access is allowed and the correct profile is returned.
    assert (
        r.status_code == 200
        and r.json()["profile"]["username"] == "citizen_t"
    )


# Check that invalid, expired, or forged tokens are rejected.
def test_tampered_expired_and_forged_role_tokens_rejected(client):

    # Get the citizen's database ID.
    uid = client.ids["citizen_t"]

    # Get the secret key and current time for creating test tokens.
    secret, now = settings.jwt_secret, utcnow()

    # Create a token that has already expired.
    expired = jwt.encode(
        {
            "sub": uid,
            "role": "citizen",
            "exp": now - timedelta(minutes=1)
        },
        secret,
        "HS256"
    )

    # Create a token signed with the wrong secret key.
    wrong_key = jwt.encode(
        {
            "sub": uid,
            "role": "admin",
            "exp": now + timedelta(hours=1)
        },
        "other-key-other-key-other-key-1234",
        "HS256"
    )

    # Create a validly signed token that falsely claims the citizen is an admin.
    forged_role = jwt.encode(
        {
            "sub": uid,
            "role": "admin",
            "exp": now + timedelta(hours=1)
        },
        secret,
        "HS256"
    )

    # An expired token should be rejected with HTTP 401.
    assert client.get(
        "/api/auth/me", headers=hdr(expired)
    ).status_code == 401

    # A token signed with the wrong key should be rejected.
    assert client.get(
        "/api/auth/me", headers=hdr(wrong_key)
    ).status_code == 401

    # A token that is not a valid JWT should be rejected.
    assert client.get(
        "/api/auth/me", headers=hdr("not.a.jwt")
    ).status_code == 401

    # Even with a valid signature, claiming to be an admin is not enough.
    # The server checks the user's actual role in the database.
    assert client.get(
        "/api/admin/users", headers=hdr(forged_role)
    ).status_code == 403


# Check that a suspended account cannot log in.
def test_suspended_account_cannot_login(client):
    assert login(client, "suspended_t").status_code == 403


# Check that admins cannot demote themselves and that update validation works.
def test_admin_cannot_demote_self_and_role_change_applies(client):

    # Log in as an admin and get their access token.
    admin_t = login(client, "admin_t").json()["access_token"]

    # Try to change the admin's own role to citizen.
    # The request should be rejected with HTTP 400.
    r = client.patch(
        f"/api/admin/users/{client.ids['admin_t']}",
        json={"role": "citizen"},
        headers=hdr(admin_t)
    )
    assert r.status_code == 400

    # An invalid user ID should also be rejected with HTTP 400.
    assert client.patch(
        "/api/admin/users/not-an-id",
        json={"role": "admin"},
        headers=hdr(admin_t)
    ).status_code == 400

    # An empty update should be rejected because no field was provided.
    assert client.patch(
        f"/api/admin/users/{client.ids['citizen_t']}",
        json={},
        headers=hdr(admin_t)
    ).status_code == 422
