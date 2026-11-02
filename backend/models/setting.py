from sqlalchemy import Column, String, Text
from backend.database.connection import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
