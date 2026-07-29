import chromadb

client = chromadb.PersistentClient(path="rag/chroma_db")
collection = client.get_collection("exercise_bank")


def query_exercises(query_text, track=None, n_results=3):

    where_filter = {"track": track} if track else None

    results = collection.query(
        query_texts=[query_text],
        n_results=n_results,
        where=where_filter
    )
    return results


if __name__ == "__main__":
    # Example: track-filtered query
    results = query_exercises("memory exercise", track="Cognition", n_results=3)
    print(results)


collection = client.get_collection("exercise_bank")

results = collection.query(
    query_texts=["memory exercise"],
    n_results=3
)

print(results)
