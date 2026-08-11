
from pymongo import MongoClient # type: ignore
from pymongo.server_api import ServerApi # type: ignore

uri = "mongodb+srv://paulekennethd_db_user:aozKkhzLGeWXicto@cluster0.yyrzrdi.mongodb.net/?appName=Cluster0"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)