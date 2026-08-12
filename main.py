from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import uuid
import os
import shutil

from knowledge_graph import create_user, switch_track, create_session, get_enrolled_track, record_exercise_attempt, get_progress_stats, get_subtrack_progression
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
    print(f"[SpeakEasy] /session/start called for user_id={data.user_id}")
    try:
        session_info = create_session(user_id=data.user_id)
    except RuntimeError as e:
        print(f"[SpeakEasy] /session/start FAILED for user_id={data.user_id}: {e}")
        return {"status": "error", "message": str(e)}

    print(
        f"[SpeakEasy] /session/start OK — session_id={session_info['session_id']} "
        f"label={session_info['label']} for user_id={data.user_id}"
    )

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
        print(f"[SpeakEasy] /exercise/first — user_id={user_id} track={track!r} subcategory={subcategory!r}")

        candidates = rag_search(
            profile={"track": track, "subcategory": subcategory},
            transcript="",
            n_results=5,
        )
        print(f"[SpeakEasy] /exercise/first — got {len(candidates)} candidates: "
              f"{[(c['id'], c['track'], c['subcategory']) for c in candidates]}")

        exercise = candidates[0] if candidates else None
        if exercise is None:
            return {"status": "error", "message": "No exercises found for this subcategory."}

        if exercise["track"] != track:
            print(f"[SpeakEasy] ⚠️ TRACK MISMATCH — requested track={track!r} but got "
                  f"exercise {exercise['id']} with track={exercise['track']!r}")
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
    print(
        f"[SpeakEasy] /exercise/submit called — user_id={user_id} "
        f"session_id={session_id} exercise_id={exercise_id}"
    )

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

        try:
            new_exercise_node_id = record_exercise_attempt(
                user_id=user_id,
                session_id=session_id,
                exercise=exercise,
                result=result,
            )
            print(
                f"[SpeakEasy] Recorded Exercise node {new_exercise_node_id} "
                f"under session {session_id} for user {user_id}"
            )
        except RuntimeError as e:
            # This is the failure to watch for: it almost always means the
            # session_id sent from the client doesn't have a HAS_SESSION
            # edge to this user in Neo4j (stale/expired session on the
            # frontend). Surfacing it (instead of silently continuing)
            # so it's visible during testing.
            print(f"[SpeakEasy] ⚠️ FAILED to record exercise in KG: {e}")
            return {
                "status": "error",
                "message": f"Could not save this attempt to your session: {e}",
            }

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
            if next_exercise and next_exercise["track"] != exercise["track"]:
                print(
                    f"[SpeakEasy] ⚠️ TRACK MISMATCH on next_exercise — expected "
                    f"track={exercise['track']!r} but got {next_exercise['id']} "
                    f"with track={next_exercise['track']!r}"
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
                
@app.get("/progress")
def get_progress(user_id: str, session_id: str):
    try:
        stats = get_progress_stats(user_id=user_id, session_id=session_id)
    except RuntimeError as e:
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "session_exercises": stats["session_exercises"],
        "total_exercises": stats["total_exercises"],
        "total_sessions": stats["total_sessions"],
    }

@app.get("/progression")
def get_progression(user_id: str):
    try:
        sessions = get_subtrack_progression(user_id=user_id)
    except RuntimeError as e:
        return {"status": "error", "message": str(e)}
    return {"status": "success", "sessions": sessions}