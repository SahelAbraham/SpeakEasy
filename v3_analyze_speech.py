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
from datetime import datetime
from difflib import SequenceMatcher
import google.generativeai as genai
import json
from dotenv import load_dotenv
load_dotenv()


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
    "segments": result.get("segments", []),   # ← add this if missing
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
    return round(cosine_similarity(e1, e2)[0][0], 4) * 100


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
        "transcription": text_analysis["transcription"],
        "language": text_analysis["language"],
        "segments": text_analysis["segments"],
        "speech_rate_wpm": text_analysis["speech_rate_wpm"],
        "filler_words": text_analysis["filler_words"],
        "filler_total": text_analysis["filler_total"],
        "total_words": text_analysis["total_words"],
        "total_duration_s": text_analysis["total_duration_s"],
        "pronunciation_score": pronunciation_score,
        "embedding": embedding.tolist(),
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


def score_voice_disorders(audio_path):
    """
    Scores Voice Disorders exercises using pitch tracking via librosa.pyin.
    Measures pitch stability and voiced ratio.
    Returns a score 0-100.
    """
    speech, sr = librosa.load(audio_path, sr=16000)

    f0, voiced_flag, voiced_probs = librosa.pyin(
        speech,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=sr
    )

    voiced_ratio = float(voiced_flag.mean())
    voiced_f0 = f0[voiced_flag]

    if len(voiced_f0) < 10:
        return {
            "score": 0,
            "voiced_ratio": 0,
            "pitch_stability": 0,
            "pitch_range_hz": 0,
            "scoring_method": "pitch_tracking",
            "note": "Too little voiced audio detected"
        }

    pitch_stability = 1 - (voiced_f0.std() / (voiced_f0.mean() + 1e-6))
    pitch_stability = float(max(0, min(1, pitch_stability)))
    pitch_range = float(voiced_f0.max() - voiced_f0.min())

    score = round((voiced_ratio * 0.5 + pitch_stability * 0.5) * 100, 1)

    return {
        "score": score,
        "voiced_ratio": round(voiced_ratio, 3),
        "pitch_stability": round(pitch_stability, 3),
        "pitch_range_hz": round(pitch_range, 1),
        "scoring_method": "pitch_tracking"
    }

# ── Deterministic scoring helpers (no LLM needed) ──────────────────────

# def score_sequence_recall(transcription, expected_sequence):
#     """For rote sequence tasks: counting, days, months."""
#     spoken_words = transcription.lower().replace(",", "").split()
#     expected_words = [w.lower() for w in expected_sequence]

#     correct = 0
#     for i, word in enumerate(expected_words):
#         if i < len(spoken_words) and spoken_words[i] == word:
#             correct += 1

#     score = round((correct / len(expected_words)) * 100, 1)
#     return {
#         "score": score,
#         "correct_count": correct,
#         "expected_count": len(expected_words),
#         "missing_or_wrong": expected_words[correct:] if correct < len(expected_words) else []
#     }


# def score_category_naming(transcription, valid_set):
#     """For rapid-fire category tasks: name animals, fruits, etc."""
#     spoken_words = set(transcription.lower().replace(",", "").split())
#     valid_answers = spoken_words.intersection(valid_set)
#     invalid_answers = spoken_words - valid_set

#     return {
#         "valid_count": len(valid_answers),
#         "valid_words": list(valid_answers),
#         "invalid_words": list(invalid_answers),
#         "score": min(len(valid_answers) * 10, 100)
#     }


# def score_yes_no(transcription, correct_answer):
#     """For true/false or yes/no listening comprehension tasks."""
#     response = transcription.lower()
#     said_true = any(w in response for w in ["true", "yes", "correct"])
#     said_false = any(w in response for w in ["false", "no", "incorrect"])

#     if said_true and not said_false:
#         user_answer = "true"
#     elif said_false and not said_true:
#         user_answer = "false"
#     else:
#         user_answer = "unclear"

#     return {
#         "user_answer": user_answer,
#         "correct": user_answer == correct_answer.lower(),
#         "score": 100 if user_answer == correct_answer.lower() else 0
#     }




# def score_keyword_match(transcription, valid_keywords):
#     """
#     Checks if the response contains ANY of the acceptable keywords/synonyms.
#     Used for single-answer naming tasks (e.g. 'what is this object called?').
#     """
#     response = transcription.lower()
#     matched = [kw for kw in valid_keywords if kw.lower() in response]

#     return {
#         "matched": matched,
#         "score": 100 if matched else 0
#     }


# def score_word_inclusion(transcription, required_words):
#     """
#     Checks how many of the required words appear anywhere in the response,
#     regardless of order or sentence structure.
#     Used for 'use these words' or 'repeat back these key terms' tasks.
#     """
#     response = transcription.lower()
#     found = [w for w in required_words if w.lower() in response]

#     score = round((len(found) / len(required_words)) * 100, 1)
#     return {
#         "found": found,
#         "missing": [w for w in required_words if w not in found],
#         "score": score
#     }



def _similar(word_a, word_b, threshold=0.75):
    """
    Returns True if two words are close enough to count as a match,
    even with transcription noise from slurred/unclear speech.
    threshold 0.75 = allows small differences (e.g. 'wensday' ~ 'wednesday')
    but still rejects genuinely different words.
    """
    return SequenceMatcher(None, word_a, word_b).ratio() >= threshold


def score_sequence_recall(transcription, expected_sequence):
    """For rote sequence tasks: counting, days, months. Fuzzy-tolerant."""
    spoken_words = transcription.lower().replace(",", "").split()
    expected_words = [w.lower() for w in expected_sequence]

    correct = 0
    close_but_unclear = []
    missing_or_wrong = []

    for i, word in enumerate(expected_words):
        if i < len(spoken_words):
            spoken = spoken_words[i]
            if spoken == word:
                correct += 1
            elif _similar(spoken, word):
                correct += 1
                close_but_unclear.append({"expected": word, "heard": spoken})
            else:
                missing_or_wrong.append(word)
        else:
            missing_or_wrong.append(word)

    score = round((correct / len(expected_words)) * 100, 1)
    return {
        "score": score,
        "correct_count": correct,
        "expected_count": len(expected_words),
        "missing_or_wrong": missing_or_wrong,
        "close_but_unclear": close_but_unclear   # flags likely articulation issues, not wrong answers
    }


def score_category_naming(transcription, valid_set):
    """For rapid-fire category tasks. Fuzzy-tolerant against the valid set."""
    spoken_words = set(transcription.lower().replace(",", "").split())
    valid_answers = []
    close_but_unclear = []
    invalid_answers = []

    for word in spoken_words:
        if word in valid_set:
            valid_answers.append(word)
        else:
            match = next((v for v in valid_set if _similar(word, v)), None)
            if match:
                valid_answers.append(match)
                close_but_unclear.append({"expected": match, "heard": word})
            else:
                invalid_answers.append(word)

    return {
        "valid_count": len(valid_answers),
        "valid_words": valid_answers,
        "invalid_words": invalid_answers,
        "close_but_unclear": close_but_unclear,
        "score": min(len(valid_answers) * 10, 100)
    }


def score_yes_no(transcription, correct_answer):
    """For true/false or yes/no listening comprehension tasks."""
    response = transcription.lower()
    said_true = any(w in response for w in ["true", "yes", "correct"])
    said_false = any(w in response for w in ["false", "no", "incorrect"])

    if said_true and not said_false:
        user_answer = "true"
    elif said_false and not said_true:
        user_answer = "false"
    else:
        user_answer = "unclear"

    return {
        "user_answer": user_answer,
        "correct": user_answer == correct_answer.lower(),
        "score": 100 if user_answer == correct_answer.lower() else 0
    }


def score_keyword_match(transcription, valid_keywords):
    """Checks for exact or close matches to acceptable keywords/synonyms."""
    response_words = transcription.lower().replace(",", "").split()
    matched = []
    close_but_unclear = []

    for kw in valid_keywords:
        kw = kw.lower()
        if kw in response_words or kw in transcription.lower():
            matched.append(kw)
        else:
            near = next((w for w in response_words if _similar(w, kw)), None)
            if near:
                matched.append(kw)
                close_but_unclear.append({"expected": kw, "heard": near})

    return {
        "matched": matched,
        "close_but_unclear": close_but_unclear,
        "score": 100 if matched else 0
    }


def score_word_inclusion(transcription, required_words):
    """Checks how many required words appear, fuzzy-tolerant per word."""
    response_words = transcription.lower().replace(",", "").split()
    found = []
    close_but_unclear = []

    for w in required_words:
        w = w.lower()
        if w in response_words:
            found.append(w)
        else:
            near = next((rw for rw in response_words if _similar(rw, w)), None)
            if near:
                found.append(w)
                close_but_unclear.append({"expected": w, "heard": near})

    score = round((len(found) / len(required_words)) * 100, 1)
    return {
        "found": found,
        "missing": [w for w in required_words if w.lower() not in found],
        "close_but_unclear": close_but_unclear,
        "score": score
    }

# LLM scoring for the 4 open-ended exercises

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
_llm_model = genai.GenerativeModel("gemini-3.5-flash-lite")


def score_with_llm(transcription, exercise_instructions, exercise_title):
    """
    For open-ended Language exercises with no fixed correct answer
    (synonym swap, tense shift, sentence correction, description tasks).
    Returns a score 0-100 and a brief reason.
    """
    prompt = f"""
You are scoring a speech therapy language exercise. Be lenient toward
minor grammar issues, transcription noise, or informal phrasing — 
focus on whether the core task was accomplished correctly.

Exercise: {exercise_title}
Instructions: {exercise_instructions}
User's spoken response (transcribed): "{transcription}"

Respond ONLY with valid JSON in this exact format, nothing else:
{{"score": <integer 0-100>, "reason": "<one short sentence explaining the score>"}}
"""

    try:
        response = _llm_model.generate_content(prompt)
        text = response.text.strip()
        # strip markdown code fences if the model adds them
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        return {
            "score": float(parsed["score"]),
            "reason": parsed["reason"]
        }
    except Exception as e:
        # fail safe — don't crash the whole pipeline if the LLM call fails
        return {
            "score": None,
            "reason": f"LLM scoring failed: {str(e)}"
        }

# ── Clarity report for hearing-impaired / struggling users ─────────────

def generate_clarity_report(audio_path):
    """
    Text-based pronunciation clarity report with a visual bar
    and timestamped weak spots.
    """
    model, processor = _get_wav2vec()
    speech, sr = librosa.load(audio_path, sr=16000)
    input_values = processor(speech, sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        logits = model(input_values).logits

    probabilities = torch.softmax(logits, dim=-1)
    max_probs = torch.max(probabilities, dim=-1).values.squeeze().tolist()

    overall_score = round(sum(max_probs) / len(max_probs) * 100, 1)

    audio_duration = len(speech) / sr
    chunk_duration = 2
    samples_per_chunk = int(len(max_probs) / audio_duration * chunk_duration)

    chunks = []
    weak_spots = []

    for i in range(0, len(max_probs), samples_per_chunk):
        chunk = max_probs[i:i + samples_per_chunk]
        if not chunk:
            break
        chunk_score = round(sum(chunk) / len(chunk) * 100, 1)
        start_time = round(i / len(max_probs) * audio_duration, 1)
        end_time = round(min(
            (i + samples_per_chunk) / len(max_probs) * audio_duration,
            audio_duration
        ), 1)

        chunks.append({"start": start_time, "end": end_time, "score": chunk_score})

        if chunk_score < 70:
            weak_spots.append(f"{start_time}-{end_time}s")

    filled = int(overall_score / 10)
    empty = 10 - filled
    bar = "█" * filled + "░" * empty

    if overall_score >= 85:
        rating = "Excellent"
    elif overall_score >= 70:
        rating = "Good"
    elif overall_score >= 50:
        rating = "Needs practice"
    else:
        rating = "Keep going"

    report = f"Your pronunciation clarity:\n"
    report += f"{bar}  {overall_score}% — {rating}\n\n"

    if weak_spots:
        report += f"Weak spots: seconds {', '.join(weak_spots)}\n"
        report += "Try repeating those parts slowly.\n\n"
    else:
        report += "No major weak spots detected — great job!\n\n"

    report += "Breakdown:\n"
    for chunk in chunks:
        chunk_filled = int(chunk["score"] / 10)
        chunk_empty = 10 - chunk_filled
        chunk_bar = "█" * chunk_filled + "░" * chunk_empty
        report += f"  {chunk['start']:>5}s - {chunk['end']:>5}s  {chunk_bar}  {chunk['score']}%\n"

    return {
        "report": report,
        "overall_score": overall_score,
        "rating": rating,
        "weak_spots": weak_spots,
        "chunks": chunks
    }


# ── Track scoring router ────────────────────────────────────────────────

def compute_track_scores(analysis_result, subcategory, scoring_type=None,
                          expected_answer=None, exercise_instructions=None,
                          audio_path=None):
    result = {"subcategory": subcategory}

    if subcategory == "Fluency":
        wpm = analysis_result["speech_rate_wpm"]
        fillers = analysis_result["filler_total"]
        rate_score = max(0, 100 - abs(wpm - 140) * 0.5)
        filler_penalty = min(fillers * 5, 30)
        result["score"] = round(max(0, rate_score - filler_penalty), 1)
        result["scoring_method"] = "audio_clarity"

    elif subcategory == "Motor Speech (Dysarthria)":
        result["score"] = analysis_result["pronunciation_score"]
        result["scoring_method"] = "audio_clarity"

    elif scoring_type == "sequence_recall":
        r = score_sequence_recall(analysis_result["transcription"], expected_answer)
        result["score"] = r["score"]; result["details"] = r
        result["scoring_method"] = "deterministic_sequence"

    elif scoring_type == "category_naming":
        r = score_category_naming(analysis_result["transcription"], set(expected_answer))
        result["score"] = r["score"]; result["details"] = r
        result["scoring_method"] = "deterministic_category"

    elif scoring_type == "keyword_match":
        r = score_keyword_match(analysis_result["transcription"], expected_answer)
        result["score"] = r["score"]; result["details"] = r
        result["scoring_method"] = "deterministic_keyword"

    elif scoring_type == "word_inclusion":
        r = score_word_inclusion(analysis_result["transcription"], expected_answer)
        result["score"] = r["score"]; result["details"] = r
        result["scoring_method"] = "deterministic_word_inclusion"

    elif scoring_type == "yes_no":
        r = score_yes_no(analysis_result["transcription"], expected_answer)
        result["score"] = r["score"]; result["details"] = r
        result["scoring_method"] = "deterministic_yes_no"

    elif scoring_type == "needs_pitch_tracking":
            r = score_voice_disorders(audio_path)
            result["score"] = r["score"]
            result["details"] = r
            result["scoring_method"] = "pitch_tracking"

    else:
        r = score_with_llm(analysis_result["transcription"], exercise_instructions or "")
        result["score"] = r["score"]
        result["details"] = r
        result["scoring_method"] = "llm_correctness_check"

    return result


_phoneme_model = None
_phoneme_processor = None

def _get_phoneme_model():
    global _phoneme_model, _phoneme_processor
    if _phoneme_model is None:
        print("[SpeakEasy] Loading phoneme model...")
        _phoneme_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
        _phoneme_model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
    return _phoneme_model, _phoneme_processor


FUNCTION_WORDS = {"so", "a", "an", "the", "it", "is", "are", "we", "you", "i",
                   "he", "she", "to", "of", "in", "on", "at", "and", "or", "but"}


def identify_weak_phonemes(audio_path, transcription_segments, threshold=50.0):
    """
    Cross-references word-level timestamps (Whisper) with
    phoneme-level confidence (wav2vec2 phoneme model) to find
    which specific speech SOUND was weakest within each word.

    Only returns words that are genuinely weak (below threshold)
    and skips common function words that aren't useful coaching targets.
    """
    model, processor = _get_phoneme_model()
    speech, sr = librosa.load(audio_path, sr=16000)
    input_values = processor(speech, sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        logits = model(input_values).logits

    probabilities = torch.softmax(logits, dim=-1)
    max_probs = torch.max(probabilities, dim=-1).values.squeeze()
    top_ids = torch.argmax(probabilities, dim=-1).squeeze()

    vocab = processor.tokenizer.get_vocab()
    id_to_phoneme = {v: k for k, v in vocab.items()}

    total_timesteps = probabilities.shape[1]
    audio_duration = len(speech) / sr

    results = []

    for segment in transcription_segments:
        if "words" not in segment:
            continue
        for word in segment["words"]:
            word_text = word["word"].strip().lower().strip(".,!?\"'")

            # Skip function words — rarely useful coaching targets
            if word_text in FUNCTION_WORDS:
                continue

            w_start, w_end = word["start"], word["end"]
            start_idx = int((w_start / audio_duration) * total_timesteps)
            end_idx = max(int((w_end / audio_duration) * total_timesteps), start_idx + 1)

            word_confidences = max_probs[start_idx:end_idx]
            word_phoneme_ids = top_ids[start_idx:end_idx]

            if len(word_confidences) == 0:
                continue

            weakest_pos = torch.argmin(word_confidences).item()
            weakest_conf = word_confidences[weakest_pos].item()
            weakest_char_id = word_phoneme_ids[weakest_pos].item()
            weakest_phoneme = id_to_phoneme.get(weakest_char_id, "?")

            # Skip meaningless padding/blank tokens
            if weakest_phoneme in ["<pad>", "?"]:
                continue

            # Only report genuinely weak words
            if weakest_conf * 100 < threshold:
                results.append({
                    "word": word["word"].strip(),
                    "start": round(w_start, 2),
                    "end": round(w_end, 2),
                    "weakest_phoneme": weakest_phoneme,
                    "confidence": round(weakest_conf * 100, 1)
                })

    return results



def score_pronunciation_phonetic(audio_path):
    speech, sr = librosa.load(audio_path, sr=16000)
    input_values = phoneme_processor(speech, sampling_rate=16000, return_tensors="pt").input_values

    with torch.no_grad():
        logits = phoneme_model(input_values).logits

    probabilities = torch.softmax(logits, dim=-1)
    max_probs = torch.max(probabilities, dim=-1).values
    avg_confidence = torch.mean(max_probs).item()

    return round(avg_confidence * 100, 1)




# ── Single entry point for a completed exercise attempt ────────────────

def process_exercise_attempt(audio_path, exercise_id, subcategory, user_id, session_id,
                               scoring_type=None, expected_answer=None, exercise_instructions=None):
    analysis = analyze_speech(audio_path)
    weak_phonemes = identify_weak_phonemes(audio_path, analysis["segments"])

    track_result = compute_track_scores(
            analysis, subcategory,
            scoring_type=scoring_type,
            expected_answer=expected_answer,
            exercise_instructions=exercise_instructions,
            audio_path=audio_path
        )

    return {
        "user_id": user_id,
        "session_id": session_id,
        "exercise_id": exercise_id,
        "subcategory": subcategory,
        "timestamp": datetime.now().isoformat(),
        "transcription": analysis["transcription"],
        "speech_rate_wpm": analysis["speech_rate_wpm"],
        "filler_words": analysis["filler_words"],
        "filler_total": analysis["filler_total"],
        "total_duration_s": analysis["total_duration_s"],
        "score": track_result["score"],
        "scoring_method": track_result["scoring_method"],
        "scoring_details": track_result.get("details", {}),
        "weak_phonemes": weak_phonemes,
        "embedding": analysis["embedding"],
    }