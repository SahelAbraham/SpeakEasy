from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import uuid
import os
import shutil

from knowledge_graph import create_user, switch_track, create_session, get_enrolled_track
from exercise_bank import get_exercise_by_id
from speech_analysis_final import process_exercise_attempt
from rag.rag_pipeline import rag_search
from subtrack_selector import choose_initial_subcategory, choose_next_subcategory
from feedback import generate_feedback, format_feedback_message

AUDIO_UPLOAD_DIR = "uploaded_audio"
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory session state — tracks seen exercise IDs and
# recent attempts (for feedback personalization) per session.
# Move into the knowledge graph later.
session_state = {}  # session_id -> {"seen_ids": set(), "recent_attempts": []}

class MessageData(BaseModel):
    text: str

class SurveyData(BaseModel):
    username: str
    email: str
    password: str
    name: str
    age: int
    occupation: str
    therapyHistory: Literal['current', 'past', 'none']
    track: Literal['Speech', 'Language']

class TrackSwitchData(BaseModel):
    user_id: str
    track: Literal['Speech', 'Language']

class SessionStartData(BaseModel):
    user_id: str

@app.get("/api/data")
def read_data():
    return {"status": "success", "message": "Data retrieved successfully."}

@app.post("/survey")
def build_profile(survey: SurveyData):
    user_id = str(uuid.uuid4())

    create_user(
        user_id=user_id,
        username=survey.username,
        email=survey.email,
        password=survey.password,
        name=survey.name,
        age=survey.age,
        occupation=survey.occupation,
        therapy_history=survey.therapyHistory,
        track=survey.track
    )

    return {
        "status": "success",
        "user_id": user_id,
        "name": survey.name,
        "track": survey.track,
    }

@app.post("/track/switch")
def switch_user_track(data: TrackSwitchData):
    try:
        switch_track(user_id=data.user_id, new_track=data.track)
    except RuntimeError as e:
        return {"status": "error", "message": str(e)}
    return {
        "status": "success",
        "user_id": data.user_id,
        "new_track": data.track,
    }

@app.post("/session/start")
def start_session(data: SessionStartData):
    try:
        session_info = create_session(user_id=data.user_id)
    except RuntimeError as e:
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "session_id": session_info["session_id"],
        "label": session_info["label"],
        "session_number": session_info["session_number"],
    }

@app.get("/exercise/first")
def get_first_exercise(user_id: str):
    try:
        track = get_enrolled_track(user_id)
        subcategory = choose_initial_subcategory(user_id, track)
        candidates = rag_search(
            profile={"track": track, "subcategory": subcategory},
            transcript="",
            n_results=5,
        )
        exercise = candidates[0] if candidates else None
        if exercise is None:
            return {"status": "error", "message": "No exercises found for this subcategory."}
    except RuntimeError as e:
        return {"status": "error", "message": str(e)}

    return {"status": "success", "exercise": exercise}

@app.post("/exercise/submit")
async def submit_exercise(
    user_id: str = Form(...),
    session_id: str = Form(...),
    exercise_id: str = Form(...),
    audio: UploadFile = File(...),
):
    file_extension = os.path.splitext(audio.filename)[1] or ".m4a"
    saved_filename = f"{user_id}_{exercise_id}_{uuid.uuid4()}{file_extension}"
    saved_path = os.path.join(AUDIO_UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    converted_path = os.path.splitext(saved_path)[0] + "_converted.wav"

    try:
        try:
            exercise = get_exercise_by_id(exercise_id)
        except ValueError as e:
            return {"status": "error", "message": str(e)}

        result = process_exercise_attempt(
            audio_path=saved_path,
            exercise_id=exercise_id,
            subcategory=exercise["subcategory"],
            user_id=user_id,
            session_id=session_id,
            scoring_type=exercise.get("scoring_type"),
            expected_answer=exercise.get("expected_answer"),
            exercise_instructions=exercise.get("instructions"),
            exercise_title=exercise.get("title"),
        )

        print(f"[SpeakEasy] Exercise '{exercise['title']}' scored: {result['score']}")

        state = session_state.setdefault(session_id, {"seen_ids": set(), "recent_attempts": []})
        state["seen_ids"].add(exercise_id)

        # ── generate user-facing feedback ───────────────────────────
        previous_performance = (
            {"recent_attempts": state["recent_attempts"][-5:]}
            if state["recent_attempts"] else {}
        )

        feedback_result = generate_feedback(
            analysis_result=result,
            exercise=exercise,
            user_profile={"track": exercise["track"], "subcategory": exercise["subcategory"]},
            previous_performance=previous_performance,
        )
        feedback_message = format_feedback_message(feedback_result)

        state["recent_attempts"].append({
            "exercise_id": exercise_id,
            "score": result["score"],
            "weak_phonemes": result.get("weak_phonemes", []),
        })

        # ── pick next exercise via RAG ──────────────────────────────
        try:
            next_subcategory = choose_next_subcategory(
                user_id=user_id,
                track=exercise["track"],
                last_subcategory=exercise["subcategory"],
                score_0_100=result["score"],
            )
            candidates = rag_search(
                profile={"track": exercise["track"], "subcategory": next_subcategory},
                transcript=result["transcription"],
                n_results=5,
            )
            next_exercise = next(
                (c for c in candidates if c["id"] not in state["seen_ids"]), None
            )
        except RuntimeError as e:
            print(f"[SpeakEasy] Failed to select next exercise: {e}")
            next_exercise = None

        return {
            "status": "success",
            "message": "Audio received and scored",
            "score": result["score"],
            "feedback": feedback_message,
            "feedback_details": feedback_result,
            "next_exercise": next_exercise,
        }

    finally:
        for path in (saved_path, converted_path):
            if os.path.exists(path):
                os.remove(path)