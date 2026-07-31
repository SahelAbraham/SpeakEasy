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

    Modality:
    {profile['modality']}

    Age Group:
    {profile['age_group']}

    Transcript:
    {transcript}
    """

    return query


def rag_search(profile, transcript):

    query = build_query(profile, transcript)

    exercises = retrieve_exercises(
        query=query,
        track=profile["track"],
        subcategory=profile["subcategory"],
        modality=profile["modality"],
        n_results=3,
    )

    return exercises
