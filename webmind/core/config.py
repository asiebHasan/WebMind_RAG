from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    llm_model: str = "google/gemini-flash-1.5"
    chunk_size: int = 512
    chunk_overlap: int = 64
    embedding_model: str = "all-MiniLM-L6-v2"
    chroma_persist_dir: str = "./webmind/chroma_store"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
