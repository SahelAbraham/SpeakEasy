"""
Sprint 3: Test Knowledge Graph with multi-session, multi-attempt user data.

Simulates 2 sessions with 3 question attempts each for one test user, then
verifies graph integrity and query accuracy at both the session level and
the new per-attempt level: attempt count/ordering, score/JSON-field
round-tripping, and WEAK_AT roll-up from Attempt-[:WEAK_AT]->Phoneme edges
(replacing the old per-session score-averaging approach). Cleans up the
test user afterward so re-running this doesn't pollute the graph.
"""
import json
import uuid
import time

from knowledge_graph import (
    driver,
    create_user,
    assign_tracks,
    log_session,
    log_attempt,
    update_weak_phonemes,
    get_all_sessions,
    get_attempts_for_session,
    get_attempts_for_user,
)

TEST_USER_ID = f"test_multi_attempt_{uuid.uuid4().hex[:8]}"

# 2 sessions x 3 attempts each. /r/ flagged weak in 4 attempts (should end up
# WEAK_AT), /th/ in exactly 2 (boundary - min_occurrences default is 2, so
# should still count), /s/ in only 1 (should NOT end up WEAK_AT).
SESSIONS = [
    {
        "session_id_suffix": "s0",
        "attempts": [
            {"exercise_id": "LAN-EXP-SPK-001", "subcategory": "Expressive - Spoken", "score": 0.50,
             "speech_rate_wpm": 95, "filler_total": 4, "weak_phonemes": ["/r/", "/th/"]},
            {"exercise_id": "LAN-REC-SPK-001", "subcategory": "Receptive - Spoken", "score": 0.60,
             "speech_rate_wpm": 98, "filler_total": 3, "weak_phonemes": ["/r/"]},
            {"exercise_id": "SPE-MOTOR-001", "subcategory": "Motor Speech (Dysarthria)", "score": 0.70,
             "speech_rate_wpm": 100, "filler_total": 2, "weak_phonemes": []},
        ],
    },
    {
        "session_id_suffix": "s1",
        "attempts": [
            {"exercise_id": "LAN-EXP-SPK-002", "subcategory": "Expressive - Spoken", "score": 0.65,
             "speech_rate_wpm": 102, "filler_total": 3, "weak_phonemes": ["/r/", "/th/"]},
            {"exercise_id": "SPE-FLU-001", "subcategory": "Fluency", "score": 0.72,
             "speech_rate_wpm": 108, "filler_total": 2, "weak_phonemes": ["/r/"]},
            {"exercise_id": "SPE-VOICE-001", "subcategory": "Voice Disorders", "score": 0.80,
             "speech_rate_wpm": 110, "filler_total": 1, "weak_phonemes": ["/s/"]},
        ],
    },
]

TOTAL_ATTEMPTS = sum(len(s["attempts"]) for s in SESSIONS)


def cleanup():
    with driver.session() as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (u:User {user_id: $user_id})
                OPTIONAL MATCH (u)-[:HAS_SESSION]->(s:Session)
                OPTIONAL MATCH (s)-[:HAS_ATTEMPT]->(a:Attempt)
                DETACH DELETE u, s, a
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

    first_session_id = None
    logged_attempt_ids = []

    for sess in SESSIONS:
        session_id = f"{TEST_USER_ID}_{sess['session_id_suffix']}"
        first_session_id = first_session_id or session_id
        log_session(driver, TEST_USER_ID, session_id, overall_score=None, duration_seconds=180)

        for attempt in sess["attempts"]:
            attempt_id = log_attempt(
                driver,
                user_id=TEST_USER_ID,
                session_id=session_id,
                exercise_id=attempt["exercise_id"],
                subcategory=attempt["subcategory"],
                transcription="mock transcription",
                speech_rate_wpm=attempt["speech_rate_wpm"],
                filler_words={"um": 2, "uh": 1},
                filler_total=attempt["filler_total"],
                total_duration_s=12.5,
                score=attempt["score"],
                scoring_method="cnn_phoneme_v1",
                scoring_details={"note": "mock scoring details"},
                weak_phonemes=attempt["weak_phonemes"],
                embedding=[0.1, 0.2, 0.3],
            )
            logged_attempt_ids.append(attempt_id)
            time.sleep(0.05)  # ensure distinct timestamps for ordering checks

    update_weak_phonemes(driver, TEST_USER_ID, min_occurrences=2)

    all_sessions = get_all_sessions(driver, TEST_USER_ID)
    check("logged both sessions", len(all_sessions) == len(SESSIONS))

    first_session_attempts = get_attempts_for_session(driver, first_session_id)
    check("get_attempts_for_session returns 3 attempts for session 1", len(first_session_attempts) == 3)
    check(
        "attempts within a session are returned oldest-first",
        all(first_session_attempts[i]["timestamp"] <= first_session_attempts[i + 1]["timestamp"]
            for i in range(len(first_session_attempts) - 1))
    )
    check(
        "session 1 attempt scores match what was logged, in order",
        [a["score"] for a in first_session_attempts] == [a["score"] for a in SESSIONS[0]["attempts"]]
    )

    all_attempts = get_attempts_for_user(driver, TEST_USER_ID)
    check(f"get_attempts_for_user returns all {TOTAL_ATTEMPTS} attempts across both sessions",
          len(all_attempts) == TOTAL_ATTEMPTS)
    check(
        "attempts across sessions are returned oldest-first",
        all(all_attempts[i]["timestamp"] <= all_attempts[i + 1]["timestamp"] for i in range(len(all_attempts) - 1))
    )
    check(
        "attempt-level weak_phonemes round-trip as lists",
        all_attempts[0]["weak_phonemes"] == ["/r/", "/th/"]
    )

    limited = get_attempts_for_user(driver, TEST_USER_ID, limit=2)
    check("get_attempts_for_user respects limit", len(limited) == 2)

    # filler_words/scoring_details are stored as JSON strings (Neo4j can't
    # hold nested objects as properties) - verify they round-trip correctly.
    with driver.session() as session:
        raw = session.run("""
            MATCH (a:Attempt {attempt_id: $attempt_id}) RETURN a.filler_words AS fw, a.scoring_details AS sd
        """, attempt_id=logged_attempt_ids[0]).single()
    check("filler_words dict round-trips through JSON serialization", json.loads(raw["fw"]) == {"um": 2, "uh": 1})
    check("scoring_details dict round-trips through JSON serialization",
          json.loads(raw["sd"]) == {"note": "mock scoring details"})

    with driver.session() as session:
        weak = session.run("""
            MATCH (u:User {user_id: $user_id})-[:WEAK_AT]->(p:Phoneme)
            RETURN p.symbol AS symbol
        """, user_id=TEST_USER_ID)
        weak_symbols = {row["symbol"] for row in weak}

    check("/r/ (flagged weak in 4 attempts) rolled up to user-level WEAK_AT", "/r/" in weak_symbols)
    check("/th/ (flagged weak in exactly 2 attempts, the min_occurrences boundary) rolled up to WEAK_AT",
          "/th/" in weak_symbols)
    check("/s/ (flagged weak in only 1 attempt, below min_occurrences) NOT rolled up to WEAK_AT",
          "/s/" not in weak_symbols)

    cleanup()

    with driver.session() as session:
        remaining_user = session.run(
            "MATCH (u:User {user_id: $user_id}) RETURN u LIMIT 1", user_id=TEST_USER_ID
        ).single()
        remaining_attempts = session.run(
            "MATCH (a:Attempt {user_id: $user_id}) RETURN a LIMIT 1", user_id=TEST_USER_ID
        ).single()
    check("test user cleaned up after test", remaining_user is None)
    check("test attempts cleaned up after test", remaining_attempts is None)

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED: {failures}")
    else:
        print(f"All checks passed across {len(SESSIONS)} sessions / {TOTAL_ATTEMPTS} attempts.")
    return len(failures) == 0


if __name__ == "__main__":
    import sys
    success = run()
    sys.exit(0 if success else 1)
