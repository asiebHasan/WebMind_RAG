import hashlib

import chromadb

from webmind.core.config import settings

_client: chromadb.PersistentClient | None = None


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def _collection_name(url: str) -> str:
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:12]
    return f"url_{url_hash}"


def store_chunks(url: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    client = _get_client()
    collection = client.get_or_create_collection(
        name=_collection_name(url),
        metadata={"hnsw:space": "cosine"},
    )
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:8]
    ids = [f"{url_hash}_c{c['metadata']['chunk_index']}" for c in chunks]
    texts = [c["text"] for c in chunks]
    metadatas = []
    for c in chunks:
        m = {k: str(v) for k, v in c["metadata"].items()}
        m["url"] = url
        metadatas.append(m)
    collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)


def query_chunks(query_embedding: list[float], top_k: int = 5, urls: list[str] | None = None) -> list[dict]:
    client = _get_client()

    results_list = []
    collection_names = [c.name for c in client.list_collections()]

    if urls:
        target = [_collection_name(u) for u in urls]
        collection_names = [n for n in collection_names if n in target]

    for name in collection_names:
        try:
            collection = client.get_collection(name)
            res = collection.query(query_embeddings=[query_embedding], n_results=top_k)
            if res["documents"] and res["documents"][0]:
                for i, doc in enumerate(res["documents"][0]):
                    results_list.append({
                        "text": doc,
                        "url": res["metadatas"][0][i].get("url", ""),
                        "score": 1 - res["distances"][0][i] if res["distances"] else 0,
                    })
        except Exception:
            continue

    results_list.sort(key=lambda x: x["score"], reverse=True)
    return results_list[:top_k]


def list_all_urls() -> list[str]:
    client = _get_client()
    urls = set()
    for col in client.list_collections():
        try:
            data = col.get()
            for meta in data["metadatas"]:
                if meta and "url" in meta:
                    urls.add(meta["url"])
        except Exception:
            continue
    return sorted(urls)


def delete_url(url: str) -> None:
    client = _get_client()
    name = _collection_name(url)
    try:
        client.delete_collection(name)
    except ValueError:
        pass
