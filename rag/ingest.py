import json
import chromadb
from pathlib import Path

# Create/load persistent database
client = chromadb.PersistentClient(path="rag/chroma_db")

# Create collection
collection = client.get_or_create_collection(
    name="exercise_bank"
)

# Load JSON
with open("exercise_bank.json", "r", encoding="utf-8") as file:
    data = json.load(file)

exercises = data["exercise_bank"]

print(f"Found {len(exercises)} exercises.")

for exercise in exercises:

    document = f"""
Title: {exercise['title']}

Track: {exercise['track']}

Instructions:
{exercise['instructions']}
"""

    collection.add(
        ids=[exercise["id"]],
        documents=[document],
        metadatas=[{
            "track": exercise["track"],
            "title": exercise["title"]
        }]
    )

print("Exercise bank successfully loaded into ChromaDB.")
