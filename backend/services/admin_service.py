import datetime
from sqlalchemy import func, distinct
from sqlalchemy.future import select
from fastapi import HTTPException
from backend.models.user import User
from backend.models.conversation import Conversation
from backend.models.message import Message
from jose import jwt
from backend.config import settings
from backend.services.metrics_service import get_student_filter
from backend.api.deps import verify_admin

async def get_dashboard_stats(db):
    total_users_stmt = select(func.count(User.id)).where(get_student_filter())
    total_users = (await db.execute(total_users_stmt)).scalar() or 0

    total_convs_stmt = select(func.count(Conversation.id))
    total_conversations = (await db.execute(total_convs_stmt)).scalar() or 0

    total_msgs_stmt = select(func.count(Message.id))
    total_messages = (await db.execute(total_msgs_stmt)).scalar() or 0

    today_str = datetime.datetime.utcnow().date().isoformat()
    
    active_users_stmt = select(func.count(distinct(Conversation.user_id)))\
        .select_from(Message)\
        .join(Conversation, Message.conversation_id == Conversation.id)\
        .where(func.date(Message.created_at) == today_str)
    today_active_users = (await db.execute(active_users_stmt)).scalar() or 0

    today_msgs_stmt = select(func.count(Message.id))\
        .where(func.date(Message.created_at) == today_str)
    today_messages = (await db.execute(today_msgs_stmt)).scalar() or 0

    avg_messages_per_conv = 0
    if total_conversations > 0:
        avg_messages_per_conv = total_messages / total_conversations

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "today_active_users": today_active_users,
        "today_messages": today_messages,
        "avg_messages_per_conv": round(avg_messages_per_conv, 2)
    }

async def get_message_trend(db, days=7):
    today_date = datetime.datetime.utcnow().date()
    cutoff_date = today_date - datetime.timedelta(days=days-1)
    cutoff_str = cutoff_date.isoformat()

    stmt = select(
        func.date(Message.created_at).label("date_str"),
        func.count(Message.id).label("count")
    ).where(
        func.date(Message.created_at) >= cutoff_str
    ).group_by(func.date(Message.created_at)).order_by(func.date(Message.created_at))
    
    result = await db.execute(stmt)
    rows = result.all()
    date_map = {r[0]: r[1] for r in rows if r[0]}
    
    final_trend = []
    for i in range(days):
        d = (cutoff_date + datetime.timedelta(days=i)).isoformat()
        final_trend.append({"date": d, "count": date_map.get(d, 0)})
    
    return final_trend

async def get_language_distribution(db):
    stmt = select(User.native_language, func.count(User.id)).where(get_student_filter()).group_by(User.native_language)
    result = await db.execute(stmt)
    return [{"language": r[0] or "Unknown", "count": r[1]} for r in result.all()]

async def get_intent_distribution(db):
    try:
        stmt = select(Message.intent_type, func.count(Message.id)).where(Message.intent_type.isnot(None)).group_by(Message.intent_type)
        result = await db.execute(stmt)
        return [{"intent": r[0], "count": r[1]} for r in result.all()]
    except Exception:
        return []
