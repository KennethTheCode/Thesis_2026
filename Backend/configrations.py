from pymongo import MongoClient
uri = "mongodb+srv://paulekennethd_db_user:s25bneixozqs0dX4@cluster0.8ufnate.mongodb.net/?appName=Cluster0"
client = MongoClient(uri)
try:
    client.admin.command("ping")
    print("Connected successfully")
    client.close()

except Exception as e:
    raise Exception(
        "The following error occurred: ", e)