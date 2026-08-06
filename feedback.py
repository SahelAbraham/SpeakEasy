def generate_feedback(
    pronunciation_score=None,
    fluency_score=None,
    weak_phonemes=None
):
    """
    Generate simple rule-based feedback from speech-analysis results.
    """

    if weak_phonemes is None:
        weak_phonemes = []

    # If no scores are available yet
    if pronunciation_score is None and fluency_score is None:
        return "Nice work completing the exercise! Let's keep practicing."

    # Use whichever scores are available
    scores = []

    if pronunciation_score is not None:
        scores.append(pronunciation_score)

    if fluency_score is not None:
        scores.append(fluency_score)

    overall_score = sum(scores) / len(scores)

    # Generate feedback based on performance
    if overall_score >= 0.90:
        feedback = (
            "Great job! Your speech was very clear. "
            "You're doing really well."
        )

    elif overall_score >= 0.75:
        feedback = (
            "Nice work! You did well overall. "
            "Keep practicing to make your speech even clearer."
        )

    elif overall_score >= 0.60:
        feedback = (
            "Good effort! You're making progress. "
            "Let's keep practicing this skill."
        )

    else:
        feedback = (
            "Nice attempt! This is a skill we're still working on. "
            "Let's try another exercise and keep practicing."
        )

    # Add phoneme-specific information if available
    if weak_phonemes:
        phonemes = ", ".join(weak_phonemes)

        feedback += (
            f" We can spend a little more time practicing "
            f"{phonemes}."
        )

    return feedback
