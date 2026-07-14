import chromadb

client = chromadb.PersistentClient(path="rag/chroma_db")

collection = client.get_collection("exercise_bank")

results = collection.query(
    query_texts=["memory exercise"],
    n_results=3
)

print(results)
