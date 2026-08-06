from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from profile_builder import build_profile
from conversation import ConversationSession

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

@app.get("/api/data")
def read_data():
    return {"status": "success", "message": "Data retrieved successfully."}

@app.post("/api/send")
def receive_data(data: MessageData):
    return {"status": "received", "your_text": f"Data received: {data.text}"}

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
