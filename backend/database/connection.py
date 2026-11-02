import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.config import settings, DATA_DIR

DATA_DIR.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    from backend.models import (
        User,
        Conversation,
        Message,
        SystemSetting,
        KnowledgeEntry,
        KnowledgeReview,
        ConversationSummary,
        UserLearningProfile,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE messages ADD COLUMN multimodal JSON"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE conversations ADD COLUMN is_deleted BOOLEAN DEFAULT 0"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE conversations ADD COLUMN deleted_at DATETIME"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("UPDATE users SET email = username || '@gmail.com' WHERE email IS NULL OR email = ''"))
            await conn.execute(text("UPDATE users SET is_active = 1 WHERE is_active IS NULL"))
            await conn.execute(text("UPDATE conversations SET is_deleted = 0 WHERE is_deleted IS NULL"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("INSERT OR IGNORE INTO system_settings (key, value) VALUES ('allow_registration', 'true')"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE conversations ADD COLUMN is_favorite BOOLEAN DEFAULT 0"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE messages ADD COLUMN is_favorite BOOLEAN DEFAULT 0"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("UPDATE conversations SET is_favorite = 0 WHERE is_favorite IS NULL"))
            await conn.execute(text("UPDATE messages SET is_favorite = 0 WHERE is_favorite IS NULL"))
        except Exception:
            pass

async def get_db():
    async with async_session_factory() as session:
        yield session
