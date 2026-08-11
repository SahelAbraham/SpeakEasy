import json
import os
import random

_EXERCISE_BANK_PATH = os.path.join(os.path.dirname(__file__), "exercise_bank_final_v2.json")

with open(_EXERCISE_BANK_PATH, "r") as f:
    _data = json.load(f)

EXERCISES = _data["exercise_bank"]

def get_exercise_by_id(exercise_id: str) -> dict:
    for exercise in EXERCISES:
        if exercise["id"] == exercise_id:
            return exercise
    raise ValueError(f"Exercise not found: {exercise_id}")

def get_random_exercise(track: str) -> dict:
    candidates = [e for e in EXERCISES if e["track"] == track]
    
    if not candidates:
        raise ValueError(f"No exercises found for track: {track}")
    
    return random.choice(candidates)