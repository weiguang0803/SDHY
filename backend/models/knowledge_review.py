from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey
from backend.database.connection import Base
import uuid
import datetime

class KnowledgeReview(Base):
    __tablename__ = "knowledge_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_id = Column(String, ForeignKey("knowledge_entries.id"), nullable=False, index=True)
    applicant_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    # action: 'submit' (提交审核), 'approve' (审核通过), 'reject' (驳回), 'direct_publish' (直接发布)
    action = Column(String(20), nullable=False)
    comment = Column(Text, nullable=True)  # 驳回理由或审核意见
    snapshot = Column(JSON, nullable=True)  # 提交/审核时的词条数据快照

    created_at = Column(DateTime, default=datetime.datetime.now)
