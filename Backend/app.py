from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.server_api import ServerApi

app = Flask(__name__)
CORS(app)

uri = "mongodb+srv://paulekennethd_db_user:aozKkhzLGeWXicto@cluster0.yyrzrdi.mongodb.net/?appName=Cluster0"

client = MongoClient(uri, server_api=ServerApi("1"))

db = client["thesis_2026"]
users = db["users"]


@app.route("/")
def home():
    return "Flask server is running!"


@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.json

    user = {
        "name": data["name"],
        "email": data["email"]
    }

    result = users.insert_one(user)

    return jsonify({
        "message": "User added successfully",
        "id": str(result.inserted_id)
    })


import os

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )