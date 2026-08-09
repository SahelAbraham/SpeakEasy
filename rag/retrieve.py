from rag.vector_store import get_collection

collection = get_collection()


def retrieve_exercises(
    query,
    track=None,
    subcategory=None,
    modality=None,
    n_results=3,
):
    # modality is accepted but unused: exercise_bank_speech_language.json no
    # longer has spoken/written variants (the Written subcategories were cut),
    # so there's nothing left to filter by. Kept as a no-op param so
    # rag_pipeline.py's existing modality=profile["modality"] call doesn't
    # break - rag_pipeline.py/profile_builder.py still compute a modality
    # value that has no exercise-bank counterpart anymore, worth a heads up
    # to Anvesha/Sahel rather than silently patched here.

    filters = {}

    if track:
        filters["track"] = track

    if subcategory:
        filters["subcategory"] = subcategory

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
            "instructions": results["documents"][0][i]
        })

    return exercises
