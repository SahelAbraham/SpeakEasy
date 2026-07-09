#!/usr/bin/env python3
"""Train the exercise allocation policy and save weights."""

from pathlib import Path

from src.agent import train_policy


def main() -> None:
    model_dir = Path(__file__).resolve().parent.parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / "policy.pt"

    print("Training policy on simulated learners...")
    policy = train_policy(episodes=2000)
    import torch

    torch.save(policy.state_dict(), model_path)
    print(f"Saved trained policy to {model_path}")


if __name__ == "__main__":
    main()
