# This script creates the first admin account.
# Normal registration creates a citizen account, so this script sets the role to admin.
# Run this file from the backend folder using: python create_admin.py

import asyncio
from getpass import getpass

from pydantic import ValidationError
from pymongo.errors import DuplicateKeyError

import database
from schemas.common import utcnow
from security import hash_password_sync
from schemas.user import UserCreate


# This function collects the admin details and saves the account.
async def main():
    try:
        # Ask for the information needed to create the admin account.
        # getpass hides the password while it is being typed.
        data = UserCreate(
            username=input("Username: "),
            email=input("Email: "),
            contact_number=input("Contact number: "),
            address=input("Address: "),
            password=getpass("Password: "),
        )

    # Handle errors if the entered information is invalid.
    except ValidationError as e:
        # Display the field name and the reason for each validation error.
        for err in e.errors():
            print(f"- {err['loc'][-1]}: {err['msg']}")

        # Stop if the information is invalid.
        return

    # Connect to the database and prepare it for use.
    await database.init_db()

    # Prepare the admin information to save in the database.
    doc = {
        "username": data.username,
        # Hash the password before saving it for security.
        "password_hash": hash_password_sync(data.password),
        "email": data.email,
        "contact_number": data.contact_number,
        "address": data.address,

        # Set the account role to admin.
        "role": "admin",

        # Set the account status to active.
        "status": "active",

        # Save the current date and time when the account is created.
        "created_at": utcnow(),
    }

    try:
        # Save the new admin account in the users collection.
        await database.db.users.insert_one(doc)

        # Display a success message after creating the account.
        print(f"Admin '{data.username}' created.")

    # Handle an error if a unique field, such as the username or email, already exists.
    except DuplicateKeyError as e:
        # Display the name of the field that caused the duplicate error.
        print(
            "Already exists:",
            next(iter((e.details or {}).get("keyPattern", {})), "field")
        )


# Run the main function using asyncio.
asyncio.run(main())
