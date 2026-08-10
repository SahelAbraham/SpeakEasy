import chromadb


def get_collection():
    client = chromadb.PersistentClient(path="./chroma_db")

    collection = client.get_collection(
        name="exercise_bank"
    )

    return collection


def retrieve_exercises(
    query,
    track,
    subcategory,
    n_results=3
):
    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where={
            "$and": [
                {"track": track},
                {"subcategory": subcategory}
            ]
        }
    )

    exercises = []

    for i in range(len(results["ids"][0])):

        metadata = results["metadatas"][0][i]

        exercises.append({
            "id": results["ids"][0][i],
            "title": metadata["title"],
            "track": metadata["track"],
            "subcategory": metadata["subcategory"],
            "scoring_type": metadata["scoring_type"],
            "expected_answer": metadata["expected_answer"],
            "instructions": results["documents"][0][i]
        })

    return exercises
