from neo4j import GraphDatabase
from dotenv import load_dotenv
import json
import os
import uuid

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USER, NEO4J_PASSWORD),
)

driver.verify_connectivity()

def user_exists(driver, user_id):
    with driver.session(
        database=NEO4J_DATABASE
    ) as session:

        result = session.run(
            """
            MATCH (u:User {user_id: $user_id})
            RETURN u
            LIMIT 1
            """,
            user_id=user_id,
        )

        return result.single() is not None


def create_user(user_id:str, username:str, email:str, password:str,name:str, age:int, occupation:str, therapy_history:str, track:str):
    with driver.session(database=NEO4J_DATABASE) as session:
        session.execute_write(
            _create_user_transaction,
            user_id,
            username,
            email,
            password,
            name,
            age,
            occupation,
            therapy_history,
            track
        )

def _create_user_transaction(
    tx,
    user_id: str,
    username: str,
    email: str,
    password: str,
    name: str,
    age: int,
    occupation: str,
    therapy_history: str,
    track: str,
):
    result = tx.run(
        """
        MERGE (u:User {user_id: $user_id})

        SET u.username = $username,
            u.email = $email,
            u.password = $password,
            u.name = $name,
            u.age = $age,
            u.occupation = $occupation,
            u.therapy_history = $therapy_history,
            u.track = $track,
            u.created_at = timestamp()

        // ---------------------------------------------------------
        // Global Track catalog nodes (shared by all users) — only
        // an ENROLLED_IN edge is created; no NOT_ENROLLED_IN.
        // ---------------------------------------------------------

        MERGE (speech:Track {name: 'Speech'})
        MERGE (language:Track {name: 'Language'})

        WITH u, speech, language,
             CASE WHEN $track = 'Speech' THEN speech ELSE language END AS enrolledTrack

        MERGE (u)-[:ENROLLED_IN]->(enrolledTrack)

        // ---------------------------------------------------------
        // Per-user Subtrack nodes (unchanged)
        // ---------------------------------------------------------

        MERGE (expressive:Subtrack {
            user_id: $user_id,
            track_id: 'Language_Expressive'
        })
        ON CREATE SET
            expressive.name = 'Expressive Language',
            expressive.score = 0.5
        MERGE (u)-[:HAS_SUBTRACK]->(expressive)

        MERGE (receptive:Subtrack {
            user_id: $user_id,
            track_id: 'Language_Receptive'
        })
        ON CREATE SET
            receptive.name = 'Receptive Language',
            receptive.score = 0.5
        MERGE (u)-[:HAS_SUBTRACK]->(receptive)

        MERGE (motor:Subtrack {
            user_id: $user_id,
            track_id: 'Speech_Motor'
        })
        ON CREATE SET
            motor.name = 'Motor Speech (Dysarthria)',
            motor.score = 0.5
        MERGE (u)-[:HAS_SUBTRACK]->(motor)

        MERGE (fluency:Subtrack {
            user_id: $user_id,
            track_id: 'Speech_Fluency'
        })
        ON CREATE SET
            fluency.name = 'Fluency',
            fluency.score = 0.5
        MERGE (u)-[:HAS_SUBTRACK]->(fluency)

        MERGE (voice:Subtrack {
            user_id: $user_id,
            track_id: 'Speech_Disorders'
        })
        ON CREATE SET
            voice.name = 'Voice Disorders',
            voice.score = 0.5
        MERGE (u)-[:HAS_SUBTRACK]->(voice)

        RETURN
            u.user_id AS user_id,
            count(expressive) AS expressive_created,
            count(receptive) AS receptive_created,
            count(motor) AS motor_created,
            count(fluency) AS fluency_created,
            count(voice) AS voice_created
        """,
        user_id=user_id,
        username=username,
        email=email,
        password=password,
        name=name,
        age=age,
        occupation=occupation,
        therapy_history=therapy_history,
        track=track,
    )

    record = result.single()
    if record is None:
        raise RuntimeError("Failed to create user and subtracks in Neo4j.")
    return record["user_id"]

def switch_track(user_id: str, new_track: str):
    with driver.session(database=NEO4J_DATABASE) as session:
        session.execute_write(
            _switch_track_transaction,
            user_id,
            new_track,
        )

def _switch_track_transaction(tx, user_id: str, new_track: str):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})

        OPTIONAL MATCH (u)-[oldEnrolled:ENROLLED_IN]->()
        DELETE oldEnrolled

        WITH u
        MERGE (newTrack:Track {name: $new_track})
        MERGE (u)-[:ENROLLED_IN]->(newTrack)

        RETURN u.user_id AS user_id, newTrack.name AS enrolled
        """,
        user_id=user_id,
        new_track=new_track,
    )

    record = result.single()
    if record is None:
        raise RuntimeError(f"Failed to switch track — no user found with user_id: {user_id}")
    return record["enrolled"]

def create_session(user_id: str) -> str:
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(_create_session_transaction, user_id)

def _create_session_transaction(tx, user_id: str):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})

        // Count how many sessions this user already has, to number the next one
        OPTIONAL MATCH (u)-[:HAS_SESSION]->(existing:Session)
        WITH u, count(existing) AS session_count

        CREATE (s:Session {
            session_id: randomUUID(),
            session_number: session_count + 1,
            label: 'session_' + toString(session_count + 1),
            started_at: datetime()
        })

        MERGE (u)-[:HAS_SESSION]->(s)

        RETURN
            s.session_id AS session_id,
            s.label AS label,
            s.session_number AS session_number
        """,
        user_id=user_id,
    )

    record = result.single()

    if record is None:
        raise RuntimeError(f"Failed to create session — no user found with user_id: {user_id}")

    return {
        "session_id": record["session_id"],
        "label": record["label"],
        "session_number": record["session_number"],
    }

def get_subtrack_scores(user_id: str, track: str):
    """Returns {track_id: score} for every subtrack under the given track."""
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_read(_get_subtrack_scores_transaction, user_id, track)


def _get_subtrack_scores_transaction(tx, user_id: str, track: str):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})-[:HAS_SUBTRACK]->(s:Subtrack)
        WHERE s.track_id STARTS WITH $track
        RETURN s.track_id AS track_id, s.score AS score
        """,
        user_id=user_id,
        track=track,
    )
    return {record["track_id"]: record["score"] for record in result}


def update_subtrack_score(user_id: str, track_id: str, new_observed_score: float, alpha: float = 0.3):
    """
    Blends the subtrack's running score with the latest exercise result
    via exponential moving average, clamped to [0, 1].
    """
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(
            _update_subtrack_score_transaction, user_id, track_id, new_observed_score, alpha
        )


def _update_subtrack_score_transaction(tx, user_id: str, track_id: str, new_observed_score: float, alpha: float):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})-[:HAS_SUBTRACK]->(s:Subtrack {track_id: $track_id})
        SET s.score = CASE
            WHEN (s.score * (1 - $alpha) + $new_score * $alpha) > 1.0 THEN 1.0
            WHEN (s.score * (1 - $alpha) + $new_score * $alpha) < 0.0 THEN 0.0
            ELSE s.score * (1 - $alpha) + $new_score * $alpha
        END
        RETURN s.score AS updated_score
        """,
        user_id=user_id,
        track_id=track_id,
        new_score=new_observed_score,
        alpha=alpha,
    )
    record = result.single()
    if record is None:
        raise RuntimeError(f"Failed to update subtrack score — no Subtrack {track_id} for user {user_id}")
    return record["updated_score"]

def get_enrolled_track(user_id: str) -> str:
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_read(_get_enrolled_track_transaction, user_id)


def _get_enrolled_track_transaction(tx, user_id: str):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})-[:ENROLLED_IN]->(t:Track)
        RETURN t.name AS track
        """,
        user_id=user_id,
    )
    record = result.single()
    if record is None:
        raise RuntimeError(f"No enrolled track found for user {user_id}")
    return record["track"]


def record_exercise_attempt(user_id: str, session_id: str, exercise: dict, result: dict):
    """
    Creates a brand-new, per-user Exercise node for this specific attempt
    (so repeat attempts at the same bank exercise never collide), attaches
    the score/scoring_method/transcription directly to it, and links it to
    both the active Session and the User.

    exercise.get("id") is kept as `source_id` — a pointer back to the
    exercise_bank_v3.json / Chroma entry — but instructions and
    expected_answer are intentionally NOT stored on this node.
    """
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_write(
            _record_exercise_attempt_transaction,
            user_id,
            session_id,
            exercise,
            result,
        )


def _record_exercise_attempt_transaction(tx, user_id: str, session_id: str, exercise: dict, result: dict):
    query_result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(s:Session {session_id: $session_id})

        CREATE (ex:Exercise {
            exercise_id: randomUUID(),
            source_id: $source_id,
            user_id: $user_id,
            title: $title,
            track: $track,
            subcategory: $subcategory,
            scoring_type: $scoring_type,
            score: $score,
            scoring_method: $scoring_method,
            transcription: $transcription,
            weak_phonemes: $weak_phonemes,
            completed_at: datetime()
        })

        MERGE (s)-[:HAS_EXERCISE]->(ex)

        RETURN ex.exercise_id AS exercise_id
        """,
        user_id=user_id,
        session_id=session_id,
        source_id=exercise.get("id"),
        title=exercise.get("title"),
        track=exercise.get("track"),
        subcategory=exercise.get("subcategory"),
        scoring_type=exercise.get("scoring_type"),
        score=result.get("score"),
        scoring_method=result.get("scoring_method"),
        transcription=result.get("transcription"),
        weak_phonemes=json.dumps(result.get("weak_phonemes", [])),
    )

    record = query_result.single()
    if record is None:
        raise RuntimeError(
            f"Failed to record exercise attempt — no session {session_id} found for user {user_id}. "
            f"This means the client sent a session_id that doesn't have a HAS_SESSION edge to this user "
            f"(stale/expired session on the frontend is the most common cause)."
        )
    return record["exercise_id"]

def get_progress_stats(user_id: str, session_id: str):
    with driver.session(database=NEO4J_DATABASE) as session:
        return session.execute_read(_get_progress_stats_transaction, user_id, session_id)


def _get_progress_stats_transaction(tx, user_id: str, session_id: str):
    result = tx.run(
        """
        MATCH (u:User {user_id: $user_id})
        OPTIONAL MATCH (u)-[:HAS_SESSION]->(allSessions:Session)
        OPTIONAL MATCH (allSessions)-[:HAS_EXERCISE]->(allEx:Exercise)
        WITH u, count(DISTINCT allSessions) AS total_sessions, count(allEx) AS total_exercises
        OPTIONAL MATCH (u)-[:HAS_SESSION]->(currentSession:Session {session_id: $session_id})
        OPTIONAL MATCH (currentSession)-[:HAS_EXERCISE]->(sessionEx:Exercise)
        RETURN
            total_sessions AS total_sessions,
            total_exercises AS total_exercises,
            count(sessionEx) AS session_exercises
        """,
        user_id=user_id,
        session_id=session_id,
    )

    record = result.single()
    if record is None:
        raise RuntimeError(f"Failed to fetch progress stats — no user found with user_id: {user_id}")

    return {
        "session_exercises": record["session_exercises"],
        "total_exercises": record["total_exercises"],
        "total_sessions": record["total_sessions"],
    }

def close_driver():
    driver.close()

# def seed_tracks(tx):
#     # track_id matches the "track" field in exercise_bank_v3.json /
#     # exercise_bank_speech_language.json exactly, so KG and exercise bank
#     # queries never need a name-translation layer between them.
#     tracks = [
#         ("Speech",    "Motor speech, fluency and voice"),
#         ("Language",  "Expressive and receptive language exercises")
#     ]
#     for track_id, name in tracks:
#         tx.run("""
#             MERGE (t:Track {track_id: $track_id})
#             SET t.name = $name
#         """, track_id=track_id, name=name)

# # with driver.session() as session:
# #     session.execute_write(seed_tracks)

# def assign_tracks(driver, user_id, track_id):
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         session.execute_write(
#             lambda tx: tx.run("""
#                 MATCH (u:User {user_id: $user_id})
#                 MATCH (t: Track {track_id: $track_id})
#                 CREATE (u)-[:ASSIGNED_TO]->(t)
#             """,
#             user_id=user_id,
#             track_id = track_id
#             )
#         )

# def log_session(driver, user_id, session_id, overall_score, duration_seconds,
#                  speech_rate_wpm=None, filler_total=None, embedding=None):
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         session.execute_write(
#             lambda tx: tx.run("""
#                 MATCH (u:User {user_id: $user_id})
#                 CREATE (s:Session {
#                     session_id: $session_id,
#                     overall_score: $overall_score,
#                     duration_seconds: $duration_seconds,
#                     speech_rate_wpm: $speech_rate_wpm,
#                     filler_total: $filler_total,
#                     embedding: $embedding,
#                     timestamp: timestamp()
#                 })
#                 CREATE (u)-[:HAS_SESSION]->(s)
#             """,
#             user_id=user_id,
#             session_id=session_id,
#             overall_score=overall_score,
#             duration_seconds=duration_seconds,
#             speech_rate_wpm=speech_rate_wpm,
#             filler_total=filler_total,
#             embedding=embedding
#             )
#         )


# def get_recent_sessions(driver, user_id, limit=2):
#     """
#     Returns a user's most recent sessions (most recent first), each as a dict
#     with session_id, overall_score, timestamp, and embedding (or None if the
#     session predates embedding capture). Used by DTW/cosine progress comparison.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(s:Session)
#             RETURN s.session_id AS session_id,
#                    s.overall_score AS overall_score,
#                    s.timestamp AS timestamp,
#                    s.embedding AS embedding
#             ORDER BY s.timestamp DESC
#             LIMIT $limit
#         """,
#         user_id=user_id,
#         limit=limit
#         )
#         return [dict(record) for record in result]


# def log_attempt(driver, user_id, session_id, exercise_id, subcategory,
#                  transcription, speech_rate_wpm, filler_words, filler_total,
#                  total_duration_s, score, scoring_method, scoring_details,
#                  weak_phonemes, embedding, attempt_id=None):
#     """
#     Records one question/exercise response within a session - each attempt
#     now gets its own score and its own weak phonemes, instead of those being
#     rolled up once for the whole session. Lets Sahel's RL agent compare
#     scores across the questions inside a single session and pick the next
#     exercise to better match the user's weak points.

#     filler_words and scoring_details are dicts and get JSON-serialized -
#     Neo4j node properties can only be primitives or arrays of primitives,
#     never nested objects.

#     weak_phonemes is stored two ways: as a plain list property (cheap direct
#     read, e.g. for the dashboard) and as Attempt-[:WEAK_AT]->Phoneme edges
#     (mirrors the existing User-[:WEAK_AT]->Phoneme pattern) so
#     update_weak_phonemes() can roll these up into the user's overall profile.

#     The Session identified by session_id must already exist (call
#     log_session() first). Returns the attempt_id (auto-generated if not
#     passed in).
#     """
#     attempt_id = attempt_id or f"{session_id}_attempt_{uuid.uuid4().hex[:8]}"
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         session.execute_write(
#             lambda tx: tx.run("""
#                 MATCH (s:Session {session_id: $session_id})
#                 CREATE (a:Attempt {
#                     attempt_id: $attempt_id,
#                     user_id: $user_id,
#                     session_id: $session_id,
#                     exercise_id: $exercise_id,
#                     subcategory: $subcategory,
#                     transcription: $transcription,
#                     speech_rate_wpm: $speech_rate_wpm,
#                     filler_words: $filler_words,
#                     filler_total: $filler_total,
#                     total_duration_s: $total_duration_s,
#                     score: $score,
#                     scoring_method: $scoring_method,
#                     scoring_details: $scoring_details,
#                     weak_phonemes: $weak_phonemes,
#                     embedding: $embedding,
#                     timestamp: timestamp()
#                 })
#                 CREATE (s)-[:HAS_ATTEMPT]->(a)
#                 WITH a
#                 UNWIND $weak_phonemes AS phoneme_symbol
#                 MERGE (p:Phoneme {symbol: phoneme_symbol})
#                 CREATE (a)-[:WEAK_AT]->(p)
#             """,
#             attempt_id=attempt_id,
#             user_id=user_id,
#             session_id=session_id,
#             exercise_id=exercise_id,
#             subcategory=subcategory,
#             transcription=transcription,
#             speech_rate_wpm=speech_rate_wpm,
#             filler_words=json.dumps(filler_words) if filler_words is not None else None,
#             filler_total=filler_total,
#             total_duration_s=total_duration_s,
#             score=score,
#             scoring_method=scoring_method,
#             scoring_details=json.dumps(scoring_details) if scoring_details is not None else None,
#             weak_phonemes=weak_phonemes or [],
#             embedding=embedding
#             )
#         )
#     return attempt_id


# def get_attempts_for_session(driver, session_id):
#     """
#     Returns every attempt (question response) within one session, oldest
#     first - lets teammates compare scores question-to-question inside a
#     single session.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (s:Session {session_id: $session_id})-[:HAS_ATTEMPT]->(a:Attempt)
#             RETURN a.attempt_id AS attempt_id,
#                    a.exercise_id AS exercise_id,
#                    a.subcategory AS subcategory,
#                    a.score AS score,
#                    a.scoring_method AS scoring_method,
#                    a.weak_phonemes AS weak_phonemes,
#                    a.speech_rate_wpm AS speech_rate_wpm,
#                    a.filler_total AS filler_total,
#                    a.timestamp AS timestamp
#             ORDER BY a.timestamp ASC
#         """,
#         session_id=session_id
#         )
#         return [dict(record) for record in result]


# def get_attempts_for_user(driver, user_id, limit=None):
#     """
#     Returns every attempt across all of a user's sessions, oldest first.
#     Used by the dashboard for attempt-level trend charts and the phoneme
#     heatmap. Pass limit for just the most recent N (still returned oldest
#     first) - omit it for the full history.
#     """
#     query = """
#         MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(:Session)-[:HAS_ATTEMPT]->(a:Attempt)
#         RETURN a.attempt_id AS attempt_id,
#                a.session_id AS session_id,
#                a.exercise_id AS exercise_id,
#                a.subcategory AS subcategory,
#                a.score AS score,
#                a.speech_rate_wpm AS speech_rate_wpm,
#                a.filler_total AS filler_total,
#                a.weak_phonemes AS weak_phonemes,
#                a.embedding AS embedding,
#                a.timestamp AS timestamp
#         ORDER BY a.timestamp ASC
#     """
#     if limit is not None:
#         query += " LIMIT $limit"
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run(query, user_id=user_id, limit=limit)
#         return [dict(record) for record in result]


# def get_recent_attempts(driver, user_id, limit=2):
#     """
#     Returns a user's most recent attempts (most recent first): attempt_id,
#     exercise_id, score, timestamp, embedding. Used by DTW/cosine progress
#     comparison - embeddings now live on Attempt, not Session, since each
#     question response gets its own embedding.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(:Session)-[:HAS_ATTEMPT]->(a:Attempt)
#             RETURN a.attempt_id AS attempt_id,
#                    a.exercise_id AS exercise_id,
#                    a.score AS score,
#                    a.timestamp AS timestamp,
#                    a.embedding AS embedding
#             ORDER BY a.timestamp DESC
#             LIMIT $limit
#         """,
#         user_id=user_id,
#         limit=limit
#         )
#         return [dict(record) for record in result]


# def list_users_with_sessions(driver):
#     """Returns user_ids that have at least one logged session, for dashboard selection."""
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (u:User)-[:HAS_SESSION]->(:Session)
#             RETURN DISTINCT u.user_id AS user_id
#             ORDER BY user_id
#         """)
#         return [record["user_id"] for record in result]


# def get_all_sessions(driver, user_id):
#     """
#     Returns every session for a user, oldest first, for plotting trends over
#     time (fluency/accuracy/consistency). Each row: session_id, overall_score,
#     duration_seconds, speech_rate_wpm, filler_total, timestamp.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(s:Session)
#             RETURN s.session_id AS session_id,
#                    s.overall_score AS overall_score,
#                    s.duration_seconds AS duration_seconds,
#                    s.speech_rate_wpm AS speech_rate_wpm,
#                    s.filler_total AS filler_total,
#                    s.timestamp AS timestamp
#             ORDER BY s.timestamp ASC
#         """,
#         user_id=user_id
#         )
#         return [dict(record) for record in result]


# def get_phoneme_scores_by_session(driver, user_id):
#     """
#     Returns every phoneme score for a user, one row per (session, phoneme),
#     oldest session first. Used to build the phoneme-level heatmap on the
#     dashboard: session_id, timestamp, phoneme_symbol, score_value.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         result = session.run("""
#             MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(s:Session)
#             MATCH (s)-[:CONTAINS_SCORE]->(sc:Score)-[:FOR_PHONEME]->(p:Phoneme)
#             RETURN s.session_id AS session_id,
#                    s.timestamp AS timestamp,
#                    p.symbol AS phoneme_symbol,
#                    sc.value AS score_value
#             ORDER BY s.timestamp ASC
#         """,
#         user_id=user_id
#         )
#         return [dict(record) for record in result]


# def log_phoneme_score(driver, session_id, phoneme_symbol, score_value):
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         session.execute_write(
#             lambda tx: tx.run("""
#                 MATCH (s:Session {session_id: $session_id})
#                 MERGE (p:Phoneme {symbol: $phoneme_symbol})
#                 CREATE (sc: Score {value: $score_value, timestamp: timestamp()})
#                 CREATE (s)-[:CONTAINS_SCORE]->(sc)
#                 CREATE (sc)-[:FOR_PHONEME]->(p)
#             """,
#             session_id = session_id,
#             phoneme_symbol = phoneme_symbol,
#             score_value = float(score_value)
#             )
#         )


# def update_weak_phonemes(driver, user_id, min_occurrences=2):
#     """
#     BREAKING CHANGE from the old signature (threshold=0.6, a float): phoneme
#     scoring moved from a per-session numeric average to per-attempt weak/not
#     flags (see log_attempt), so there's no float score left here to average.

#     A phoneme becomes a user-level WEAK_AT edge once it's shown up in the
#     weak_phonemes list of at least min_occurrences separate attempts,
#     rolled up from Attempt-[:WEAK_AT]->Phoneme edges rather than averaging
#     Score nodes.
#     """
#     with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
#         session.execute_write(
#             lambda tx: tx.run("""
#                 MATCH (u:User {user_id: $user_id})
#                 MATCH (u)-[:HAS_SESSION]->(:Session)-[:HAS_ATTEMPT]->(a:Attempt)-[:WEAK_AT]->(p:Phoneme)
#                 WITH u, p, count(a) AS occurrences
#                 WHERE occurrences >= $min_occurrences
#                 MERGE (u)-[:WEAK_AT]->(p)
#             """,
#             user_id=user_id,
#             min_occurrences=min_occurrences
#             )
#         )