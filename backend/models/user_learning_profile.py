from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from backend.database.connection import Base
import datetime

class UserLearningProfile(Base):
    """学员持久化认知档案（长期持久记忆 L3）"""
    __tablename__ = "user_learning_profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    weak_points = Column(JSON, default=list)        # 薄弱语法点/易错字 [{"point": "把字句", "error_count": 2, "last_wrong_at": "..."}]
    mastered_points = Column(JSON, default=list)    # 已掌握知识点 ["打招呼", "HSK1词汇"]
    preference_style = Column(String(50), default="comparison") # 学习偏好风格：对比法、情境交际法等
    recent_topics = Column(JSON, default=list)      # 近期学习的5个主题
    radar_scores = Column(JSON, default=lambda: {   # 五维能力评分
        "listening": 70,
        "speaking": 65,
        "reading": 75,
        "vocab": 68,
        "grammar": 60
    })
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
