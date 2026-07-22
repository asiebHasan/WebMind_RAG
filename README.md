# WebMind RAG

Private Knowledge Base Builder — ingest any website, chunk it, embed it, and query it with RAG.

## Stack

- **Backend:** Python, FastAPI, ChromaDB, sentence-transformers, OpenRouter (Gemini 2.5 Flash)
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion
- **Crawler:** httpx (async) + BeautifulSoup4
- **Embeddings:** all-MiniLM-L6-v2 (local, free)

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your OpenRouter API key in .env
echo "OPENROUTER_API_KEY=sk-or-v1-your-key-here" > .env

# 3. Start the server
python run.py
```

Open http://localhost:8000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ingest` | Start crawl + embed pipeline |
| `GET` | `/api/ingest/{job_id}` | Poll job status |
| `POST` | `/api/ask` | RAG query with source citations |
| `GET` | `/api/sources` | List all ingested URLs |
| `DELETE` | `/api/sources/{url_id}` | Remove a source |

## Example

```bash
# Ingest a website
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "max_depth": 2, "max_pages": 10}'

# Ask a question
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this website about?", "top_k": 5}'
```

## Features

- Deep recursive website crawler (respects robots.txt)
- Text chunking with configurable size/overlap
- Local embeddings via sentence-transformers
- ChromaDB vector storage with per-URL isolation
- RAG-powered answers with source citations
- Chat history persistence (localStorage)
- Multi-session chat
- Dark/light theme
- Responsive UI
