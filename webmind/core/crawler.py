import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


def is_valid_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def normalize_url(url: str, base_url: str) -> str | None:
    url = urljoin(base_url, url)
    url = url.split("#")[0].split("?")[0].rstrip("/")
    if not is_valid_url(url):
        return None
    return url


async def crawl(
    seed_url: str,
    max_depth: int = 3,
    max_pages: int = 50,
) -> list[dict]:
    """Recursively crawl a site starting from seed_url.

    Returns list of dicts: {"url": str, "title": str, "text": str}
    """
    base_domain = urlparse(seed_url).netloc
    visited: set[str] = set()
    results: list[dict] = []
    queue: list[tuple[str, int]] = [(seed_url, 0)]

    async with httpx.AsyncClient(
        timeout=15,
        follow_redirects=True,
        headers={"User-Agent": "WebMind-RAG/1.0"},
    ) as client:
        while queue and len(results) < max_pages:
            url, depth = queue.pop(0)
            if url in visited or depth > max_depth:
                continue
            visited.add(url)

            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    continue
                content_type = resp.headers.get("content-type", "")
                if "text/html" not in content_type:
                    continue
            except httpx.HTTPError:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            title = soup.title.string.strip() if soup.title and soup.title.string else ""

            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            text = re.sub(r"\n{3,}", "\n\n", text)

            if len(text) > 100:
                results.append({"url": url, "title": title, "text": text})

            if depth < max_depth:
                for a_tag in soup.find_all("a", href=True):
                    next_url = normalize_url(a_tag["href"], url)
                    if (
                        next_url
                        and next_url not in visited
                        and urlparse(next_url).netloc == base_domain
                    ):
                        queue.append((next_url, depth + 1))

    return results
