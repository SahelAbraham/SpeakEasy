# SpeakEasy

**SpeakEasy** : An Accessible AI Speech Practice Companion

SpeakEasy is a WhatsApp-native AI companion designed to make consistent speech practice accessible to individuals who cannot afford or regularly access speech therapy, including children with articulation difficulties, adults in or post-therapy, and hearing-impaired individuals adapting to new devices.

Users begin with a short onboarding survey that assigns them to a personalized exercise track. Every voice message they send is transcribed via Whisper, analyzed through a Mel Spectrogram and CNN pipeline for pronunciation scoring, and converted into speech embeddings using wav2vec to track progress over time. A Knowledge Graph maps each user's session history and weak areas, while a Contextual Bandit Reinforcement Learning agent continuously adapts which exercises to prioritize based on performance. All feedback is delivered conversationally through an LLM grounded in real speech therapy literature via RAG.
Stretch features depending on timeline include Mozilla Common Voice integration for multilingual accent support, a resource bot for surfacing professional help, and a translator layer for non-English confidence track users

