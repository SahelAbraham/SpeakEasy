import chromadb

DB_PATH = "rag/chroma_db"
COLLECTION_NAME = "exercise_bank"


def get_collection():
    """
    Returns the ChromaDB collection.
    Creates it if it doesn't exist.
    """

    client = chromadb.PersistentClient(path=DB_PATH)

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME
    )

    return collection
