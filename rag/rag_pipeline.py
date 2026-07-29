from rag.retrieve import retrieve_exercises


def build_query(profile, transcript):
    """
    Builds a semantic search query using
    the user's onboarding profile
    and speech transcript.
    """

    query = f"""
    Track: {profile['track']}
    Subcategory: {profile.get('subcategory', '')}
    Age Group: {profile['age_group']}

    User Transcript:
    {transcript}
    """

    return query


def rag_search(profile, transcript):

    query = build_query(profile, transcript)

    exercises = retrieve_exercises(
        query=query,
        track=profile["track"],
        n_results=3
    )

    return exercises
