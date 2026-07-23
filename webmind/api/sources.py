from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from webmind.core.retriever import delete_url, list_all_urls

router = APIRouter(prefix="/sources", tags=["sources"])


class SourceItem(BaseModel):
    url: str


class SourcesResponse(BaseModel):
    sources: list[SourceItem]


class DeleteResponse(BaseModel):
    message: str


@router.get("", response_model=SourcesResponse)
async def get_sources():
    urls = list_all_urls()
    return SourcesResponse(sources=[SourceItem(url=u) for u in urls])


@router.delete("/{url_id:path}", response_model=DeleteResponse)
async def remove_source(url_id: str):
    from urllib.parse import unquote
    url_id = unquote(url_id)
    all_urls = list_all_urls()
    matched = [u for u in all_urls if u == url_id]
    if not matched:
        raise HTTPException(status_code=404, detail="URL not found")
    for u in matched:
        delete_url(u)
    return DeleteResponse(message=f"Deleted {len(matched)} collection(s)")
