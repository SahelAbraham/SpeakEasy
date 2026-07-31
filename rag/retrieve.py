from rag.vector_store import get_collection

collection = get_collection()


def retrieve_exercises(
    query,
    track=None,
    subcategory=None,
    modality=None,
    n_results=3,
):

    filters = {}

    if track:
        filters["track"] = track

    if subcategory:
        filters["subcategory"] = subcategory

    if modality:
        filters["modality"] = modality

    if filters:
        results = collection.query(
            query_texts=[query],
            where=filters,
            n_results=n_results
        )
    else:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

    exercises = []

    for i in range(len(results["ids"][0])):

        metadata = results["metadatas"][0][i]

        exercises.append({
            "id": metadata["id"],
            "title": metadata["title"],
            "track": metadata["track"],
            "subcategory": metadata["subcategory"],
            "modality": metadata["modality"],
            "instructions": results["documents"][0][i]
        })

    return exercises
