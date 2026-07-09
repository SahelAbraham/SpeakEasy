#!/usr/bin/env python3
"""Demo: update proficiencies and get next exercise allocation."""

import json
from pathlib import Path

from src.agent import LanguageLearningAgent, train_policy
from src.areas import SKILL_AREAS


def main() -> None:
    model_path = Path(__file__).resolve().parent / "models" / "policy.pt"

    if not model_path.exists():
        print("No saved model found — training a quick prototype policy...")
        model_path.parent.mkdir(exist_ok=True)
        policy = train_policy(episodes=1200)
        import torch

        torch.save(policy.state_dict(), model_path)

    agent = LanguageLearningAgent(model_path=model_path)

    # Example learner: weak confidence/pronunciation, stronger fluency
    proficiencies = {
        "fluency": 0.72,
        "articulation": 0.58,
        "pronunciation": 0.41,
        "confidence": 0.35,
        "maintenance": 0.63,
    }

    # Scores from the 10 exercises they just completed
    exercise_scores = [
        [0.78, 0.81, 0.74],           # fluency (3 exercises)
        [0.55, 0.60],                 # articulation (2)
        [0.38],                       # pronunciation (1)
        [0.42, 0.48, 0.40, 0.45],     # confidence (4)
        [],                           # maintenance (0)
    ]

    prof_list = [proficiencies[name] for name in SKILL_AREAS]

    print("=== Language Learning RL Prototype ===\n")
    print("Starting proficiencies:")
    print(json.dumps(proficiencies, indent=2))

    print("\nCompleted exercise scores:")
    for name, scores in zip(SKILL_AREAS, exercise_scores):
        print(f"  {name}: {scores if scores else '(none)'}")

    updated, allocation = agent.step(prof_list, exercise_scores)

    print("\nUpdated proficiencies:")
    updated_dict = {name: round(float(value), 3) for name, value in zip(SKILL_AREAS, updated)}
    print(json.dumps(updated_dict, indent=2))

    print("\nRecommended next 10 exercises:")
    for name in SKILL_AREAS:
        print(f"  {name}: {allocation[name]}")
    print(f"\nSummary: {agent.format_allocation(allocation)}")


if __name__ == "__main__":
    main()
