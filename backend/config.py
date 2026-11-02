import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_FILE = (DATA_DIR / "sdhy.db").as_posix()
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{DEFAULT_DB_FILE}"
ENV_FILE = (BASE_DIR / ".env").as_posix()

UPLOADS_DIR = BASE_DIR / "uploads" / "knowledge"
(UPLOADS_DIR / "images").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "videos").mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    DEFAULT_LLM_API_KEY: str = "sk-default"
    DEFAULT_LLM_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    DEFAULT_LLM_MODEL_NAME: str = "qwen3-max"
    
    # 图片生成模型配置
    IMAGE_MODEL: str = "qwen-image-2.0-pro"
    IMAGE_MODEL_BASE_URL: str = "https://ai.ctaigw.cn/v1/services/aigc/multimodal-generation/generation"
    
    # 视频生成模型配置 (Cdance2.0)
    VIDEO_MODEL: str = "cdance2.0-fast-0611"
    VIDEO_API_KEY: str = ""
    VIDEO_API_URL: str = "https://ai.ctaigw.cn/v1/contents/generations/tasks"

    DATABASE_URL: str = DEFAULT_DATABASE_URL
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # 注册密钥
    ADMIN_SECRET_KEY: str = ""
    KNOWLEDGE_SECRET_KEY: str = ""

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

settings = Settings()
