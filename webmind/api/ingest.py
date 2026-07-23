import asyncio
import functools
import logging
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from webmind.core.chunker import chunk_text
from webmind.core.crawler import crawl, is_safe_url
from webmind.core.embedder import embed_texts
from webmind.core.retriever import store_chunks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingest"])

_jobs: dict[str, dict] = {}
_tasks: set[asyncio.Task] = set()
MAX_CONCURRENT_JOBS = 3


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

        for page in pages:
            chunks = chunk_text(page["text"], metadata={"title": page["title"], "url": page["url"]})
            if chunks:
                embeddings = await loop.run_in_executor(None, functools.partial(embed_texts, [c["text"] for c in chunks]))
                await loop.run_in_executor(None, functools.partial(store_chunks, page["url"], chunks, embeddings))
                all_chunks.extend(chunks)

        _jobs[job_id]["chunks_stored"] = len(all_chunks)
        _jobs[job_id]["status"] = "completed"
    except Exception as e:
        logger.exception("Ingest job %s failed", job_id)
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)


@router.post("", response_model=IngestResponse)
async def start_ingest(req: IngestRequest):
    if not is_safe_url(str(req.url)):
        raise HTTPException(status_code=400, detail="URL not allowed (SSRF protection). Cannot crawl localhost, private IPs, or non-HTTP schemes.")

    running = sum(1 for j in _jobs.values() if j["status"] in ("pending", "running"))
    if running >= MAX_CONCURRENT_JOBS:
        raise HTTPException(status_code=429, detail=f"Too many active jobs ({running}/{MAX_CONCURRENT_JOBS}). Wait for one to finish.")

    job_id = uuid.uuid4().hex[:12]
    _jobs[job_id] = {"status": "pending", "url": str(req.url), "pages_crawled": 0, "chunks_stored": 0}
    task = asyncio.create_task(_run_ingest(job_id, str(req.url), req.max_depth, req.max_pages))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)
    return IngestResponse(job_id=job_id, status="pending", message=f"Crawl started for {req.url}")


@router.get("/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatus(job_id=job_id, **job)
