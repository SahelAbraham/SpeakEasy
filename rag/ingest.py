import json
from rag.vector_store import get_collection

collection = get_collection()

with open("exercise_bank_speech_language.json", "r", encoding="utf-8") as f:
    data = json.load(f)

exercises = data["exercise_bank"]

print(f"Loading {len(exercises)} exercises...")

# Remove existing documents so rerunning doesn't create duplicates
existing = collection.get()

if existing["ids"]:
    collection.delete(ids=existing["ids"])

for exercise in exercises:

    document = f"""
Title:
{exercise['title']}

Track:
{exercise['track']}

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

print("Done!")
