from sqlalchemy import Column, String, DateTime, JSON, Text, Boolean
from backend.database.connection import Base
import uuid
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String)
    native_language = Column(String, default="English")
    chinese_level = Column(String, default="Beginner")
    learning_goals = Column(JSON, default=list)
    profile_summary = Column(Text, default="")
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
