from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os

app = Flask(__name__)

# Allow requests from your React frontend
CORS(app)

# MongoDB Atlas connection
uri = "YOUR_MONGODB_CONNECTION_STRING"

client = MongoClient(
    uri,
    server_api=ServerApi("1")
)

# Database
db = client["thesis_2026"]

# Collection
users = db["users"]


# Test MongoDB connection
try:
    client.admin.command("ping")
    print("Successfully connected to MongoDB!")
except Exception as e:
    print("MongoDB connection failed:")
    print(e)


# Home route
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Flask server is running!",
        "mongodb": "connected"
    })


# Add user
@app.route("/add-user", methods=["POST"])
def add_user():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "message": "No data provided"
            }), 400

        name = data.get("name")
        email = data.get("email")

        if not name or not email:
            return jsonify({
                "message": "Name and email are required"
            }), 400

        user = {
            "name": name,
            "email": email
        }

        result = users.insert_one(user)

        return jsonify({
            "message": "User added successfully",
            "id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({
            "message": "Failed to add user",
            "error": str(e)
        }), 500


# Get all users
@app.route("/users", methods=["GET"])
def get_users():
    try:
        user_list = list(users.find())

        for user in user_list:
            user["_id"] = str(user["_id"])

        return jsonify(user_list), 200

    except Exception as e:
        return jsonify({
            "message": "Failed to get users",
            "error": str(e)
        }), 500


# Delete user
@app.route("/delete-user/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        from bson.objectid import ObjectId

        result = users.delete_one({
            "_id": ObjectId(user_id)
        })

        if result.deleted_count == 0:
            return jsonify({
                "message": "User not found"
            }), 404

        return jsonify({
            "message": "User deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Failed to delete user",
            "error": str(e)
        }), 500


# Run Flask
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )