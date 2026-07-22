import asyncio
import functools
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from webmind.core.chunker import chunk_text
from webmind.core.crawler import crawl
from webmind.core.embedder import embed_texts
from webmind.core.retriever import store_chunks

router = APIRouter(prefix="/ingest", tags=["ingest"])

_jobs: dict[str, dict] = {}


class IngestRequest(BaseModel):
    url: HttpUrl
    max_depth: int = 3
    max_pages: int = 50


class IngestResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    url: str
    pages_crawled: int = 0
    chunks_stored: int = 0
    error: str | None = None


async def _run_ingest(job_id: str, url: str, max_depth: int, max_pages: int):
    _jobs[job_id]["status"] = "running"
    loop = asyncio.get_running_loop()
    try:
        pages = await crawl(url, max_depth=max_depth, max_pages=max_pages)
        _jobs[job_id]["pages_crawled"] = len(pages)

        all_chunks = []
        all_embeddings = []

        for page in pages:
            chunks = chunk_text(page["text"], metadata={"title": page["title"], "url": page["url"]})
            if chunks:
                embeddings = await loop.run_in_executor(None, functools.partial(embed_texts, [c["text"] for c in chunks]))
                await loop.run_in_executor(None, functools.partial(store_chunks, page["url"], chunks, embeddings))
                all_chunks.extend(chunks)
                all_embeddings.extend(embeddings)

        _jobs[job_id]["chunks_stored"] = len(all_chunks)
        _jobs[job_id]["status"] = "completed"
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)


@router.post("", response_model=IngestResponse)
async def start_ingest(req: IngestRequest):
    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {"status": "pending", "url": str(req.url), "pages_crawled": 0, "chunks_stored": 0}
    asyncio.create_task(_run_ingest(job_id, str(req.url), req.max_depth, req.max_pages))
    return IngestResponse(job_id=job_id, status="pending", message=f"Crawl started for {req.url}")


@router.get("/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatus(job_id=job_id, **job)
