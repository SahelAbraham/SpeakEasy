from rag.rag_pipeline import rag_search


class ConversationSession:

    def __init__(self, profile):
        self.profile = profile
        self.exercise_queue = []
        self.current_exercise = None
        self.completed_exercises = []

    def start(self, transcript):
        """
        Start a new practice session.

        Uses the user's profile and transcript
        to retrieve relevant exercises.
        """

        self.exercise_queue = rag_search(
            self.profile,
            transcript
        )

        return self.next_exercise()

    def next_exercise(self):
        """
        Select the next exercise from the RAG results.
        """

        if not self.exercise_queue:
            self.current_exercise = None
            return None

        self.current_exercise = self.exercise_queue.pop(0)

        return self.current_exercise

    def submit_response(self, response):
        """
        Store the user's response and move
        to the next exercise.
        """

        if self.current_exercise is not None:

            self.completed_exercises.append({
                "exercise": self.current_exercise,
                "response": response
            })

        return self.next_exercise()
