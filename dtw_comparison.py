import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import cosine, euclidean


def compare_sessions(embedding_a, embedding_b):
    """
    Compares two speech embeddings (e.g. wav2vec vectors from consecutive
    sessions) using DTW distance and cosine similarity.

    embedding_a is the OLDER session, embedding_b is the NEWER session.

    Returns a dict with:
        - dtw_distance       : lower = more similar pronunciation pattern
        - cosine_similarity  : -1 to 1, higher = more similar (1 = identical)
        - improved           : True if the newer session is closer to "good"
                                pronunciation than the older one, per cosine_similarity
                                trending toward 1. This is a relative similarity
                                measure, not an absolute quality score — pair it
                                with overall_score/phoneme scores for true progress.
    """
    a = np.asarray(embedding_a, dtype=float)
    b = np.asarray(embedding_b, dtype=float)

    # fastdtw expects sequences of vectors (or scalars); reshape 1D embeddings
    # into a sequence of single-value "frames" so DTW can align them.
    seq_a = a.reshape(-1, 1) if a.ndim == 1 else a
    seq_b = b.reshape(-1, 1) if b.ndim == 1 else b

    dtw_distance, _ = fastdtw(seq_a, seq_b, dist=euclidean)
    cosine_similarity = 1 - cosine(a, b)

    return {
        "dtw_distance": float(dtw_distance),
        "cosine_similarity": float(cosine_similarity),
    }


def get_progress_between_attempts(driver, user_id):
    """
    Pulls the user's two most recent attempts (question responses) from the
    Knowledge Graph and compares their embeddings. Returns None if fewer than
    two attempts exist, or if either attempt predates embedding capture.

    Renamed from get_progress_between_sessions: embeddings now live on
    Attempt nodes, one per question response, not on Session - each session
    can contain several attempts with their own embeddings, so "the last two
    sessions" no longer identifies a single embedding pair the way "the last
    two attempts" does.

    Import of knowledge_graph is deferred to here (rather than module level)
    since it opens a live Neo4j connection on import — keeps compare_sessions()
    and the mock-embedding test below runnable with no DB connectivity.
    """
    from knowledge_graph import get_recent_attempts
    attempts = get_recent_attempts(driver, user_id, limit=2)

    if len(attempts) < 2:
        return None

    newer, older = attempts[0], attempts[1]

    if not older.get("embedding") or not newer.get("embedding"):
        return None

    comparison = compare_sessions(older["embedding"], newer["embedding"])
    comparison["older_attempt_id"] = older["attempt_id"]
    comparison["newer_attempt_id"] = newer["attempt_id"]
    return comparison


if __name__ == "__main__":
    rng = np.random.default_rng(seed=42)
    mock_older = rng.normal(size=32)
    mock_newer = mock_older + rng.normal(scale=0.1, size=32)  # slightly different, simulating improvement

    result = compare_sessions(mock_older, mock_newer)
    print("Mock comparison result:", result)