from __future__ import annotations

from typing import Sequence

import numpy as np

from .areas import NUM_AREAS


def build_state_vector(
    proficiencies: Sequence[float],
    exercise_scores: Sequence[Sequence[float]],
) -> np.ndarray:
    """
    Encode user state for the policy network.

    Features per area (4 areas -> 16 features total):
      - current proficiency
      - mean exercise score (0 if none completed)
      - normalized exercise count
    """
    prof = np.asarray(proficiencies, dtype=np.float32)
    if prof.shape != (NUM_AREAS,):
        raise ValueError(f"Expected {NUM_AREAS} proficiency values, got {prof.shape}")

    means = np.zeros(NUM_AREAS, dtype=np.float32)
    counts = np.zeros(NUM_AREAS, dtype=np.float32)

    for area_idx, scores in enumerate(exercise_scores):
        if scores:
            means[area_idx] = float(np.mean(scores))
            counts[area_idx] = len(scores)

    normalized_counts = counts / max(counts.max(), 1.0)
    weakness = 1.0 - prof
    return np.concatenate([prof, means, normalized_counts, weakness], dtype=np.float32)


def allocation_to_dict(allocation: Sequence[int]) -> dict[str, int]:
    from .areas import SKILL_AREAS

    return {name: int(count) for name, count in zip(SKILL_AREAS, allocation)}


def allocation_from_dict(allocation: dict[str, int]) -> np.ndarray:
    from .areas import SKILL_AREAS

    return np.array([allocation[name] for name in SKILL_AREAS], dtype=np.int64)
