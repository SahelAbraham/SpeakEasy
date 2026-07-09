from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .areas import NUM_AREAS, TOTAL_EXERCISES
from .proficiency import update_proficiencies


@dataclass
class StepResult:
    updated_proficiencies: np.ndarray
    exercise_allocation: np.ndarray
    reward: float


class LanguageLearningEnvironment:
    """
    Simple environment for training the allocation policy.

    Simulates how exercise performance depends on current proficiency and
    how many exercises were assigned to each area.
    """

    def __init__(self, rng: np.random.Generator | None = None):
        self.rng = rng or np.random.default_rng()

    def reset(self) -> np.ndarray:
        return self.rng.uniform(0.2, 0.8, size=NUM_AREAS).astype(np.float32)

    def simulate_exercise_scores(
        self,
        proficiencies: np.ndarray,
        allocation: np.ndarray,
    ) -> list[list[float]]:
        scores_by_area: list[list[float]] = [[] for _ in range(NUM_AREAS)]

        for area_idx, count in enumerate(allocation):
            for _ in range(int(count)):
                noise = self.rng.normal(0.0, 0.08)
                score = proficiencies[area_idx] + 0.12 + noise
                scores_by_area[area_idx].append(float(np.clip(score, 0.0, 1.0)))

        return scores_by_area

    def compute_reward(
        self,
        old_proficiencies: np.ndarray,
        new_proficiencies: np.ndarray,
        allocation: np.ndarray,
        exercise_scores: list[list[float]],
    ) -> float:
        improvement = float((new_proficiencies - old_proficiencies).sum())

        weakness = 1.0 - old_proficiencies
        weakness /= weakness.sum() + 1e-6
        focus_alignment = float(np.dot(weakness, allocation / TOTAL_EXERCISES)) * 2.0

        performance_gap = 0.0
        for area_idx, scores in enumerate(exercise_scores):
            if scores:
                performance_gap += (1.0 - old_proficiencies[area_idx]) * (
                    float(np.mean(scores)) - old_proficiencies[area_idx]
                )

        neglect_penalty = 0.0
        for area_idx, count in enumerate(allocation):
            if old_proficiencies[area_idx] < 0.45 and count == 0:
                neglect_penalty += 0.25

        balance_penalty = float(np.std(allocation / TOTAL_EXERCISES)) * 0.1
        return (
            improvement
            + focus_alignment
            + 0.3 * performance_gap
            - balance_penalty
            - neglect_penalty
        )

    def step(
        self,
        proficiencies: np.ndarray,
        allocation: np.ndarray,
    ) -> StepResult:
        exercise_scores = self.simulate_exercise_scores(proficiencies, allocation)
        updated = update_proficiencies(proficiencies, exercise_scores)
        reward = self.compute_reward(proficiencies, updated, allocation, exercise_scores)
        return StepResult(
            updated_proficiencies=updated,
            exercise_allocation=allocation,
            reward=reward,
        )
