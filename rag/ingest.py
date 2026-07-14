import json
import chromadb
from pathlib import Path

# Create (or load) a persistent database
client = chromadb.PersistentClient(path="rag/chroma_db")

# Create a collection
collection = client.get_or_create_collection(
    name="exercise_bank"
)

# Load the exercise bank
with open(Path("exercise_bank.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

exercises = data["exercise_bank"]

# Add each exercise
for exercise in exercises:

    document = f"""
Title: {exercise['title']}

Track:
{exercise['track']}

Instructions:
{exercise['instructions']}
"""

    collection.add(
        ids=[exercise["id"]],
        documents=[document],
        metadatas=[
            {
                "track": exercise["track"],
                "title": exercise["title"]
            }
        ]
    )

print(f"Loaded {len(exercises)} exercises.")
