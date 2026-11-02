from langchain_openai import ChatOpenAI
from backend.config import settings

def get_llm():
    base_url = settings.DEFAULT_LLM_BASE_URL.strip()
    if base_url.endswith("/chat/completions"):
        base_url = base_url[:-len("/chat/completions")]
    elif base_url.endswith("/chat/completions/"):
        base_url = base_url[:-len("/chat/completions/")]
    
    return ChatOpenAI(
        model=settings.DEFAULT_LLM_MODEL_NAME,
        api_key=settings.DEFAULT_LLM_API_KEY,
        base_url=base_url,
        temperature=0.7
    )
