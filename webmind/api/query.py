import asyncio
import functools
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from webmind.core.embedder import embed_texts
from webmind.core.retriever import query_chunks
from webmind.llm.openrouter import generate_answer

logger = logging.getLogger(__name__)

router = APIRouter(tags=["query"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=5000)
    urls: list[str] | None = None
    top_k: int = Field(default=10, ge=1, le=30)


class SourceItem(BaseModel):
    url: str
    chunk: str
    score: float


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceItem]


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    try:
        loop = asyncio.get_running_loop()
        query_embedding = (await loop.run_in_executor(None, functools.partial(embed_texts, [req.question])))[0]
        results = query_chunks(query_embedding, top_k=req.top_k, urls=req.urls)

        if not results:
            raise HTTPException(status_code=404, detail="No relevant sources found. Ingest some URLs first.")

        answer = await generate_answer(req.question, results)

        sources = [
            SourceItem(url=r["url"], chunk=r["text"], score=r["score"])
            for r in results
        ]
        return AskResponse(answer=answer, sources=sources)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Ask endpoint failed")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")
