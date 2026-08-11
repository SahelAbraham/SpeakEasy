from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import uuid
import os
import shutil

from conversation import ConversationSession
from knowledge_graph import create_user, switch_track, create_session
from exercise_bank import get_random_exercise, get_exercise_by_id
from speech_analysis_final import process_exercise_attempt

AUDIO_UPLOAD_DIR = "uploaded_audio"
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# CORS Configuration

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)   

# Temporary in-memory sessions
sessions = {}

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
    
    # Generate an ID for the user for the knowledge graph
    user_id = str(uuid.uuid4())
    
    print("Received survey submission:")
    print(f"User ID: {user_id}")
    print(f"Name: {survey.name}")
    print(f"Age: {survey.age}")
    print(f"Occupation: {survey.occupation}")
    print(f"Therapy History: {survey.therapyHistory}")
    print(f"Track: {survey.track}")
    
    # Create the user in the knowledge graph

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
def get_first_exercise(track: Literal['Speech', 'Language']):
    try:
        exercise = get_random_exercise(track)
    except ValueError as e:
        return {"status": "error", "message": str(e)}
    return {
        "status": "success",
        "exercise": exercise
    }

@app.post("/exercise/submit")
async def submit_exercise(
    user_id: str = Form(...),
    session_id: str = Form(...),
    exercise_id: str = Form(...),
    audio: UploadFile = File(...),
):
    # Save the uploaded audio to disk
    file_extension = os.path.splitext(audio.filename)[1] or ".m4a"
    saved_filename = f"{user_id}_{exercise_id}_{uuid.uuid4()}{file_extension}"
    saved_path = os.path.join(AUDIO_UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # The converted .wav file that speech_analysis.py's convert_to_wav will create
    converted_path = os.path.splitext(saved_path)[0] + "_converted.wav"

    try:
        # Look up the exercise's scoring metadata from the exercise bank
        try:
            exercise = get_exercise_by_id(exercise_id)
        except ValueError as e:
            return {"status": "error", "message": str(e)}

        # Run the full analysis + scoring pipeline
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

        return {
            "status": "success",
            "message": "Audio received and scored",
            "score": result["score"],
        }

    finally:
        # Clean up both the original upload and the converted .wav copy,
        # regardless of whether scoring succeeded or failed
        for path in (saved_path, converted_path):
            if os.path.exists(path):
                os.remove(path)
        
# class StartSessionRequest(BaseModel):
#     user_id: str
#     name: str
#     goal: str
#     therapy_history: str
#     native_language: str
#     practice_frequency: str
#     hearing_device: str
#     notes: str
#     transcript: str

# KG data:
# email
# age group
# native language
# timestamp (don't worry)
# trackID

# @app.post("/session/start")
# class RespondRequest(BaseModel):
#     user_id: str
#     response: str


# @app.post("/session/respond")
# async def respond_to_exercise(data: RespondRequest):

#     # Find the user's active session
#     session = sessions.get(data.user_id)

#     if session is None:
#         return {
#             "error": "No active session found for this user."
#         }

#     # Save response and get next exercise
#     next_exercise = session.submit_response(data.response)

#     # Check whether session is finished
#     if next_exercise is None:
#         return {
#             "user_id": data.user_id,
#             "session_complete": True,
#             "message": "Great job! You've completed this practice session."
#         }

#     return {
#         "user_id": data.user_id,
#         "session_complete": False,
#         "exercise": next_exercise
#     }
# async def start_session(data: StartSessionRequest):

#     # Build standardized profile
#     onboarding = {
#         "user_id": data.user_id,
#         "name": data.name,
#         "goal": data.goal,
#         "therapy_history": data.therapy_history,
#         "native_language": data.native_language,
#         "practice_frequency": data.practice_frequency,
#         "hearing_device": data.hearing_device,
#         "notes": data.notes
#     }

#     profile = build_profile(onboarding)

#     # Create conversation session
#     session = ConversationSession(profile)

#     # Get first exercise using RAG
#     exercise = session.start(data.transcript)

#     # Store session
#     sessions[data.user_id] = session

#     return {
#         "user_id": data.user_id,
#         "profile": profile,
#         "exercise": exercise
#     }
