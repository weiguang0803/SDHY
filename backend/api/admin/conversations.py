from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, delete
from typing import Optional

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.api.deps import get_current_admin

router = APIRouter(prefix="/conversations")

@router.get("")
async def get_conversations(
    user_id: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取会话列表（支持按学员筛选）"""
    msg_subq = select(
        Message.conversation_id,
        func.count(Message.id).label("m_count")
    ).group_by(Message.conversation_id).subquery()
    
    stmt = select(
        Conversation,
        User.display_name,
        User.username,
        func.coalesce(msg_subq.c.m_count, 0).label("message_count")
    ).join(User, Conversation.user_id == User.id)\
     .outerjoin(msg_subq, Conversation.id == msg_subq.c.conversation_id)
    
    if user_id:
        stmt = stmt.where(Conversation.user_id == user_id)
        
    stmt = stmt.order_by(desc(Conversation.updated_at))
    
    result = await db.execute(stmt)
    rows = result.all()
    
    res = []
    for conv, display_name, username, m_count in rows:
        name = display_name or username or "未知用户"
        res.append({
            "id": conv.id,
            "user_id": conv.user_id,
            "display_name": name,
            "user_display_name": name,
            "title": conv.title or "新对话",
            "is_deleted": conv.is_deleted if conv.is_deleted is not None else False,
            "deleted_at": (conv.deleted_at.isoformat() + "Z") if conv.deleted_at else None,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
            "message_count": m_count,
            "messages_count": m_count
        })
    return res

@router.get("/{conv_id}/messages")
async def get_conversation_messages(
    conv_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取单条会话全部消息记录，包含完整多智能体推演轴与多模态数据"""
    stmt = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    msgs = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role,
            "content": m.content or "",
            "agent_process": m.agent_process or [],
            "intent_type": m.intent_type or "",
            "knowledge_points": m.knowledge_points or [],
            "multimodal": m.multimodal or {},
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in msgs
    ]

@router.delete("/{conv_id}")
async def delete_conversation(
    conv_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """级联删除单条会话及其所有消息记录"""
    await db.execute(delete(Message).where(Message.conversation_id == conv_id))
    await db.execute(delete(Conversation).where(Conversation.id == conv_id))
    await db.commit()
    return {"status": "ok"}
