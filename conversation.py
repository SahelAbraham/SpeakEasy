from rag.rag_pipeline import rag_search
from feedback import generate_feedback, format_feedback_message


class ConversationSession:

    def __init__(self, profile):
        self.profile = profile

        self.exercise_queue = []
        self.current_exercise = None

        self.completed_exercises = []

        # Keep track of previous performance
        self.performance_history = []

    def start(self, transcript):
        """
        Start a practice session.

        RAG retrieves exercises based on the
        user's profile and current need.
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

    def submit_response(self, analysis_result):
        """
        Process a completed exercise attempt.

        analysis_result comes from Rabiah's
        speech-analysis pipeline.
        """

        if self.current_exercise is None:
            return {
                "feedback": "There is no active exercise.",
                "next_exercise": None
            }

        # Get previous performance for personalization
        previous_performance = self.get_previous_performance()

        # Generate personalized feedback
        feedback_result = generate_feedback(
            analysis_result=analysis_result,
            exercise=self.current_exercise,
            user_profile=self.profile,
            previous_performance=previous_performance
        )

        # Convert structured feedback into WhatsApp-friendly text
        feedback_message = format_feedback_message(
            feedback_result
        )

        # Store completed exercise
        completed = {
            "exercise": self.current_exercise,
            "analysis": analysis_result,
            "feedback": feedback_result
        }

        self.completed_exercises.append(completed)

        # Store performance for future personalization
        self.performance_history.append({
            "exercise_id": self.current_exercise.get("id"),
            "score": analysis_result.get("score"),
            "weak_phonemes": analysis_result.get(
                "weak_phonemes", []
            )
        })

        # Get next exercise
        next_exercise = self.next_exercise()

        return {
            "feedback": feedback_message,
            "feedback_details": feedback_result,
            "completed_exercise": completed,
            "next_exercise": next_exercise
        }

    def get_previous_performance(self):
        """
        Return recent performance information
        for the feedback LLM.
        """

        if not self.performance_history:
            return {}

        return {
            "recent_attempts": self.performance_history[-5:]
        }
