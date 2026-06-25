import os
import subprocess
import warnings
warnings.filterwarnings("ignore")

import whisper

# ── Load model once at import time so it's not reloaded on every call ──
_model = None

def _get_model(model_size="base"):
    global _model
    if _model is None:
        _model = whisper.load_model(model_size)
    return _model


# ── Audio conversion ───────────────────────────────────────────────────
def convert_to_wav(input_path: str) -> str:
    """
    Converts any audio/video file to a 16kHz mono .wav
    that Whisper can process. Returns the path to the new file.
    """
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    subprocess.run([
        "ffmpeg", "-i", input_path,
        "-ar", "16000",   # 16kHz sample rate required by Whisper
        "-ac", "1",       # mono channel
        "-y",             # overwrite if file already exists
        output_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path


# ── Main analysis function ─────────────────────────────────────────────
def analyze_speech(audio_path: str, model_size: str = "base") -> dict:
    """
    Takes an audio file path and returns a dictionary containing:
        - transcription     : full text of what was said
        - segments          : timestamped breakdown of speech
        - speech_rate_wpm   : words per minute
        - total_words       : total word count
        - total_duration_s  : total speaking duration in seconds
        - filler_words      : dict of detected filler words and counts
        - filler_total      : total number of filler words detected
        - language          : auto-detected language code (e.g. 'en')
        - audio_path_used   : the final audio path that was processed

    Supports: .ogg, .mp4, .mp3, .m4a, .wav and most common formats.
    """

    # Convert to wav if needed
    supported_direct = [".wav"]
    ext = os.path.splitext(audio_path)[-1].lower()

    if ext not in supported_direct:
        print(f"[SpeakEasy] Converting {ext} to .wav for processing...")
        audio_path = convert_to_wav(audio_path)

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # Load model and transcribe
    print(f"[SpeakEasy] Transcribing audio...")
    model = _get_model(model_size)
    result = model.transcribe(audio_path, word_timestamps=True)

    # Extract word-level data from segments
    words = []
    for segment in result.get("segments", []):
        if "words" in segment:
            for word in segment["words"]:
                words.append(word)

    # Speech rate
    total_words = len(words)
    if words:
        total_duration = words[-1]["end"] - words[0]["start"]
        speech_rate = (total_words / total_duration) * 60 if total_duration > 0 else 0
    else:
        total_duration = 0
        speech_rate = 0

    # Filler word detection
    FILLERS = {
        "um", "uh", "er", "ah", "like", "so", "basically",
        "literally", "you know", "i mean", "right", "okay"
    }
    filler_count = {}
    for word in words:
        w = word["word"].strip().lower().strip(".,!?\"'")
        if w in FILLERS:
            filler_count[w] = filler_count.get(w, 0) + 1

    # Build output dictionary
    output = {
        "transcription":    result["text"].strip(),
        "segments":         result["segments"],
        "speech_rate_wpm":  round(speech_rate, 1),
        "total_words":      total_words,
        "total_duration_s": round(total_duration, 2),
        "filler_words":     filler_count,
        "filler_total":     sum(filler_count.values()),
        "language":         result.get("language", "unknown"),
        "audio_path_used":  audio_path
    }

    return output


# ── Pretty print helper ────────────────────────────────────────────────
def print_analysis(analysis: dict):
    """
    Prints a clean readable summary of the analysis output.
    Useful for testing and debugging.
    """
    print("\n" + "="*50)
    print("SPEAKEASY — SPEECH ANALYSIS RESULTS")
    print("="*50)
    print(f"Language detected : {analysis['language']}")
    print(f"Total words       : {analysis['total_words']}")
    print(f"Duration          : {analysis['total_duration_s']}s")
    print(f"Speech rate       : {analysis['speech_rate_wpm']} words per minute")
    print(f"Filler words      : {analysis['filler_words']}")
    print(f"Filler total      : {analysis['filler_total']}")
    print(f"\nTranscription:\n{analysis['transcription']}")
    print("="*50 + "\n")


# ── Quick test ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python speech_analysis.py <path_to_audio_file>")
        print("Example: python speech_analysis.py sample.mp4")
    else:
        audio_file = sys.argv[1]
        result = analyze_speech(audio_file)
        print_analysis(result)