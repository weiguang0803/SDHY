import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from backend.database.connection import get_db
from backend.services.user_service import get_user_from_token
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.conversation import Conversation
from backend.models.message import Message
from sqlalchemy.future import select
from sqlalchemy import desc, or_
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ConversationUpdate(BaseModel):
    title: str

@router.post("")
async def create_conversation(
    body: ConversationCreate = ConversationCreate(),
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv = Conversation(user_id=user.id, title=body.title)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return {
        "id": conv.id,
        "title": conv.title,
        "is_favorite": bool(conv.is_favorite),
        "created_at": (conv.created_at.isoformat() + "Z") if conv.created_at else None,
        "updated_at": (conv.updated_at.isoformat() + "Z") if conv.updated_at else None
    }

@router.get("")
async def list_conversations(
    favorite: Optional[bool] = None,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    query = select(Conversation).where(
        Conversation.user_id == user.id,
        or_(Conversation.is_deleted.is_(False), Conversation.is_deleted.is_(None))
    )
    if favorite is not None:
        query = query.where(Conversation.is_favorite == favorite)
    query = query.order_by(desc(Conversation.updated_at))
    
    result = await db.execute(query)
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "is_favorite": bool(c.is_favorite),
            "created_at": (c.created_at.isoformat() + "Z") if c.created_at else None,
            "updated_at": (c.updated_at.isoformat() + "Z") if c.updated_at else None
        }
        for c in convs
    ]

@router.put("/{conversation_id}/favorite")
async def toggle_conversation_favorite(
    conversation_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv.is_favorite = not bool(conv.is_favorite)
    await db.commit()
    await db.refresh(conv)
    return {"id": conv.id, "is_favorite": bool(conv.is_favorite)}

@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "agent_process": m.agent_process,
            "intent_type": m.intent_type,
            "multimodal": getattr(m, "multimodal", None),
            "is_favorite": bool(getattr(m, "is_favorite", False)),
            "created_at": (m.created_at.isoformat() + "Z") if m.created_at else None
        }
        for m in messages
    ]

@router.put("/{conversation_id}/messages/{message_id}/favorite")
async def toggle_message_favorite(
    conversation_id: str,
    message_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    msg_result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.conversation_id == conversation_id
        )
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.is_favorite = not bool(msg.is_favorite)
    # If a message is favorited, also mark conversation as favorited
    if msg.is_favorite:
        conv.is_favorite = True
    else:
        # Check if conversation still has any favorited messages
        remaining_favs = await db.execute(
            select(Message.id).where(
                Message.conversation_id == conversation_id,
                Message.id != message_id,
                Message.is_favorite == True
            )
        )
        if not remaining_favs.scalars().first():
            # If no other messages are favorited, sync conversation favorite status
            conv.is_favorite = False

    await db.commit()
    await db.refresh(msg)
    await db.refresh(conv)
    return {
        "id": msg.id,
        "is_favorite": bool(msg.is_favorite),
        "conversation_id": conv.id,
        "conversation_is_favorite": bool(conv.is_favorite)
    }

@router.delete("/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: str,
    message_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    msg_result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.conversation_id == conversation_id
        )
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    await db.delete(msg)
    await db.commit()
    return {"message": "Message deleted successfully", "id": message_id}

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Soft delete: mark as deleted with timestamp, preserving all messages in DB for audit
    conv.is_deleted = True
    conv.deleted_at = datetime.datetime.utcnow()
    await db.commit()
    return {"message": "Conversation marked as deleted"}

@router.put("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = body.title
    await db.commit()
    return {"message": "Updated"}
