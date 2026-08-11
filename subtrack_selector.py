import random

from knowledge_graph import get_subtrack_scores, update_subtrack_score
from rag.subtrack_map import SUBCATEGORY_TO_SUBTRACK, SUBTRACK_TO_SUBCATEGORY

EPSILON = 0.15  # chance of exploring a non-weakest subtrack


def choose_next_subcategory(user_id: str, track: str, last_subcategory: str, score_0_100):
    """
    Folds the just-completed exercise's score into its subtrack,
    then picks the subcategory the next exercise should come from.
    """
    if score_0_100 is not None and last_subcategory in SUBCATEGORY_TO_SUBTRACK:
        subtrack_id = SUBCATEGORY_TO_SUBTRACK[last_subcategory]
        update_subtrack_score(user_id, subtrack_id, score_0_100 / 100.0)

    scores = get_subtrack_scores(user_id, track)  # {track_id: score}
    if not scores:
        raise RuntimeError(f"No subtracks found for user {user_id} on track {track}")

    if random.random() < EPSILON:
        next_subtrack_id = random.choice(list(scores.keys()))
    else:
        lowest_score = min(scores.values())
        weakest = [tid for tid, s in scores.items() if s == lowest_score]
        next_subtrack_id = random.choice(weakest)

    return SUBTRACK_TO_SUBCATEGORY[next_subtrack_id]


def choose_initial_subcategory(user_id: str, track: str):
    """For the very first exercise of a session, before any score exists."""
    scores = get_subtrack_scores(user_id, track)
    if not scores:
        raise RuntimeError(f"No subtracks found for user {user_id} on track {track}")

    next_subtrack_id = random.choice(list(scores.keys()))
    return SUBTRACK_TO_SUBCATEGORY[next_subtrack_id]