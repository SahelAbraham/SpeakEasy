from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import uuid

from conversation import ConversationSession
from knowledge_graph import create_user

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
