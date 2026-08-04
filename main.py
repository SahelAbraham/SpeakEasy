from fastapi import FastAPI
from pydantic import BaseModel

from profile_builder import build_profile
from conversation import ConversationSession

app = FastAPI()

# Temporary in-memory sessions
sessions = {}


class StartSessionRequest(BaseModel):
    user_id: str
    name: str
    goal: str
    therapy_history: str
    native_language: str
    practice_frequency: str
    hearing_device: str
    notes: str
    transcript: str


@app.post("/session/start")
async def start_session(data: StartSessionRequest):

    # Build standardized profile
    onboarding = {
        "user_id": data.user_id,
        "name": data.name,
        "goal": data.goal,
        "therapy_history": data.therapy_history,
        "native_language": data.native_language,
        "practice_frequency": data.practice_frequency,
        "hearing_device": data.hearing_device,
        "notes": data.notes
    }

    profile = build_profile(onboarding)

    # Create conversation session
    session = ConversationSession(profile)

    # Get first exercise using RAG
    exercise = session.start(data.transcript)

    # Store session
    sessions[data.user_id] = session

    return {
        "user_id": data.user_id,
        "profile": profile,
        "exercise": exercise
    }
