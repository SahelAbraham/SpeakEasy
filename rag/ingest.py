import json
import os
import chromadb

# rag/ingest.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))       # rag/
PROJECT_ROOT = os.path.dirname(BASE_DIR)                     # project root
DB_PATH = os.path.join(BASE_DIR, "chroma_db")                # chroma DB stays inside rag/
DATA_PATH = os.path.join(PROJECT_ROOT, "exercise_bank_final_v2.json")  # shared JSON at root

# Load exercise bank
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

exercises = data["exercise_bank"]

print(f"Found {len(exercises)} exercises.")


# Connect to ChromaDB
client = chromadb.PersistentClient(path=DB_PATH)


# Delete the old collection if it exists
try:
    client.delete_collection("exercise_bank")
    print("Deleted old exercise collection.")
except Exception:
    pass


# Create a fresh collection
collection = client.create_collection(name="exercise_bank")


documents = []
metadatas = []
ids = []


for exercise in exercises:

    # Text Chroma will use for semantic search
    document = f"""
Title: {exercise["title"]}

Track: {exercise["track"]}

Subcategory: {exercise["subcategory"]}

Instructions: {exercise["instructions"]}
"""

    documents.append(document)

    # Store structured info as metadata — including instructions,
    # so we can pull the clean instructions text back out later
    # instead of re-parsing the formatted document blob.
    metadata = {
        "title": exercise["title"],
        "track": exercise["track"],
        "subcategory": exercise["subcategory"],
        "scoring_type": exercise["scoring_type"],
        "instructions": exercise["instructions"],
    }

    # expected_answer can be a list or string, so store it as JSON text
    if exercise.get("expected_answer") is not None:
        metadata["expected_answer"] = json.dumps(exercise["expected_answer"])
    else:
        metadata["expected_answer"] = "null"

    metadatas.append(metadata)
    ids.append(exercise["id"])


collection.add(ids=ids, documents=documents, metadatas=metadatas)

print(f"Exercise bank successfully loaded into ChromaDB at {DB_PATH}")