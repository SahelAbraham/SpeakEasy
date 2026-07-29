class User:
    def __init__(
        self,
        name=None,
        age=None,
        gender=None,
        educational_level=None,
        occupation=None,
        category_of_learning=None,
        goals_for_patient=None,
        current_level_of_learning=None,
        examples_of_patient_speech=None,
    ):
        self.name = name
        self.age = age
        self.gender = gender
        self.educational_level = educational_level
        self.occupation = occupation
        self.category_of_learning = category_of_learning
        self.goals_for_patient = goals_for_patient
        self.current_level_of_learning = current_level_of_learning
        self.examples_of_patient_speech = examples_of_patient_speech

    def __repr__(self):
        return (
            "User(\n"
            f"  name={self.name!r},\n"
            f"  age={self.age},\n"
            f"  gender={self.gender!r},\n"
            f"  educational_level={self.educational_level!r},\n"
            f"  occupation={self.occupation!r},\n"
            f"  category_of_learning={self.category_of_learning!r},\n"
            f"  goals_for_patient={self.goals_for_patient!r},\n"
            f"  current_level_of_learning={self.current_level_of_learning!r},\n"
            f"  examples_of_patient_speech={self.examples_of_patient_speech!r},\n"
            ")"
        )


def ask(prompt):
    """Ask a question and return the trimmed string answer."""
    return input(prompt).strip()


def ask_int(prompt):
    """Ask a question and keep retrying until a valid integer is given."""
    while True:
        answer = input(prompt).strip()
        if answer.isdigit():
            return int(answer)
        print("Please enter a valid number.")


def ask_choice(prompt, choices):
    """
    Ask a question and keep retrying until the answer matches
    one of the allowed choices (case-insensitive).
    """
    choices_lower = [c.lower() for c in choices]
    prompt_with_choices = f"{prompt} ({'/'.join(choices)}) "
    while True:
        answer = input(prompt_with_choices).strip()
        if answer.lower() in choices_lower:
            # return the properly-cased version from `choices`
            return choices[choices_lower.index(answer.lower())]
        print(f"Please enter one of: {', '.join(choices)}")


def ask_paragraph(prompt):
    """
    Ask a question that expects a short-answer, multi-sentence response.
    The person can type across multiple lines; they finish by
    entering a blank line (just pressing Enter).
    """
    print(prompt + " (press Enter on a blank line when done)")
    lines = []
    while True:
        line = input()
        if line.strip() == "":
            break
        lines.append(line)
    return " ".join(lines).strip()


def run_survey():
    print("Let's fill out this profile.\n")

    name = ask("Name: ")
    age = ask_int("Age: ")
    gender = ask_choice("Gender:", ["Male", "Female", "Other"])
    educational_level = ask("Educational Level (a couple words): ")
    occupation = ask("Occupation (a couple words): ")

    category_of_learning = ask_paragraph("Category of Learning:")
    goals_for_patient = ask_paragraph("Goals for Patient:")
    current_level_of_learning = ask_paragraph("Current Level of Learning:")
    examples_of_patient_speech = ask_paragraph(
        "Examples of Patient Speech and Previous Work:"
    )

    user = User(
        name=name,
        age=age,
        gender=gender,
        educational_level=educational_level,
        occupation=occupation,
        category_of_learning=category_of_learning,
        goals_for_patient=goals_for_patient,
        current_level_of_learning=current_level_of_learning,
        examples_of_patient_speech=examples_of_patient_speech,
    )
    return user


def main():
    user = run_survey()
    print("\nHere's what we collected:")
    print(user)
    return user


if __name__ == "__main__":
    main()