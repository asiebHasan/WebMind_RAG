from langchain_text_splitters import RecursiveCharacterTextSplitter

from webmind.core.config import settings


def chunk_text(text: str, metadata: dict | None = None) -> list[dict]:
    """Split text into chunks. Returns list of dicts with 'text' and 'metadata'."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)
    result = []
    for i, chunk in enumerate(chunks):
        result.append({
            "text": chunk,
            "metadata": {
                **(metadata or {}),
                "chunk_index": i,
                "total_chunks": len(chunks),
            },
        })
    return result
