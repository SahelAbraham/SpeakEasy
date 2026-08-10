import json
import chromadb


# Load exercise bank
with open("exercise_bank_final_v2.json", "r", encoding="utf-8") as f:
    data = json.load(f)

exercises = data["exercise_bank"]

print(f"Found {len(exercises)} exercises.")


# Connect to ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")


# Delete the old collection if it exists
try:
    client.delete_collection("exercise_bank")
    print("Deleted old exercise collection.")
except Exception:
    pass


# Create a fresh collection
collection = client.create_collection(
    name="exercise_bank"
)


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

    # Store important structured information as metadata
    metadata = {
        "title": exercise["title"],
        "track": exercise["track"],
        "subcategory": exercise["subcategory"],
        "scoring_type": exercise["scoring_type"]
    }

    # expected_answer can be a list or string,
    # so store it as JSON text in metadata.
    if exercise.get("expected_answer") is not None:
        metadata["expected_answer"] = json.dumps(
            exercise["expected_answer"]
        )
    else:
        metadata["expected_answer"] = "null"

    metadatas.append(metadata)
    ids.append(exercise["id"])


# Add everything to ChromaDB
collection.add(
    ids=ids,
    documents=documents,
    metadatas=metadatas
)


print("Exercise bank successfully loaded into ChromaDB.")
