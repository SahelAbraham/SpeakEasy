import uuid
import time

from knowledge_graph import (
    driver,
    create_user,
    assign_tracks,
    log_session,
    log_phoneme_score,
    update_weak_phonemes,
    get_all_sessions,
    get_phoneme_scores_by_session,
)

TEST_USER_ID = f"test_multi_session_{uuid.uuid4().hex[:8]}"

# Six sessions of synthetic data. /r/ stays consistently low (should end up
# WEAK_AT), /s/ stays consistently high (should not), /th/ improves over time.
SESSIONS = [
    {"overall_score": 0.55, "duration_seconds": 240, "speech_rate_wpm": 95,  "filler_total": 6, "phonemes": {"/r/": 0.35, "/s/": 0.82, "/th/": 0.40}},
    {"overall_score": 0.58, "duration_seconds": 250, "speech_rate_wpm": 98,  "filler_total": 5, "phonemes": {"/r/": 0.38, "/s/": 0.85, "/th/": 0.48}},
    {"overall_score": 0.62, "duration_seconds": 260, "speech_rate_wpm": 102, "filler_total": 4, "phonemes": {"/r/": 0.41, "/s/": 0.80, "/th/": 0.55}},
    {"overall_score": 0.65, "duration_seconds": 255, "speech_rate_wpm": 105, "filler_total": 4, "phonemes": {"/r/": 0.37, "/s/": 0.88, "/th/": 0.63}},
    {"overall_score": 0.70, "duration_seconds": 270, "speech_rate_wpm": 110, "filler_total": 3, "phonemes": {"/r/": 0.44, "/s/": 0.83, "/th/": 0.71}},
    {"overall_score": 0.74, "duration_seconds": 265, "speech_rate_wpm": 112, "filler_total": 2, "phonemes": {"/r/": 0.40, "/s/": 0.86, "/th/": 0.78}},
]


def cleanup():
    with driver.session() as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (u:User {user_id: $user_id})
                OPTIONAL MATCH (u)-[:HAS_SESSION]->(s:Session)
                OPTIONAL MATCH (s)-[:CONTAINS_SCORE]->(sc:Score)
                DETACH DELETE u, s, sc
            """, user_id=TEST_USER_ID)
        )


def run():
    failures = []

    def check(label, condition):
        status = "PASS" if condition else "FAIL"
        print(f"[{status}] {label}")
        if not condition:
            failures.append(label)

    create_user(driver, TEST_USER_ID, "+10000000000", "adult", "English")
    assign_tracks(driver, TEST_USER_ID, "Speech")

    for i, sess in enumerate(SESSIONS):
        session_id = f"{TEST_USER_ID}_session_{i}"
        log_session(
            driver,
            user_id=TEST_USER_ID,
            session_id=session_id,
            overall_score=sess["overall_score"],
            duration_seconds=sess["duration_seconds"],
            speech_rate_wpm=sess["speech_rate_wpm"],
            filler_total=sess["filler_total"],
        )
        for phoneme, score in sess["phonemes"].items():
            log_phoneme_score(driver, session_id, phoneme, score)
        time.sleep(0.05)  # ensure distinct timestamps for ordering checks

    update_weak_phonemes(driver, TEST_USER_ID, threshold=0.6)

    all_sessions = get_all_sessions(driver, TEST_USER_ID)
    check("logged all 6 sessions", len(all_sessions) == len(SESSIONS))
    check(
        "sessions returned oldest-first",
        all(all_sessions[i]["timestamp"] <= all_sessions[i + 1]["timestamp"] for i in range(len(all_sessions) - 1))
    )
    check(
        "overall_score values round-trip correctly",
        [s["overall_score"] for s in all_sessions] == [s["overall_score"] for s in SESSIONS]
    )
    check(
        "speech_rate_wpm values round-trip correctly",
        [s["speech_rate_wpm"] for s in all_sessions] == [s["speech_rate_wpm"] for s in SESSIONS]
    )

    phoneme_rows = get_phoneme_scores_by_session(driver, TEST_USER_ID)
    check("phoneme score row count matches (6 sessions x 3 phonemes)", len(phoneme_rows) == len(SESSIONS) * 3)

    with driver.session() as session:
        weak = session.run("""
            MATCH (u:User {user_id: $user_id})-[:WEAK_AT]->(p:Phoneme)
            RETURN p.symbol AS symbol
        """, user_id=TEST_USER_ID)
        weak_symbols = {row["symbol"] for row in weak}

    check("/r/ (consistently low ~0.39 avg) flagged as weak", "/r/" in weak_symbols)
    check("/s/ (consistently high ~0.84 avg) NOT flagged as weak", "/s/" not in weak_symbols)
    check("/th/ (avg ~0.59, improving, below 0.6 threshold) flagged as weak", "/th/" in weak_symbols)

    cleanup()

    with driver.session() as session:
        remaining = session.run(
            "MATCH (u:User {user_id: $user_id}) RETURN u LIMIT 1", user_id=TEST_USER_ID
        ).single()
    check("test user cleaned up after test", remaining is None)

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED: {failures}")
    else:
        print(f"All {len(SESSIONS)}-session multi-session KG test checks passed.")
    return len(failures) == 0


if __name__ == "__main__":
    import sys
    success = run()
    sys.exit(0 if success else 1)
