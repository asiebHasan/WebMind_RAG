# WebMind RAG

Private Knowledge Base Builder — ingest any website, chunk it, embed it, and query it with RAG.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5+-FFB900?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVIN0wxMiAyeiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==&logoColor=white)

## What is WebMind?

WebMind is a full-stack RAG (Retrieval-Augmented Generation) application that lets you build a private knowledge base from any website. Paste a URL, and WebMind will:

1. **Crawl** the site recursively, following all internal links
2. **Chunk** the content into searchable segments
3. **Embed** each chunk into vector space using local ML models
4. **Store** everything in ChromaDB for fast similarity search
5. **Answer** your questions with source citations from the ingested content

Unlike ChatGPT or Claude, WebMind persists knowledge across sessions — ingest once, query forever.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Ingest  │  │   Chat   │  │ Sources  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                     │
│       └──────────────┼──────────────┘                     │
│                      │                                    │
│              Fetch API calls                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   Backend (FastAPI)                       │
│                                                          │
│  /api/ingest ──► Crawler ──► Chunker ──► Embedder       │
│                     │              │           │          │
│                     │              │     ChromaDB         │
│                     │              │     (vectors)        │
│                     │                                      │
│  /api/ask ──────► Query Embedder ──► ChromaDB Search     │
│       │                              (cosine similarity)  │
│       │                                      │            │
│       └────────────► OpenRouter LLM ◄────────┘           │
│                    (Gemini 2.5 Flash)                     │
│                         │                                 │
│                    Answer + Sources                       │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Web Framework** | FastAPI | Async API server with auto-docs |
| **Crawler** | httpx + BeautifulSoup4 | Async recursive website crawling |
| **Chunking** | langchain_text_splitters | RecursiveCharacterTextSplitter |
| **Embeddings** | sentence-transformers | all-MiniLM-L6-v2 (384-dim, local) |
| **Vector DB** | ChromaDB | Persistent vector storage with cosine similarity |
| **LLM** | OpenRouter | Gemini 2.5 Flash via OpenAI-compatible API |
| **Frontend** | React 18 + Vite | SPA with Tailwind CSS + Framer Motion |
| **Storage** | ChromaDB on disk | Per-URL collection isolation |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend build)
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Installation

```bash
# Clone the repo
git clone https://github.com/asiebHasan/WebMind_RAG.git
cd WebMind_RAG

# Install Python dependencies
pip install -r requirements.txt

# Set your API key
echo "OPENROUTER_API_KEY=sk-or-v1-your-key-here" > .env

# Build the frontend
cd frontend && npm install && npm run build && cd ..

# Start the server
python run.py
```

Open **http://localhost:8000** in your browser.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | Your OpenRouter API key |
| `LLM_MODEL` | No | `google/gemini-2.5-flash` | LLM model to use |
| `CHUNK_SIZE` | No | `512` | Text chunk size in characters |
| `CHUNK_OVERLAP` | No | `64` | Overlap between chunks |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `CHROMA_PERSIST_DIR` | No | `./webmind/chroma_store` | ChromaDB storage path |

## API Reference

### Ingest a Website

```bash
POST /api/ingest
```

**Request:**
```json
{
  "url": "https://example.com",
  "max_depth": 3,
  "max_pages": 50
}
```

**Response:**
```json
{
  "job_id": "a3f2c1b4e5d6",
  "status": "pending",
  "message": "Crawl started for https://example.com"
}
```

### Check Job Status

```bash
GET /api/ingest/{job_id}
```

**Response:**
```json
{
  "job_id": "a3f2c1b4e5d6",
  "status": "completed",
  "url": "https://example.com",
  "pages_crawled": 12,
  "chunks_stored": 47,
  "error": null
}
```

### Ask a Question

```bash
POST /api/ask
```

**Request:**
```json
{
  "question": "What are the main topics covered?",
  "urls": ["https://example.com"],
  "top_k": 10
}
```

**Response:**
```json
{
  "answer": "The main topics covered are...",
  "sources": [
    {
      "url": "https://example.com/docs",
      "chunk": "Relevant text snippet...",
      "score": 0.87
    }
  ]
}
```

### List Sources

```bash
GET /api/sources
```

### Delete a Source

```bash
DELETE /api/sources/{url}
```

## Features

### Ingestion
- Deep recursive crawling with configurable depth and page limits
- Respects domain boundaries (won't cross to external sites)
- SSRF protection (blocks localhost, private IPs, cloud metadata)
- Async processing with job status tracking
- Concurrent job limit (max 3 simultaneous crawls)

### RAG Query
- Semantic search using cosine similarity
- Multi-source retrieval with relevance scores
- Source citations with clickable URLs
- Handles summarization and synthesis across sources

### Chat
- Persistent chat history (localStorage)
- Multi-session support with auto-titling
- Real-time message streaming
- Source reference expansion

### Frontend
- Clean, minimal dark/light theme
- Responsive layout
- Smooth animations (Framer Motion)
- Session management with sidebar

## Project Structure

```
WebMind_RAG/
├── webmind/
│   ├── api/
│   │   ├── ingest.py      # /api/ingest endpoints
│   │   ├── query.py       # /api/ask endpoint
│   │   └── sources.py     # /api/sources endpoints
│   ├── core/
│   │   ├── chunker.py     # Text splitting
│   │   ├── config.py      # Settings management
│   │   ├── crawler.py     # Async web crawler
│   │   ├── embedder.py    # Sentence-transformers wrapper
│   │   └── retriever.py   # ChromaDB operations
│   ├── llm/
│   │   └── openrouter.py  # LLM integration
│   └── main.py            # FastAPI app setup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IngestPanel.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   └── SourcesPanel.jsx
│   │   ├── api.js         # API client
│   │   ├── chatStore.js   # localStorage persistence
│   │   └── App.jsx
│   └── dist/              # Production build
├── .env                   # Environment variables
├── requirements.txt       # Python dependencies
├── run.py                 # Development server
├── Dockerfile
└── docker-compose.yml
```

## Docker Deployment

```bash
docker-compose up --build
```

The app will be available at `http://localhost:8000`.

## Development

```bash
# Terminal 1: Backend
python run.py

# Terminal 2: Frontend (hot reload)
cd frontend && npm run dev
```

Frontend dev server runs on `http://localhost:5173` with API proxy to `:8000`.

## How It Works

1. **Crawling**: The async crawler starts from a seed URL, follows internal links up to `max_depth`, and extracts text content from HTML pages.

2. **Chunking**: Each page's text is split into overlapping chunks (default 512 chars, 64 overlap) using LangChain's RecursiveCharacterTextSplitter.

3. **Embedding**: Each chunk is converted to a 384-dimensional vector using the all-MiniLM-L6-v2 model running locally.

4. **Storage**: Vectors are stored in ChromaDB with per-URL collection isolation, enabling efficient similarity search.

5. **Querying**: When you ask a question, it's embedded and compared against all stored vectors using cosine similarity. The top-K most relevant chunks are retrieved and sent to the LLM as context.

6. **Generation**: The LLM (Gemini 2.5 Flash) synthesizes an answer from the retrieved chunks, citing source URLs.

## License

MIT
