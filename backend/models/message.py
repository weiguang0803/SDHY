from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text, Boolean
from backend.database.connection import Base
import uuid
import datetime

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    agent_process = Column(JSON, default=list)
    intent_type = Column(String, nullable=True)
    knowledge_points = Column(JSON, default=list)
    multimodal = Column(JSON, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
