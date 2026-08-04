from .agent import LanguageLearningAgent
from .areas import NUM_AREAS, SKILL_AREAS, STATE_DIM
from .proficiency import update_proficiencies

__all__ = [
    "LanguageLearningAgent",
    "SKILL_AREAS",
    "NUM_AREAS",
    "STATE_DIM",
    "update_proficiencies",
]
