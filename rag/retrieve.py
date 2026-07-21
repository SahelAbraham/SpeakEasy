import chromadb

client = chromadb.PersistentClient(path="rag/chroma_db")
collection = client.get_collection("exercise_bank")


def query_exercises(query_text, track=None, n_results=3):
    """
    Semantic search over the exercise bank, optionally filtered to a single
    track so results stay relevant to the user's assigned track.

    track values must match whatever is stored in exercise_bank_v3.json's
    "track" field exactly (currently: Cognition, Speech, Language, Confidence) —
    NOT the Knowledge Graph's track_id scheme or the RL agent's skill areas,
    which use different naming. These three lists don't line up yet; confirm
    with the team which is canonical before treating this as final.
    """
    where_filter = {"track": track} if track else None

    results = collection.query(
        query_texts=[query_text],
        n_results=n_results,
        where=where_filter
    )
    return results


if __name__ == "__main__":
    # Example: track-filtered query
    results = query_exercises("memory exercise", track="Cognition", n_results=3)
    print(results)
