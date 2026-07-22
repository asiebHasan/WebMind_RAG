from openai import AsyncOpenAI

from webmind.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
    return _client


RAG_PROMPT = """You are a helpful assistant that answers questions based on the provided context.
Always cite the source URL when possible. If the context doesn't contain enough information,
say so honestly.

Context:
{context}

Question: {question}

Answer:"""


async def generate_answer(question: str, sources: list[dict]) -> str:
    if not settings.openrouter_api_key or settings.openrouter_api_key == "your_openrouter_api_key_here":
        raise ValueError("OPENROUTER_API_KEY not set in .env — add your key to use /ask")

    context_parts = []
    for i, s in enumerate(sources, 1):
        context_parts.append(f"[Source {i}: {s['url']}]\n{s['text']}")
    context = "\n\n".join(context_parts)

    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "user", "content": RAG_PROMPT.format(context=context, question=question)},
        ],
        temperature=0.3,
        max_tokens=1024,
    )
    return response.choices[0].message.content
