from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey
from backend.database.connection import Base
import uuid
import datetime

class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    word = Column(String(100), nullable=False, index=True)
    pinyin = Column(String(100), nullable=True)
    category = Column(String(50), default="词汇")  # 词汇, 语法, 发音, 汉字, 对话, 文化, HSK
    hsk_level = Column(String(20), default="初学者")  # 初学者, HSK1-6
    tags = Column(JSON, default=list)

    # 三大独立内容模块 (JSON存储)
    # text_content: { explanation, textbook_examples: [], daily_examples: [], translation, topic_reading }
    text_content = Column(JSON, nullable=True)
    # image_content: { url, prompt, source_type: 'upload'|'ai_generated' }
    image_content = Column(JSON, nullable=True)
    # video_content: { url, task_id, script, duration, source_type: 'upload'|'ai_generated' }
    video_content = Column(JSON, nullable=True)

    # 状态与权限
    # status: 'draft' (草稿), 'pending_review' (待审核), 'approved' (已入库), 'rejected' (已驳回)
    status = Column(String(20), default="draft", index=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    updated_by = Column(String, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
