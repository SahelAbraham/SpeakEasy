from __future__ import annotations

from typing import Sequence

import numpy as np

from .areas import NUM_AREAS


def update_proficiencies(
    proficiencies: Sequence[float],
    exercise_scores: Sequence[Sequence[float]],
    *,
    learning_rate: float = 0.2,
    momentum: float = 0.35,
) -> np.ndarray:
    """
    Update proficiency values based on completed exercise scores.

    Each area moves toward its recent performance. Areas with no scores are
    unchanged. Momentum nudges values slightly downward when a user skips an
    area, modeling skill decay from lack of practice.
    """
    current = np.asarray(proficiencies, dtype=np.float32)
    if current.shape != (NUM_AREAS,):
        raise ValueError(f"Expected {NUM_AREAS} proficiency values, got {current.shape}")

    updated = current.copy()

    for area_idx, scores in enumerate(exercise_scores):
        if scores:
            performance = float(np.mean(scores))
            updated[area_idx] += learning_rate * (performance - current[area_idx])
        else:
            updated[area_idx] -= momentum * 0.02

    return np.clip(updated, 0.0, 1.0).astype(np.float32)
