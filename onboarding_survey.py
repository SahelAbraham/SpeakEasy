from onboarding_questions import QUESTIONS
from knowledge_graph import driver, create_user, user_exists

WELCOME = (
    "Welcome to SpeakEasy! This will only take 2 minutes. "
    "There are no right or wrong answers — just answer as honestly as you can. "
    "Any language is okay."
)

AGE_BRACKET_BOUNDARIES = [
    (8, "0_8"),
    (13, "8_13"),
    (18, "13_17"),
]
AGE_BRACKET_DEFAULT = "18_plus"

AGE_BRACKET_TO_GROUP = {
    "0_8": "child",
    "8_13": "child",
    "13_17": "teen",
    "18_plus": "adult",
}

_survey_state = {}


def _normalize(text):
    return text.strip().lower().replace("–", "-").replace("—", "-")


def _candidates(index, option):
    labels = {_normalize(option["label"])}
    labels.add(str(index))
    return labels


def get_age_bracket(age):
    for cutoff, bracket in AGE_BRACKET_BOUNDARIES:
        if age < cutoff:
            return bracket
    return AGE_BRACKET_DEFAULT


def get_age_group(age_bracket):
    return AGE_BRACKET_TO_GROUP[age_bracket]


def format_question(question):
    lines = [question["prompt"]]
    if question["type"] in ("single_select", "multi_select"):
        for i, option in enumerate(question["options"], start=1):
            lines.append(f"{i}. {option['label']}")
        if question["type"] == "multi_select":
            lines.append("(Reply with the numbers separated by commas, e.g. 1,3,5)")
    return "\n".join(lines)


def parse_single_select(text, options):
    normalized = _normalize(text)
    for i, option in enumerate(options, start=1):
        if normalized in _candidates(i, option):
            return option["value"]
    return None


def parse_multi_select(text, options):
    text = text.strip()
    if not text:
        return None

    parts = text.split(",") if "," in text else text.split()
    values = []
    for part in parts:
        normalized = _normalize(part)
        matched = None
        for i, option in enumerate(options, start=1):
            if normalized in _candidates(i, option):
                matched = option["value"]
                break
        if matched is None:
            return None
        if matched not in values:
            values.append(matched)

    return values or None


def needs_onboarding(user_id):
    return not is_in_survey(user_id) and not user_exists(driver, user_id)


def is_in_survey(user_id):
    return user_id in _survey_state


def start_survey(user_id):
    _survey_state[user_id] = {"index": 0, "answers": {}}
    return WELCOME + "\n\n" + format_question(QUESTIONS[0])


def handle_message(user_id, body):
    """Advances the survey by one answer.

    Returns (reply_text, final_answers). final_answers is None until the
    last question is answered, at which point it holds every collected
    field (minus the raw "age", replaced by "age_group") for handoff to
    Sahel's profile builder.
    """
    state = _survey_state[user_id]
    question = QUESTIONS[state["index"]]

    if question["type"] == "free_text":
        value = body.strip()

    elif question["type"] == "free_text_numeric":
        try:
            value = int(body.strip())
        except ValueError:
            return f"Please reply with just a number.\n\n{format_question(question)}", None

    elif question["type"] == "single_select":
        value = parse_single_select(body, question["options"])
        if value is None:
            return f"Sorry, I didn't catch that — please reply with one of the numbers below.\n\n{format_question(question)}", None

    elif question["type"] == "multi_select":
        value = parse_multi_select(body, question["options"])
        if value is None:
            return f"Sorry, I didn't catch that — please reply with the numbers, separated by commas.\n\n{format_question(question)}", None

    state["answers"][question["field"]] = value
    state["index"] += 1

    if state["index"] >= len(QUESTIONS):
        return _complete_survey(user_id)

    return format_question(QUESTIONS[state["index"]]), None


def _complete_survey(user_id):
    answers = _survey_state.pop(user_id)["answers"]

    age = answers.pop("age")
    answers["age_bracket"] = get_age_bracket(age)
    answers["age_group"] = get_age_group(answers["age_bracket"])

    create_user(
        driver,
        user_id=user_id,
        phone_number=user_id.replace("whatsapp:", ""),
        age_group=answers["age_group"],
        native_language=answers["native_language"],
    )

    reply = "Thanks! Your profile is all set up. Let's get started with your first exercise soon 🎉"
    return reply, answers
