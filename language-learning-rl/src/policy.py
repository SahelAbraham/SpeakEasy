from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from .areas import NUM_AREAS, STATE_DIM, TOTAL_EXERCISES


class ExerciseAllocationPolicy(nn.Module):
    """
    Policy network that maps user state to a categorical distribution over
    skill areas, then allocates exactly TOTAL_EXERCISES exercises.
    """

    def __init__(self, state_dim: int = STATE_DIM, hidden_dim: int = 64):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, NUM_AREAS),
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        return self.network(state)

    def action_logits(self, state: np.ndarray | torch.Tensor) -> torch.Tensor:
        if isinstance(state, np.ndarray):
            state = torch.from_numpy(state).float()
        if state.ndim == 1:
            state = state.unsqueeze(0)
        return self.forward(state).squeeze(0)

    def allocate_exercises(
        self,
        state: np.ndarray,
        *,
        deterministic: bool = False,
    ) -> tuple[np.ndarray, torch.Tensor, torch.Tensor]:
        logits = self.action_logits(state)
        probs = F.softmax(logits, dim=-1)

        if deterministic:
            allocation = _deterministic_allocation(probs.detach().cpu().numpy())
            dist = torch.distributions.Categorical(probs=probs)
            return allocation, probs.detach(), dist.log_prob(
                torch.tensor(_dominant_area_index(allocation), dtype=torch.long)
            )

        dist = torch.distributions.Categorical(probs=probs)
        samples = dist.sample((TOTAL_EXERCISES,))
        allocation = np.bincount(samples.cpu().numpy(), minlength=NUM_AREAS)
        log_prob = dist.log_prob(samples).sum()
        return allocation.astype(np.int64), probs.detach(), log_prob


def _deterministic_allocation(probs: np.ndarray) -> np.ndarray:
    """Largest-remainder method: proportional counts that sum to TOTAL_EXERCISES."""
    raw = probs * TOTAL_EXERCISES
    base = np.floor(raw).astype(np.int64)
    remainder = TOTAL_EXERCISES - base.sum()

    if remainder > 0:
        fractional_order = np.argsort(raw - base)[::-1]
        for idx in fractional_order[:remainder]:
            base[idx] += 1

    return base


def _dominant_area_index(allocation: np.ndarray) -> int:
    return int(np.argmax(allocation))
