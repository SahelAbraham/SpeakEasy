import chromadb

client = chromadb.PersistentClient(path="rag/chroma_db")
collection = client.get_collection("exercise_bank")


def query_exercises(query_text, track=None, n_results=3):
    """
    Semantic search over the exercise bank, optionally filtered to a single
    track so results stay relevant to the user's assigned track.

    track values must match whatever is stored in exercise_bank_v3.json's
    "track" field exactly (Cognition, Speech, Language, Confidence). The
    Knowledge Graph's seed_tracks() now uses this same set of track_ids.
    Sahel's RL agent (Sahel_RLModel branch) still uses a different 5-area
    scheme (fluency, articulation, pronunciation, confidence, maintenance) —
    that still needs reconciling with the team before RL output can drive
    track-filtered retrieval directly.
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
