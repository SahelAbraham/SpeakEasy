
### 1. Overall flow

```text
User
 ↓
WhatsApp / Twilio
 ↓
Voice Message
 ↓
Speech-to-Text (Whisper)
 ↓
Transcript
 ↓
User Profile
 ↓
RL / Exercise Selection
 ↓
RAG Exercise Retrieval
 ↓
Selected Exercise
 ↓
Conversation Engine
 ↓
WhatsApp → User
 ↓
User completes exercise
 ↓
Speech Scoring
 ↓
Feedback
 ↓
Knowledge Graph / Session History
 ↓
RL uses updated state for next exercise
```

The key distinction is:

**RL decides WHAT type of exercise we should give next.
RAG finds the actual exercise from our exercise bank that matches that decision.**

---

### 2. What RAG takes as input

Our RAG system is based on the exercise bank that we loaded into ChromaDB.

The exercise bank contains ~60 exercises with fields such as:

```text
ID
Title
Track
Subcategory
Modality
Instructions
Scoring method
Expected answer (when applicable)
```

For example:

```text
ID: LAN-EXP-SPK-012
Track: Language
Subcategory: Expressive - Spoken
Modality: spoken
Title: Name That Object
Instructions: ...
```

The RAG retrieval process needs:

**A. User profile**

The profile currently contains things like:

```python
{
    "user_id": "...",
    "name": "...",
    "age_group": "adult",
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken",
    "therapy_history": "...",
    "native_language": "English",
    "practice_frequency": "daily"
}
```

For retrieval, the most important fields are:

```text
track
subcategory
modality
```

We are currently only using adults for `age_group`.

**B. Current user need / transcript**

For example:

```text
"I have trouble naming objects."
```

This becomes the semantic query for retrieval.

So conceptually:

```python
profile = {
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken"
}

query = "I have trouble naming objects."
```

RAG uses the profile to constrain/filter the search and the query to find semantically relevant exercises.

---

### 3. Important: RAG should NOT search the entire exercise bank blindly

If the user's profile says:

```text
Track = Language
Subcategory = Expressive - Spoken
Modality = spoken
```

we don't want RAG returning something like:

```text
Speech → Fluency → spoken
```

or:

```text
Language → Receptive → Written
```

even if the semantic similarity happens to be high.

The profile should constrain retrieval first.

Conceptually:

```text
All 60 exercises
       ↓
Filter by user's track
       ↓
Filter by subcategory
       ↓
Filter by modality
       ↓
Semantic similarity search
       ↓
Top relevant exercises
```

So RAG is effectively:

```text
Profile constraints
+
Current user need
+
Exercise bank
        ↓
Relevant exercise candidates
```

---

### 4. What RAG outputs

RAG returns the actual exercise data.

For example:

```python
{
    "id": "LAN-EXP-SPK-012",
    "title": "Name That Object",
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken",
    "instructions": "Look at an object and say its name out loud.",
    "scoring": "llm_correctness_check"
}
```

It could initially return multiple candidates:

```python
[
    exercise_12,
    exercise_7,
    exercise_18
]
```

The exact number depends on the retrieval configuration.

---

# 5. Where your RL model fits

This is the part I think we should keep separate from RAG.

The RL model should decide **which exercise/category of exercise is best to give the user next based on their current state/history.**

For example, the user has previously done:

```text
Exercise 1 → Score: 90%
Exercise 2 → Score: 85%
Exercise 3 → Score: 55%
Exercise 4 → Score: 60%
```

The RL agent can learn that the user is struggling with a certain type of task.

So the RL agent could say:

```text
Next exercise should be:
Language
Expressive - Spoken
spoken
Difficulty: medium
```

Then RAG takes that decision and finds an actual exercise in the exercise bank matching those constraints.

---

# 6. RL → RAG integration

I think the cleanest interface is:

```python
rl_action = {
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken",
    "difficulty": "medium"
}
```

Then RAG receives this as retrieval constraints.

For example:

```python
exercise = retrieve_exercise(
    profile=user_profile,
    query=transcript,
    filters=rl_action
)
```

RAG then searches ChromaDB for exercises that satisfy the RL-selected criteria.

So:

```text
                 User State
                     ↓
                 RL Agent
                     ↓
             Recommended Action
                     ↓
              ┌──────────────┐
              │     RAG      │
              └──────┬───────┘
                     ↓
              Actual Exercise
```

This keeps the responsibilities clean.

---

# 7. What does the RL model use as its STATE?

The RL state should represent what we know about the user at the current point in the session.

Potential state information:

```text
User profile
+
Current track/subcategory
+
Previous exercises
+
Previous scores
+
Recent performance
+
Errors / areas of difficulty
+
Number of attempts
+
Exercise history
+
Potentially current transcript
```

For example:

```python
state = {
    "track": "Language",
    "subcategory": "Expressive - Spoken",

    "recent_scores": [0.90, 0.85, 0.55, 0.60],

    "completed_exercises": [
        "LAN-EXP-SPK-001",
        "LAN-EXP-SPK-007",
        "LAN-EXP-SPK-012"
    ],

    "weak_areas": [
        "object_naming",
        "sentence_fluency"
    ],

    "practice_count": 4
}
```

The RL agent uses this state to select the next action.

---

# 8. What is the RL ACTION?

The action should represent the type of exercise to select next.

For example:

```python
action = {
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken",
    "difficulty": "medium"
}
```

The RL model does NOT necessarily need to return the exact exercise ID.

That's what RAG is good for.

Instead:

```text
RL → "What kind of exercise should we give?"
RAG → "Which actual exercise matches that?"
```

This gives us flexibility.

---

# 9. RAG → Conversation Engine

After RAG finds the exercise:

```python
exercise = {
    "id": "LAN-EXP-SPK-012",
    "title": "Name That Object",
    "instructions": "Look at an object and say its name out loud."
}
```

the result goes to the **Conversation Engine**.

The Conversation Engine is responsible for turning that structured exercise into the actual interaction with the user.

For example:

```text
RAG
 ↓
Exercise object
 ↓
Conversation Engine
 ↓
"Let's try an exercise!

Look around you and choose an object.
Say the name of the object out loud."
 ↓
Twilio
 ↓
WhatsApp
```

---

# 10. What happens after the user responds?

The user sends a voice response.

```text
WhatsApp
 ↓
Twilio
 ↓
Audio
 ↓
Whisper
 ↓
Transcript
 ↓
Scoring
```

The scoring layer evaluates the response.

For example:

```python
score = {
    "exercise_id": "LAN-EXP-SPK-012",
    "correctness": 0.82,
    "fluency": 0.70,
    "pronunciation": 0.88
}
```

The feedback layer then uses this to give the user feedback.

---

# 11. Feedback is NOT the RL model

The feedback layer should be separate.

For example:

```text
Scoring
 ↓
Score = 82%
 ↓
Feedback Layer
 ↓
"Nice work! You correctly named the object.
Try saying the word more smoothly next time."
```

The feedback is for the **user**.

The score/history is also useful for the **RL agent**.

So the same result has two destinations:

```text
                Scoring
                   ↓
             ┌─────┴─────┐
             ↓           ↓
        Feedback       History
             ↓           ↓
           User      Knowledge Graph
                           ↓
                      RL State
                           ↓
                      Next Action
```

---

# 12. Knowledge Graph's role

The Knowledge Graph/session history should store what happened during the session.

Something like:

```text
User
 ↓
attempted Exercise
 ↓
received Score
 ↓
had difficulty with X
 ↓
completed Exercise
 ↓
timestamp
```

Then the RL agent can use this historical information to construct its next state.

So:

```text
Knowledge Graph
       ↓
User's historical performance
       ↓
RL State
       ↓
RL Action
       ↓
RAG
       ↓
Next Exercise
```

---

# 13. The complete integration

The architecture we're aiming for is basically:

```text
                         ┌───────────────┐
                         │ User Profile  │
                         └───────┬───────┘
                                 │
                                 ↓
Audio → Whisper → Transcript → RL Agent
                              │
                              │
                         RL Action
                              │
                              ↓
                       ┌─────────────┐
                       │     RAG     │
                       │             │
                       │ ChromaDB    │
                       │ Exercise    │
                       │ Bank        │
                       └──────┬──────┘
                              │
                              ↓
                         Exercise
                              │
                              ↓
                    Conversation Engine
                              │
                              ↓
                         Twilio/WhatsApp
                              │
                              ↓
                            User
                              │
                              ↓
                         Voice Response
                              │
                              ↓
                           Whisper
                              │
                              ↓
                           Scoring
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                Feedback          Knowledge Graph
                    ↓                   │
                  User                  │
                                        ↓
                                   RL State
                                        │
                                        ↓
                                   RL Agent
```

### The main responsibility split

**RAG:**

```text
Find the appropriate actual exercise
from the exercise bank.
```

**RL:**

```text
Decide what kind of exercise the user
should receive next based on their state
and previous performance.
```

**Conversation Engine:**

```text
Manage the interaction and send/receive
messages through Twilio.
```

**Scoring:**

```text
Evaluate how the user performed.
```

**Feedback:**

```text
Tell the user how they performed.
```

**Knowledge Graph:**

```text
Store the user's session history/performance
so it can be used for future decisions.
```

### The interface I'd recommend between your RL and my RAG

Keep it simple:

```python
# RL output
action = {
    "track": "Language",
    "subcategory": "Expressive - Spoken",
    "modality": "spoken",
    "difficulty": "medium"
}

# RAG input
exercise = retrieve_exercise(
    profile=user_profile,
    query=transcript,
    filters=action
)

# RAG output
exercise = {
    "id": "...",
    "title": "...",
    "instructions": "...",
    "scoring": "..."
}
```

So the important thing is that **RL doesn't need to know how ChromaDB or embeddings work, and RAG doesn't need to make the RL decision.** They communicate through a structured action/constraint object.

That separation should make the integration much easier.
