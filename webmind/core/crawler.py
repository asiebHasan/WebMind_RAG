import ipaddress
import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
]


def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    if not parsed.netloc:
        return False
    # Block localhost variants
    hostname = parsed.hostname or ""
    if hostname in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        return False
    # Block private IPs
    try:
        ip = ipaddress.ip_address(hostname)
        for net in BLOCKED_NETWORKS:
            if ip in net:
                return False
    except ValueError:
        # Not an IP address, that's fine (it's a domain)
        pass
    return True


def normalize_url(url: str, base_url: str) -> str | None:
    url = urljoin(base_url, url)
    # Keep query params for dedup but strip fragments
    url = url.split("#")[0].rstrip("/")
    if not is_safe_url(url):
        return None
    return url


async def crawl(
    seed_url: str,
    max_depth: int = 3,
    max_pages: int = 50,
) -> list[dict]:
    if not is_safe_url(seed_url):
        raise ValueError(f"URL not allowed: {seed_url}")

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
