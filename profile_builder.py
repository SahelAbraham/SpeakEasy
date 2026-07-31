def assign_track(onboarding):
    """
    Determines the user's track, subcategory,
    and modality based on onboarding responses.
    """

    goal = onboarding["goal"]

    if goal == "I get stuck, repeat words, or stutter when I speak":
        return (
            "Speech",
            "Fluency",
            "spoken"
        )

    elif goal == "People often find it hard to understand me":
        return (
            "Speech",
            "Motor Speech",
            "spoken"
        )

    elif goal == "I use a hearing device and want to improve my speech":
        return (
            "Speech",
            "Voice Disorders",
            "spoken"
        )

    elif goal == "I want to sound clearer or more confident in a second language":
        return (
            "Language",
            "Expressive - Spoken",
            "spoken"
        )

    # Default option
    return (
        "Language",
        "Expressive - Spoken",
        "spoken"
    )


def build_profile(onboarding):
    """
    Builds a standardized user profile from
    onboarding survey responses.
    """

    track, subcategory, modality = assign_track(onboarding)

    profile = {
        "user_id": onboarding["user_id"],
        "name": onboarding["name"],

        # Current version of SpeakEasy supports adults only
        "age_group": "adult",

        "track": track,
        "subcategory": subcategory,
        "modality": modality,

        "therapy_history": onboarding["therapy_history"],
        "native_language": onboarding["native_language"],
        "practice_frequency": onboarding["practice_frequency"],

        "primary_goal": onboarding["goal"],
        "hearing_device": onboarding["hearing_device"],
        "notes": onboarding["notes"]
    }

    return profile
