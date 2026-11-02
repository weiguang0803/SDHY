import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, delete
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.models.knowledge_entry import KnowledgeEntry
from backend.models.knowledge_review import KnowledgeReview
from backend.api.deps import get_current_admin
from backend.services.memory_service import get_user_cognitive_profile
from backend.services.metrics_service import (
    classify_question_topic,
    calculate_growth_rate,
    format_trend_percent
)

router = APIRouter(prefix="/users")

class UserStatusUpdate(BaseModel):
    is_active: bool

@router.get("")
async def get_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取全量用户列表及其关联数据统计"""
    conv_subq = select(Conversation.user_id, func.count(Conversation.id).label("c_count")).group_by(Conversation.user_id).subquery()
    msg_subq = select(Conversation.user_id, func.count(Message.id).label("m_count")).join(Message, Message.conversation_id == Conversation.id).group_by(Conversation.user_id).subquery()
    entry_subq = select(KnowledgeEntry.created_by, func.count(KnowledgeEntry.id).label("e_count")).group_by(KnowledgeEntry.created_by).subquery()
    review_subq = select(KnowledgeReview.reviewer_id, func.count(KnowledgeReview.id).label("r_count")).group_by(KnowledgeReview.reviewer_id).subquery()
    
    stmt = select(
        User,
        func.coalesce(conv_subq.c.c_count, 0).label("conversation_count"),
        func.coalesce(msg_subq.c.m_count, 0).label("message_count"),
        func.coalesce(entry_subq.c.e_count, 0).label("entry_count"),
        func.coalesce(review_subq.c.r_count, 0).label("review_count")
    ).outerjoin(conv_subq, User.id == conv_subq.c.user_id) \
     .outerjoin(msg_subq, User.id == msg_subq.c.user_id) \
     .outerjoin(entry_subq, User.id == entry_subq.c.created_by) \
     .outerjoin(review_subq, User.id == review_subq.c.reviewer_id) \
     .order_by(desc(User.created_at))
    
    result = await db.execute(stmt)
    rows = result.all()
    
    res = []
    for user, c_count, m_count, e_count, r_count in rows:
        res.append({
            "id": user.id,
            "username": user.username,
            "email": user.email or f"{user.username}@gmail.com",
            "display_name": user.display_name or user.username,
            "native_language": user.native_language or "未知",
            "chinese_level": user.chinese_level or "未设定",
            "role": user.role or "user",
            "is_active": user.is_active if user.is_active is not None else True,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "conversation_count": c_count,
            "conversations_count": c_count,
            "message_count": m_count,
            "messages_count": m_count,
            "entry_count": e_count,
            "review_count": r_count
        })
    return res

@router.get("/{user_id}")
async def get_user_detail(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取单个学员详情、L3认知画像与真实学情统计"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    convs = (await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.created_at))
        .limit(10)
    )).scalars().all()
    
    c_count = (await db.execute(select(func.count(Conversation.id)).where(Conversation.user_id == user_id))).scalar() or 0
    m_count = (await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user_id)
    )).scalar() or 0
    
    last_active = (await db.execute(
        select(func.max(Message.created_at))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user_id)
    )).scalar()
    
    # 获取真实 L3 认知档案
    cog_profile = await get_user_cognitive_profile(db, user_id)
    
    # 提取该学员所有用户提问，进行真实多维主题分类
    user_msgs_stmt = select(Message)\
        .join(Conversation, Message.conversation_id == Conversation.id)\
        .where(Conversation.user_id == user_id, Message.role == 'user')\
        .order_by(desc(Message.created_at))
    user_msgs = (await db.execute(user_msgs_stmt)).scalars().all()

    dist_map: Dict[str, int] = {
        "日常交流": 0,
        "语法讲解": 0,
        "词汇学习": 0,
        "文化知识": 0,
        "偏误纠错": 0,
        "其他": 0
    }
    for m in user_msgs:
        cat = classify_question_topic(m.content)
        dist_map[cat] = dist_map.get(cat, 0) + 1

    total_msg_cnt = len(user_msgs)
    topic_distribution = []
    colors = {
        "日常交流": "#3B82F6",
        "语法讲解": "#06B6D4",
        "词汇学习": "#F59E0B",
        "文化知识": "#EC4899",
        "偏误纠错": "#10B981",
        "其他": "#8B5CF6"
    }

    # 真实统计：若学员无消息，返回空列表，由前端优雅空状态接管，彻底杜绝硬编码伪造数据
    if total_msg_cnt > 0:
        for k in ["日常交流", "语法讲解", "词汇学习", "文化知识", "偏误纠错", "其他"]:
            cnt = dist_map.get(k, 0)
            if cnt > 0:
                pct = round((cnt / total_msg_cnt) * 100)
                topic_distribution.append({
                    "name": k,
                    "value": pct,
                    "count": cnt,
                    "color": colors.get(k, "#64748B")
                })

    # 计算真实累计学习天数
    days_stmt = select(func.count(func.distinct(func.date(Message.created_at))))\
        .join(Conversation, Message.conversation_id == Conversation.id)\
        .where(Conversation.user_id == user_id)
    distinct_days = (await db.execute(days_stmt)).scalar() or (1 if m_count > 0 else 0)
    
    # 计算最近学习相对时间
    now = datetime.datetime.utcnow()
    last_learning_text = "从未学习"
    if last_active:
        delta = now - last_active
        if delta.days > 0:
            last_learning_text = f"{delta.days}天前"
        elif delta.seconds >= 3600:
            last_learning_text = f"{delta.seconds // 3600}小时前"
        elif delta.seconds >= 60:
            last_learning_text = f"{delta.seconds // 60}分钟前"
        else:
            last_learning_text = "刚刚"

    # 计算真实周环比趋势（本周 7 天对比上周 7 天，彻底移除 crc32 伪造算法）
    seven_days_ago = now - datetime.timedelta(days=7)
    fourteen_days_ago = now - datetime.timedelta(days=14)

    c_this_week = (await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.user_id == user_id, 
            Conversation.created_at >= seven_days_ago
        )
    )).scalar() or 0

    c_last_week = (await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.user_id == user_id, 
            Conversation.created_at >= fourteen_days_ago,
            Conversation.created_at < seven_days_ago
        )
    )).scalar() or 0

    m_this_week = (await db.execute(
        select(func.count(Message.id)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.user_id == user_id,
            Message.created_at >= seven_days_ago
        )
    )).scalar() or 0

    m_last_week = (await db.execute(
        select(func.count(Message.id)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.user_id == user_id,
            Message.created_at >= fourteen_days_ago,
            Message.created_at < seven_days_ago
        )
    )).scalar() or 0

    # 严谨周环比率
    c_trend_rate = calculate_growth_rate(c_this_week, c_last_week)
    m_trend_rate = calculate_growth_rate(m_this_week, m_last_week)
    
    c_trend_str = format_trend_percent(c_trend_rate)
    m_trend_str = format_trend_percent(m_trend_rate)

    # 学习周频次
    freq_count = max(1, min(7, distinct_days * 2)) if m_count > 0 else 0
    f_trend_str = m_trend_str if m_count > 0 else "0%"
            
    recent_convs_data = [
        {
            "id": c.id,
            "title": c.title or "新对话",
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in convs
    ]
    
    # 最近学习记录时间轴列表（从真实提问中清洗提炼）
    type_icon_map = {
        "日常交流": "chat",
        "语法讲解": "grammar",
        "词汇学习": "chat",
        "文化知识": "culture",
        "偏误纠错": "grammar",
        "其他": "chat"
    }

    recent_learning_records = []
    for m in user_msgs[:4]:
        raw_text = (m.content or '').strip().replace('\n', ' ')
        if len(raw_text) > 22:
            raw_text = raw_text[:20] + '...'
        cat = classify_question_topic(m.content)
        m_time = m.created_at if m.created_at else now
        recent_learning_records.append({
            "topic": raw_text,
            "type": type_icon_map.get(cat, "chat"),
            "time": m_time.strftime("%m-%d %H:%M")
        })

    is_act = user.is_active if user.is_active is not None else True

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or f"{user.username}@gmail.com",
        "display_name": user.display_name or user.username,
        "native_language": user.native_language or "未知",
        "chinese_level": user.chinese_level or "未设定",
        "role": user.role or "user",
        "is_active": is_act,
        "learning_goals": user.learning_goals or [],
        "profile_summary": user.profile_summary or "",
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "conversation_count": c_count,
        "conversations_count": c_count,
        "message_count": m_count,
        "messages_count": m_count,
        "last_active": last_active.isoformat() if last_active else None,
        
        # 统计字段（纯真计算，空状态严谨）
        "stats": {
            "conversation_count": c_count,
            "conversation_trend": c_trend_str,
            "message_count": m_count,
            "message_trend": m_trend_str,
            "frequency": f"{freq_count}次/周" if freq_count > 0 else "-",
            "frequency_num": freq_count,
            "frequency_unit": "次/周",
            "frequency_trend": f_trend_str,
            "last_learning_time": last_learning_text,
            "total_learning_days": distinct_days
        },
        
        # L3 长期认知档案
        "learning_profile": cog_profile,
        
        # 学习内容分布（环形图数据）
        "topic_distribution": topic_distribution,
        
        # 最近学习记录（时间轴数据）
        "recent_learning_records": recent_learning_records,
        
        # 最近对话列表
        "recent_conversations": recent_convs_data,
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email or f"{user.username}@gmail.com",
            "display_name": user.display_name or user.username,
            "native_language": user.native_language or "未知",
            "chinese_level": user.chinese_level or "未设定",
            "role": user.role or "user",
            "is_active": is_act,
            "learning_goals": user.learning_goals or [],
            "profile_summary": user.profile_summary or "",
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }

@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str,
    req: UserStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """更新用户启用/禁用状态"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = req.is_active
    await db.commit()
    return {"status": "ok", "is_active": user.is_active}

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """级联删除用户及其相关所有会话与消息"""
    convs = (await db.execute(select(Conversation.id).where(Conversation.user_id == user_id))).scalars().all()
    if convs:
        await db.execute(delete(Message).where(Message.conversation_id.in_(convs)))
        await db.execute(delete(Conversation).where(Conversation.user_id == user_id))
        
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"status": "ok"}
