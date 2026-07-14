QUESTIONS = [
    {
        "field": "name",
        "type": "free_text",
        "prompt": "What's your name?",
    },
    {
        "field": "age",
        "type": "free_text_numeric",
        "prompt": "How old are you?",
    },
    {
        "field": "concerns",
        "type": "multi_select",
        "prompt": "What brings you to SpeakEasy?",
        "options": [
            {"value": "stutter_repeats", "label": "I get stuck, repeat words, or stutter when I speak"},
            {"value": "hard_to_understand", "label": "People often find it hard to understand me"},
            {"value": "anxious_speaking", "label": "I feel nervous or anxious when speaking"},
            {"value": "hearing_device_improve", "label": "I use a hearing device and want to improve my speech"},
            {"value": "post_therapy", "label": "I was in speech therapy and want to keep practising"},
            {"value": "second_language_confidence", "label": "I want to sound clearer or more confident in a second language"},
        ],
    },
    {
        "field": "therapy_history",
        "type": "single_select",
        "prompt": "Have you ever worked with a speech therapist?",
        "options": [
            {"value": "current", "label": "Yes, I currently see one"},
            {"value": "past", "label": "Yes, but I stopped"},
            {"value": "never", "label": "No, never"},
        ],
    },
    {
        "field": "difficulty_contexts",
        "type": "multi_select",
        "prompt": "When does speaking feel hardest for you?",
        "options": [
            {"value": "one_on_one", "label": "Talking one on one"},
            {"value": "group_crowd", "label": "Speaking in a group or crowd"},
            {"value": "formal_professional", "label": "Formal or professional settings"},
            {"value": "phone_video", "label": "On the phone or video calls"},
            {"value": "most_of_the_time", "label": "Most of the time"},
            {"value": "not_sure", "label": "I'm not sure yet"},
        ],
    },
    {
        "field": "hearing_device",
        "type": "single_select",
        "prompt": "Do you use a hearing device?",
        "options": [
            {"value": "cochlear_implant", "label": "Yes, a cochlear implant"},
            {"value": "hearing_aid", "label": "Yes, a hearing aid"},
            {"value": "none", "label": "No"},
            {"value": "not_sure", "label": "I'm not sure"},
        ],
    },
    {
        "field": "native_language",
        "type": "free_text",
        "prompt": "What is your first language?\n(Any language is fine)",
    },
    {
        "field": "self_described_challenge",
        "type": "free_text",
        "prompt": "In your own words, what feels hardest about speaking for you?\n(Write as little or as much as you like)",
    },
    {
        "field": "practice_time",
        "type": "single_select",
        "prompt": "How much time can you practice each day?",
        "options": [
            {"value": "5_10_min", "label": "5–10 minutes"},
            {"value": "10_20_min", "label": "10–20 minutes"},
            {"value": "20_plus_min", "label": "20+ minutes"},
        ],
    },
]
