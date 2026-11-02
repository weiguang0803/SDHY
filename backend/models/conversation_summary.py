from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from backend.database.connection import Base
import uuid
import datetime

class ConversationSummary(Base):
    """会话阶段性摘要（情景动态记忆 L2）"""
    __tablename__ = "conversation_summaries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    summary_text = Column(Text, nullable=False)
    key_knowledge_points = Column(JSON, default=list)  # 提炼的核心知识点
    turn_range = Column(String(50), nullable=True)     # 如 "1-8"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
