from __future__ import annotations

from pathlib import Path
from typing import Sequence

import numpy as np
import torch

from .areas import TOTAL_EXERCISES
from .policy import ExerciseAllocationPolicy
from .proficiency import update_proficiencies
from .state import allocation_to_dict, build_state_vector


class LanguageLearningAgent:
    """
    RL agent that:
      1. Updates proficiency values from completed exercise scores
      2. Selects the next batch of 10 exercises across skill areas
    """

    def __init__(
        self,
        *,
        model_path: str | Path | None = None,
        learning_rate: float = 0.2,
        momentum: float = 0.35,
        device: str | None = None,
    ):
        self.learning_rate = learning_rate
        self.momentum = momentum
        self.device = torch.device(device or "cpu")
        self.policy = ExerciseAllocationPolicy().to(self.device)

        if model_path and Path(model_path).exists():
            self.policy.load_state_dict(torch.load(model_path, map_location=self.device))
        self.policy.eval()

    def update_track(
        self,
        proficiencies: Sequence[float],
        exercise_scores: Sequence[Sequence[float]],
    ) -> np.ndarray:
        return update_proficiencies(
            proficiencies,
            exercise_scores,
            learning_rate=self.learning_rate,
            momentum=self.momentum,
        )

    def recommend_exercises(
        self,
        proficiencies: Sequence[float],
        exercise_scores: Sequence[Sequence[float]],
        *,
        deterministic: bool = True,
    ) -> dict[str, int]:
        state = build_state_vector(proficiencies, exercise_scores)
        with torch.no_grad():
            allocation, _, _ = self.policy.allocate_exercises(
                state,
                deterministic=deterministic,
            )
        return allocation_to_dict(allocation)

    def step(
        self,
        proficiencies: Sequence[float],
        exercise_scores: Sequence[Sequence[float]],
        *,
        deterministic: bool = True,
    ) -> tuple[np.ndarray, dict[str, int]]:
        updated = self.update_track(proficiencies, exercise_scores)
        allocation = self.recommend_exercises(
            updated,
            exercise_scores,
            deterministic=deterministic,
        )
        return updated, allocation

    def save(self, path: str | Path) -> None:
        torch.save(self.policy.state_dict(), path)

    @staticmethod
    def format_allocation(allocation: dict[str, int]) -> str:
        parts = [
            f"{count} {area}"
            for area, count in allocation.items()
            if count > 0
        ]
        zero_areas = [area for area, count in allocation.items() if count == 0]
        summary = ", ".join(parts) if parts else "no exercises"
        if zero_areas:
            summary += f" (0 for: {', '.join(zero_areas)})"
        return summary


def train_policy(
    *,
    episodes: int = 1500,
    learning_rate: float = 1e-3,
    gamma: float = 0.95,
    seed: int = 42,
) -> ExerciseAllocationPolicy:
    """
    Train the allocation policy with REINFORCE on simulated learners.
    """
    from .environment import LanguageLearningEnvironment

    rng = np.random.default_rng(seed)
    torch.manual_seed(seed)

    env = LanguageLearningEnvironment(rng=rng)
    policy = ExerciseAllocationPolicy()
    optimizer = torch.optim.Adam(policy.parameters(), lr=learning_rate)

    for episode in range(episodes):
        proficiencies = env.reset()
        log_probs: list[torch.Tensor] = []
        rewards: list[float] = []

        for _ in range(5):
            exercise_scores = env.simulate_exercise_scores(
                proficiencies,
                np.zeros(TOTAL_EXERCISES, dtype=np.int64),
            )
            state = build_state_vector(proficiencies, exercise_scores)
            allocation, _, log_prob = policy.allocate_exercises(state, deterministic=False)
            result = env.step(proficiencies, allocation)

            log_probs.append(log_prob)
            rewards.append(result.reward)
            proficiencies = result.updated_proficiencies

        returns: list[float] = []
        running = 0.0
        for reward in reversed(rewards):
            running = reward + gamma * running
            returns.insert(0, running)

        returns_tensor = torch.tensor(returns, dtype=torch.float32)
        if len(returns) > 1:
            returns_tensor = (returns_tensor - returns_tensor.mean()) / (
                returns_tensor.std() + 1e-8
            )

        loss = torch.tensor(0.0)
        for log_prob, return_value in zip(log_probs, returns_tensor):
            loss -= log_prob * return_value

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    policy.eval()
    return policy
