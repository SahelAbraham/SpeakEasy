# SpeakEasy — Knowledge Graph Schema

**Owner:** Tiana  
**Layer:** Progress & Intelligence  
**Sprint:** 1 (Weeks 1–2)  
**Database:** Neo4j Aura (free tier)

---

## Overview

This file defines the Knowledge Graph (KG) layer for SpeakEasy. The KG is the backbone of all personalization — it stores every user's session history, phoneme-level scores, and weak areas. Sahel's RL agent reads from this graph to decide which exercises to prioritize each session, and Tiana's dashboard reads from it to surface progress over time.

---

## Setup

### Requirements

```bash
pip install neo4j python-dotenv
```

### Environment variables

Create a `.env` file in the project root with the following:

```
NEO4J_URI=neo4j+ssc://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=your-database-name
```

### Connecting

```python
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
)

driver.verify_connectivity()
```

The `driver` object is created once and passed into every function — do not recreate it on every call.

---

## Graph Schema

### Node types

| Node | Properties | Description |
|---|---|---|
| `User` | `user_id`, `phone_number`, `age_group`, `native_language`, `created_at` | One node per user, keyed by WhatsApp number |
| `Track` | `track_id`, `name` | Fixed therapy tracks — seeded once at setup |
| `Session` | `session_id`, `overall_score`, `duration_seconds`, `timestamp` | One node per practice session |
| `Phoneme` | `symbol` | A speech sound e.g. `/r/`, `/th/`, `/s/` |
| `Score` | `value`, `timestamp` | A float 0–1 score for one phoneme in one session |

### Relationships

| Relationship | From → To | Meaning |
|---|---|---|
| `ASSIGNED_TO` | `User → Track` | Which therapy track this user is on |
| `HAS_SESSION` | `User → Session` | Links a user to all their sessions |
| `CONTAINS_SCORE` | `Session → Score` | Links a session to each phoneme score |
| `FOR_PHONEME` | `Score → Phoneme` | Which phoneme the score belongs to |
| `WEAK_AT` | `User → Phoneme` | Phonemes averaging below threshold across all sessions |

### Visual overview

```
(User)-[:ASSIGNED_TO]->(Track)
(User)-[:HAS_SESSION]->(Session)
(Session)-[:CONTAINS_SCORE]->(Score)
(Score)-[:FOR_PHONEME]->(Phoneme)
(User)-[:WEAK_AT]->(Phoneme)
```

---

## Functions

### `seed_tracks(tx)`

Populates the five fixed `Track` nodes. Call this **once** at database setup — not per user.

```python
with driver.session(database=os.getenv("NEO4J_DATABASE")) as session:
    session.execute_write(seed_tracks)
```

Available tracks:

| `track_id` | `name` |
|---|---|
| `articulation_child` | Articulation for children |
| `articulation_adult` | Articulation for adults |
| `adult_post_therapy` | Post-therapy maintenance |
| `hearing_impaired` | Hearing-impaired adaptation |
| `confidence` | Confidence and fluency |

---

### `create_user(driver, user_id, phone_number, age_group, native_language)`

Creates a new `User` node when someone completes onboarding. Uses `MERGE` so calling it twice for the same user is safe — no duplicates.

```python
create_user(driver, "whatsapp:+16085551234", "+16085551234", "adult", "English")
```

**Called by:** onboarding survey flow (Tiana), triggered after survey completion.

---

### `assign_tracks(driver, user_id, track_id)`

Draws the `ASSIGNED_TO` edge between a `User` and a `Track`. Both nodes must already exist — run `create_user` and `seed_tracks` first.

```python
assign_tracks(driver, "whatsapp:+16085551234", "adult_post_therapy")
```

**Called by:** Sahel's adaptive profile builder, after processing survey responses.

---

### `log_session(driver, user_id, session_id, overall_score, duration_seconds)`

Creates a new `Session` node and links it to the user. Call this at the start of writing session data. `overall_score` is a float 0–1.

```python
log_session(driver, "whatsapp:+16085551234", "session_001", 0.65, 300)
```

**Called by:** pipeline after Rabiah's speech analysis returns an overall score (Sprint 2).

---

### `log_phoneme_score(driver, session_id, phoneme_symbol, score_value)`

Creates a `Score` node for one phoneme and links it to the session and the phoneme. Call once per phoneme per session. `score_value` must be a float 0–1.

```python
log_phoneme_score(driver, "session_001", "/r/", 0.45)
log_phoneme_score(driver, "session_001", "/th/", 0.72)
log_phoneme_score(driver, "session_001", "/s/", 0.38)
```

**Called by:** pipeline after Rabiah's CNN returns phoneme-level scores (Sprint 2).

---

### `update_weak_phonemes(driver, user_id, threshold=0.6)`

Averages each phoneme's scores across all of a user's sessions. Any phoneme averaging below `threshold` gets a `WEAK_AT` edge from the user. Run this at the end of every session after `log_phoneme_score` has written all scores.

```python
update_weak_phonemes(driver, "whatsapp:+16085551234")          # default threshold 0.6
update_weak_phonemes(driver, "whatsapp:+16085551234", threshold=0.5)  # custom threshold
```

**Read by:** Sahel's RL agent reads `WEAK_AT` edges as context for exercise prioritization.

---

## Call order

### Onboarding (once per new user)

```python
seed_tracks(...)           # only if not already seeded
create_user(driver, ...)
assign_tracks(driver, ...)
```

### End of every session

```python
log_session(driver, ...)
log_phoneme_score(driver, ...)   # repeat for each phoneme scored
update_weak_phonemes(driver, ...)
```

---

## Notes for teammates

**Rabiah (Speech Analysis):** Your CNN pipeline needs to return a dict of `{ phoneme_symbol: score_value }` floats after each session. Make sure scores are numeric (not strings) — Neo4j's `AVG()` will throw a type error on strings. The pipeline should call `log_session` then `log_phoneme_score` for each entry in that dict.

**Sahel (RL Agent + Profile Builder):** Your profile builder should call `assign_tracks(driver, user_id, track_id)` after determining the user's track from survey responses. Your RL agent can query `WEAK_AT` edges to get the current weak phonemes for a user as context:

```cypher
MATCH (u:User {user_id: $user_id})-[:WEAK_AT]->(p:Phoneme)
RETURN p.symbol
```

**Anvesha (Conversational Layer):** The `user_id` used throughout the KG should be the WhatsApp number in the format `"whatsapp:+16085551234"` — make sure the Twilio webhook passes this consistently so all layers reference the same user.