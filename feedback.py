# feedback.py

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

_llm_model = genai.GenerativeModel("gemini-3.5-flash-lite")


def _format_weak_phonemes(weak_phonemes):
    """
    Convert Rabiah's weak phoneme dictionaries
    into something easier for the LLM to understand.
    """

    if not weak_phonemes:
        return []

    formatted = []

    for item in weak_phonemes:
        formatted.append({
            "word": item.get("word"),
            "phoneme": item.get("weakest_phoneme"),
            "confidence": item.get("confidence"),
            "start": item.get("start"),
            "end": item.get("end")
        })

    return formatted


def generate_feedback(
    analysis_result,
    exercise=None,
    user_profile=None,
    previous_performance=None
):
    """
    Generate personalized feedback using the speech-analysis
    results produced by Rabiah's pipeline.

    Rabiah's pipeline is responsible for analysis.
    This function is responsible for explaining those
    results to the user.
    """

    if analysis_result is None:
        return "Nice work completing the exercise! Let's keep practicing."

    weak_phonemes = _format_weak_phonemes(
        analysis_result.get("weak_phonemes", [])
    )

    feedback_input = {
        "exercise": exercise or {},
        "user_profile": user_profile or {},
        "current_result": {
            "transcription": analysis_result.get("transcription"),
            "score": analysis_result.get("score"),
            "scoring_method": analysis_result.get("scoring_method"),
            "scoring_details": analysis_result.get("scoring_details", {}),
            "pronunciation_score": analysis_result.get("pronunciation_score"),
            "speech_rate_wpm": analysis_result.get("speech_rate_wpm"),
            "filler_words": analysis_result.get("filler_words", {}),
            "filler_total": analysis_result.get("filler_total", 0),
            "weak_phonemes": weak_phonemes
        },
        "previous_performance": previous_performance or {}
    }

    prompt = f"""
You are the feedback assistant for SpeakEasy, an AI speech
practice application.

Your job is to turn objective speech-analysis results into
short, encouraging, personalized feedback.

IMPORTANT:
- Do NOT perform your own speech analysis.
- Do NOT invent errors that are not present in the analysis.
- Use the provided scores and detected weak phonemes.
- Be encouraging rather than judgmental.
- Give ONE or TWO specific suggestions when appropriate.
- Do not overwhelm the user with technical terminology.
- Do not diagnose medical conditions.
- Do not mention that an AI or language model generated the feedback.
- Keep the feedback concise enough for WhatsApp.
- Focus on what the user can do next.

Exercise:
{json.dumps(feedback_input["exercise"], indent=2)}

User profile:
{json.dumps(feedback_input["user_profile"], indent=2)}

Current result:
{json.dumps(feedback_input["current_result"], indent=2)}

Previous performance:
{json.dumps(feedback_input["previous_performance"], indent=2)}

Return ONLY valid JSON:

{{
    "feedback": "short personalized feedback for the user",
    "suggestion": "one specific practice suggestion",
    "encouragement": "short encouraging closing"
}}
"""

    try:
        response = _llm_model.generate_content(prompt)

        text = response.text.strip()

        # Remove markdown code fences if Gemini adds them
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

        result = json.loads(text)

        return {
            "feedback": result.get("feedback", ""),
            "suggestion": result.get("suggestion", ""),
            "encouragement": result.get("encouragement", "")
        }

    except Exception as e:

        # Safe fallback if Gemini fails
        score = analysis_result.get("score")

        if score is not None and score >= 85:
            fallback = "Great job! You did really well on this exercise."
        elif score is not None and score >= 70:
            fallback = "Nice work! You're making good progress."
        elif score is not None:
            fallback = "Good effort! Keep practicing and you'll improve."

        else:
            fallback = "Nice work completing the exercise! Let's keep practicing."

        return {
            "feedback": fallback,
            "suggestion": "Keep practicing this skill.",
            "encouragement": "You've got this!"
        }


def format_feedback_message(feedback_result):
    """
    Turn the structured LLM response into the actual
    WhatsApp message.
    """

    if not feedback_result:
        return "Nice work completing the exercise! Let's keep practicing."

    parts = []

    if feedback_result.get("feedback"):
        parts.append(feedback_result["feedback"])

    if feedback_result.get("suggestion"):
        parts.append(feedback_result["suggestion"])

    if feedback_result.get("encouragement"):
        parts.append(feedback_result["encouragement"])

    return " ".join(parts)
