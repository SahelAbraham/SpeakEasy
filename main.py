from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
)

driver.verify_connectivity()

def create_user(driver, user_id, phone_number, age_group, native_language):
    with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
        session.execute_write(
            lambda tx: tx.run("""
                MERGE (u:User {user_id: $user_id})
                SET u.phone_number = $phone_number,
                    u.age_group = $age_group,
                    u.native_language = $native_language,
                    u.created_at = timestamp()
            """,
            user_id=user_id,
            phone_number=phone_number,
            age_group=age_group,
            native_language=native_language
            )
        )

def seed_tracks(tx):
    tracks = [
        ("articulation_child", "Articulation for children"),
        ("articulation_adult", "Articulation for adults"),
        ("adult_post_therapy", "Post-therapy maintenance"),
        ("hearing_impaired",   "Hearing-impaired adaptation"),
        ("confidence",         "Confidence and fluency"),
    ]
    for track_id, name in tracks:
        tx.run("""
            MERGE (t:Track {track_id: $track_id})
            SET t.name = $name
        """, track_id=track_id, name=name)

# with driver.session() as session:
#     session.execute_write(seed_tracks)

def assign_tracks(driver, user_id, track_id):
    with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (u:User {user_id: $user_id})
                MATCH (t: Track {track_id: $track_id})
                CREATE (u)-[:ASSIGNED_TO]->(t)
            """,
            user_id=user_id,
            track_id = track_id
            )
        )

def log_session(driver, user_id, session_id, overall_score, duration_seconds):
    with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (u:User {user_id: $user_id})
                CREATE(s: Session{session_id: $session_id,overall_score: $overall_score,duration_seconds: $duration_seconds,timestamp: timestamp()})
                CREATE (u)-[:HAS_SESSION]->(s)
            """,
            user_id = user_id,
            session_id = session_id,
            overall_score = overall_score,
            duration_seconds = duration_seconds
            )
        )

def log_phoneme_score(driver, session_id, phoneme_symbol, score_value):
    with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (s:Session {session_id: $session_id})
                MERGE (p:Phoneme {symbol: $phoneme_symbol})
                CREATE (sc: Score {value: $score_value, timestamp: timestamp()})
                CREATE (s)-[:CONTAINS_SCORE]->(sc)
                CREATE (sc)-[:FOR_PHONEME]->(p)
            """,
            session_id = session_id,
            phoneme_symbol = phoneme_symbol,
            score_value = float(score_value)
            )
        )


def update_weak_phonemes(driver, user_id, threshold=0.6):
    with driver.session(database="e213fac0") as session:
        session.execute_write(
            lambda tx: tx.run("""
                MATCH (u:User {user_id: $user_id})
                MATCH (u)-[:HAS_SESSION]->(s)-[:CONTAINS_SCORE]->(sc)-[:FOR_PHONEME]->(p)
                WITH u, p, avg(sc.value) as avg_score
                WHERE avg_score < $threshold
                MERGE (u)-[:WEAK_AT]->(p)
            """,
            user_id=user_id,
            threshold=threshold
            )
        )

