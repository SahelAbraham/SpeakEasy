import uuid
from knowledge_graph import driver, log_session, log_phoneme_score, update_weak_phonemes

def record_session(driver, user_id, session_data):
    session_id = session_data.get("session_id") or str(uuid.uuid4())

    log_session(
        driver,
        user_id=user_id,
        session_id=session_id,
        overall_score=session_data["overall_score"],
        duration_seconds=session_data["duration_seconds"],
        speech_rate_wpm=session_data.get("speech_rate_wpm"),
        filler_total=session_data.get("filler_total"),
    )

    for phoneme, score in session_data.get("phoneme_scores", {}).items():
        log_phoneme_score(driver, session_id, phoneme, score)

    update_weak_phonemes(driver, user_id)

    return session_id


if __name__ == "__main__":
    record_session(driver, "test002", {
        "overall_score": 0.7,
        "duration_seconds": 42,
        "speech_rate_wpm": 110,
        "filler_total": 3,
        "phoneme_scores": {"/r/": 0.45, "/th/": 0.72},
    })