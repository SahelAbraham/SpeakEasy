from rag.vector_store import get_collection

collection = get_collection()


def retrieve_exercises(query, track=None, n_results=3):

    if track:
        results = collection.query(
            query_texts=[query],
            where={"track": track},
            n_results=n_results
        )
    else:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

    exercises = []

    for i in range(len(results["ids"][0])):

        exercises.append({
            "id": results["ids"][0][i],
            "title": results["metadatas"][0][i]["title"],
            "track": results["metadatas"][0][i]["track"],
            "instructions": results["documents"][0][i]
        })

    return exercises
