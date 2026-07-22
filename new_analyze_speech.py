import os
import subprocess
import warnings
warnings.filterwarnings("ignore")

# Fix ffmpeg path (adjust if yours is different)
os.environ["PATH"] = r"C:\ffmpeg\bin" + os.pathsep + os.environ["PATH"]

import whisper
import librosa
import numpy as np
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from sklearn.metrics.pairwise import cosine_similarity


# ── Lazy load models once ──────────────────────────────────────────────
_whisper_model = None
_wav2vec_model = None
_wav2vec_processor = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("[SpeakEasy] Loading Whisper model...")
        _whisper_model = whisper.load_model("base")
    return _whisper_model

def _get_wav2vec():
    global _wav2vec_model, _wav2vec_processor
    if _wav2vec_model is None:
        print("[SpeakEasy] Loading wav2vec2 model...")
        _wav2vec_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        _wav2vec_model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
    return _wav2vec_model, _wav2vec_processor


# ── Audio conversion ───────────────────────────────────────────────────
def convert_to_wav(input_path):
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    subprocess.run([
        "ffmpeg", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-y",
        output_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path


# ── Individual analysis components ─────────────────────────────────────
def transcribe_and_analyze_text(audio_path):
    """Whisper transcription + speech rate + filler words"""
    model = _get_whisper_model()
    result = model.transcribe(audio_path, word_timestamps=True)

    words = []
    for segment in result.get("segments", []):
        if "words" in segment:
            words.extend(segment["words"])

    total_words = len(words)
    if words:
        duration = words[-1]["end"] - words[0]["start"]
        speech_rate = (total_words / duration) * 60 if duration > 0 else 0
    else:
        duration = 0
        speech_rate = 0

    FILLERS = {"um", "uh", "er", "ah", "like", "so", "basically",
               "literally", "you know", "right", "okay"}
    filler_count = {}
    for word in words:
        w = word["word"].strip().lower().strip(".,!?\"'")
        if w in FILLERS:
            filler_count[w] = filler_count.get(w, 0) + 1

    return {
        "transcription": result["text"].strip(),
        "language": result.get("language", "unknown"),
        "speech_rate_wpm": round(speech_rate, 1),
        "total_words": total_words,
        "total_duration_s": round(duration, 2),
        "filler_words": filler_count,
        "filler_total": sum(filler_count.values()),
    }


def score_pronunciation(audio_path):
    """wav2vec2 pronunciation confidence score"""
    model, processor = _get_wav2vec()
    speech, sr = librosa.load(audio_path, sr=16000)
    input_values = processor(speech, sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        logits = model(input_values).logits

    probabilities = torch.softmax(logits, dim=-1)
    max_probs = torch.max(probabilities, dim=-1).values
    avg_confidence = torch.mean(max_probs).item()
    return round(avg_confidence * 100, 1)


def get_speech_embedding(audio_path):
    """768-dim speech embedding for progress tracking"""
    model, processor = _get_wav2vec()
    speech, sr = librosa.load(audio_path, sr=16000)
    input_values = processor(speech, sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        outputs = model(input_values, output_hidden_states=True)

    embedding = torch.mean(outputs.hidden_states[-1], dim=1).squeeze()
    return embedding.numpy()


def compare_embeddings(embedding_1, embedding_2):
    """Cosine similarity between two session embeddings"""
    e1 = np.array(embedding_1).reshape(1, -1)
    e2 = np.array(embedding_2).reshape(1, -1)
    return round(cosine_similarity(e1, e2)[0][0], 4)


# ── Main analysis function ─────────────────────────────────────────────
def analyze_speech(audio_path):
    """
    Full pipeline analysis of a voice message.
    Returns a dictionary containing everything the rest of SpeakEasy needs.
    """
    # Convert to wav if needed
    if not audio_path.endswith(".wav"):
        audio_path = convert_to_wav(audio_path)

    # Run all three analyses
    text_analysis = transcribe_and_analyze_text(audio_path)
    pronunciation_score = score_pronunciation(audio_path)
    embedding = get_speech_embedding(audio_path)

    return {
        # For Anvesha's LLM
        "transcription": text_analysis["transcription"],
        "language": text_analysis["language"],
        "speech_rate_wpm": text_analysis["speech_rate_wpm"],
        "filler_words": text_analysis["filler_words"],
        "filler_total": text_analysis["filler_total"],
        "total_words": text_analysis["total_words"],
        "total_duration_s": text_analysis["total_duration_s"],

        # For Sahel's RL agent
        "pronunciation_score": pronunciation_score,

        # For Tiana's Knowledge Graph
        "embedding": embedding.tolist(),

        # Meta
        "audio_path_used": audio_path,
    }


# ── Pretty print helper ────────────────────────────────────────────────
def print_analysis(analysis):
    print("\n" + "="*50)
    print("SPEAKEASY — SPEECH ANALYSIS RESULTS")
    print("="*50)
    print(f"Language           : {analysis['language']}")
    print(f"Duration           : {analysis['total_duration_s']}s")
    print(f"Total words        : {analysis['total_words']}")
    print(f"Speech rate        : {analysis['speech_rate_wpm']} wpm")
    print(f"Filler words       : {analysis['filler_words']}")
    print(f"Pronunciation score: {analysis['pronunciation_score']}/100")
    print(f"Embedding shape    : {len(analysis['embedding'])} dims")
    print(f"\nTranscription:\n{analysis['transcription']}")
    print("="*50 + "\n")