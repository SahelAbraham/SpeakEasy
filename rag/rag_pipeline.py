from rag.retrieve import retrieve_exercises


def build_query(profile, transcript):
    """
    Build a semantic search query using
    the user's profile and transcript.
    """

    query = f"""
    User Track:
    {profile['track']}

    User Subcategory:
    {profile['subcategory']}

    Transcript:
    {transcript}
    """

    return query


def rag_search(profile, transcript, n_results=3):

    query = build_query(profile, transcript)

    exercises = retrieve_exercises(
        query=query,
        track=profile["track"],
        subcategory=profile["subcategory"],
        n_results=n_results
    )

    return exercises


