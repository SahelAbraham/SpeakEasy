import json
import os
import chromadb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")


def get_collection():
    client = chromadb.PersistentClient(path=DB_PATH)
    return client.get_collection(name="exercise_bank")


def retrieve_exercises(query, track, subcategory, n_results=3):
    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where={
            "$and": [
                {"track": track},
                {"subcategory": subcategory},
            ]
        },
    )

    exercises = []

    if not results["ids"][0]:
        return exercises

    for i in range(len(results["ids"][0])):
        metadata = results["metadatas"][0][i]

        raw_expected = metadata.get("expected_answer", "null")
        expected_answer = None if raw_expected == "null" else json.loads(raw_expected)

        exercises.append({
            "id": results["ids"][0][i],
            "title": metadata["title"],
            "track": metadata["track"],
            "subcategory": metadata["subcategory"],
            "scoring_type": metadata["scoring_type"],
            "expected_answer": expected_answer,
            "instructions": metadata["instructions"],
        })

    return exercises