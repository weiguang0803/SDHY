import datetime
from sqlalchemy.future import select
from sqlalchemy import desc, func
from backend.models.message import Message
from backend.models.conversation import Conversation
from backend.models.conversation_summary import ConversationSummary
from backend.models.user_learning_profile import UserLearningProfile
from backend.services.llm_service import get_llm
import json
import logging

logger = logging.getLogger(__name__)

# ==================== L1: 短期工作记忆 (Working Memory) ====================

async def get_working_memory(db, conversation_id: str, limit: int = 6) -> list:
    """
    获取最近对话作为短期工作记忆。
    与旧版截断不同，L1 保留完整文本内容（不截断），确保代词指代和例句语境清晰完整。
    """
    if not conversation_id:
        return []
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .limit(limit)
    )
    messages = result.scalars().all()
    # 转为时间正序
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "intent_type": m.intent_type,
            "knowledge_points": m.knowledge_points or []
        }
        for m in reversed(messages)
    ]


# ==================== L2: 情景动态记忆 (Episodic Memory) ====================

async def get_episodic_memory(db, conversation_id: str, user_id: str) -> dict:
    """
    获取情景动态记忆：
    1. 当前会话的阶段性滚动摘要 (Summary)
    2. 历史核心学习知识点足迹
    """
    episodic = {
        "current_session_summary": "",
        "key_knowledge_trajectory": [],
        "has_summary": False
    }

    if not user_id:
        return episodic

    # 1. 查找当前会话最新的滚动摘要
    if conversation_id:
        sum_result = await db.execute(
            select(ConversationSummary)
            .where(ConversationSummary.conversation_id == conversation_id)
            .order_by(desc(ConversationSummary.created_at))
            .limit(1)
        )
        current_sum = sum_result.scalar_one_or_none()
        if current_sum:
            episodic["current_session_summary"] = current_sum.summary_text
            episodic["has_summary"] = True
            episodic["key_knowledge_points"] = current_sum.key_knowledge_points or []

    # 2. 查找该学员跨会话的历史核心轨迹（近3个摘要或近10条意图知识点）
    hist_sums = (await db.execute(
        select(ConversationSummary)
        .where(ConversationSummary.user_id == user_id)
        .order_by(desc(ConversationSummary.created_at))
        .limit(3)
    )).scalars().all()

    trajectory = []
    for s in hist_sums:
        if s.key_knowledge_points:
            trajectory.extend(s.key_knowledge_points)

    episodic["key_knowledge_trajectory"] = list(set(trajectory))[:8]
    return episodic


async def check_and_generate_rolling_summary(db, conversation_id: str, user_id: str):
    """
    检查消息数，达到阈值（如满 8 轮）且未摘要时，由 LLM 异步压缩提取情景摘要并存库。
    """
    if not conversation_id or not user_id:
        return

    try:
        # 统计当前会话的消息总数
        count_stmt = select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
        total_msgs = (await db.execute(count_stmt)).scalar() or 0

        if total_msgs < 4:
            return  # 消息少于 2 轮完整交互（4条消息）时无需压缩

        # 检查是否已存在近期摘要
        exist_stmt = select(func.count(ConversationSummary.id)).where(
            ConversationSummary.conversation_id == conversation_id
        )
        existing_summaries_count = (await db.execute(exist_stmt)).scalar() or 0

        # 如果已有摘要且消息增量未达 4 条，暂不重复触发
        if existing_summaries_count > 0 and (total_msgs % 4 != 0):
            return

        # 提取需要摘要的对话片段
        msgs_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at).limit(16)
        msgs = (await db.execute(msgs_stmt)).scalars().all()
        if not msgs:
            return

        dialogue_text = "\n".join([f"{m.role}: {m.content[:150]}" for m in msgs])

        llm = get_llm()
        prompt = f"""请针对以下中文教学多轮对话，为学习者提炼一段高度概括的情景动态摘要（100字以内），并提取涉及的核心知识点。

对话片段：
{dialogue_text}

严格输出 JSON 格式：
{{
  "summary": "学员主要探讨了...，重点练习了...，在...方面得到了纠正与强化。",
  "key_knowledge_points": ["知识点1", "知识点2"]
}}

/no_think"""

        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        parsed = json.loads(content.strip())
        summary_text = parsed.get("summary", "")
        kps = parsed.get("key_knowledge_points", [])

        if summary_text:
            new_sum = ConversationSummary(
                conversation_id=conversation_id,
                user_id=user_id,
                summary_text=summary_text,
                key_knowledge_points=kps,
                turn_range=f"1-{total_msgs}"
            )
            db.add(new_sum)
            await db.commit()
            logger.info(f"Generated rolling summary for conversation {conversation_id}")
    except Exception as e:
        logger.warning(f"Failed to generate rolling summary: {e}")


# ==================== L3: 长期持久画像记忆 (Semantic / Profile Memory) ====================

async def get_user_cognitive_profile(db, user_id: str) -> dict:
    """
    获取学员持久化认知档案（薄弱项、易错点统计、掌握知识点、五维能力雷达评分）。
    若不存在则自动初始化默认档案。
    """
    default_profile = {
        "user_id": user_id,
        "weak_points": [],
        "mastered_points": [],
        "preference_style": "对比示范教学",
        "recent_topics": [],
        "radar_scores": {
            "listening": 70,
            "speaking": 65,
            "reading": 75,
            "vocab": 68,
            "grammar": 60
        }
    }

    if not user_id:
        return default_profile

    stmt = select(UserLearningProfile).where(UserLearningProfile.user_id == user_id)
    profile_record = (await db.execute(stmt)).scalar_one_or_none()

    if not profile_record:
        try:
            profile_record = UserLearningProfile(
                user_id=user_id,
                weak_points=[],
                mastered_points=["基础问候", "自我介绍"],
                preference_style="对比示范教学",
                recent_topics=[],
                radar_scores=default_profile["radar_scores"]
            )
            db.add(profile_record)
            await db.commit()
            await db.refresh(profile_record)
        except Exception:
            return default_profile

    return {
        "user_id": profile_record.user_id,
        "weak_points": profile_record.weak_points or [],
        "mastered_points": profile_record.mastered_points or [],
        "preference_style": profile_record.preference_style or "对比示范教学",
        "recent_topics": profile_record.recent_topics or [],
        "radar_scores": profile_record.radar_scores or default_profile["radar_scores"]
    }


async def update_user_learning_evolution(
    db, 
    user_id: str, 
    intent_type: str, 
    knowledge_points: list = None, 
    user_input: str = "",
    validation_passed: bool = True
):
    """
    对话结束后触发学习认知动态演进更新：
    1. 若是纠错 (correction) 意图，自动沉淀/累加薄弱点计数
    2. 若是正常练习或问答且通过验证，积累掌握知识点
    3. 动态更新近期主题列表与五维雷达图得分
    """
    if not user_id:
        return

    try:
        stmt = select(UserLearningProfile).where(UserLearningProfile.user_id == user_id)
        profile = (await db.execute(stmt)).scalar_one_or_none()
        if not profile:
            profile = UserLearningProfile(user_id=user_id)
            db.add(profile)

        weak_list = list(profile.weak_points or [])
        mastered_list = list(profile.mastered_points or [])
        recent_topics = list(profile.recent_topics or [])
        scores = dict(profile.radar_scores or {
            "listening": 70, "speaking": 65, "reading": 75, "vocab": 68, "grammar": 60
        })

        kps = [str(k).strip() for k in (knowledge_points or []) if k]

        # 1. 记录近期主题
        for kp in kps:
            if kp and kp not in recent_topics:
                recent_topics.insert(0, kp)
        profile.recent_topics = recent_topics[:5]

        # 2. 纠错意图处理：累加薄弱项
        if intent_type == "correction":
            for kp in kps:
                found = False
                for item in weak_list:
                    if item.get("point") == kp:
                        item["error_count"] = item.get("error_count", 1) + 1
                        item["last_wrong_at"] = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")
                        found = True
                        break
                if not found:
                    weak_list.append({
                        "point": kp,
                        "error_count": 1,
                        "last_wrong_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")
                    })
            # 扣减一点语法得分，触发专项强化
            scores["grammar"] = max(40, scores.get("grammar", 60) - 1)
        elif validation_passed and kps:
            # 问答/练习顺利完成，强化词汇与语法掌握
            for kp in kps:
                if kp not in mastered_list and len(mastered_list) < 30:
                    mastered_list.append(kp)
            scores["vocab"] = min(98, scores.get("vocab", 68) + 1)
            scores["reading"] = min(98, scores.get("reading", 75) + 1)

        profile.weak_points = weak_list[:10]
        profile.mastered_points = mastered_list
        profile.radar_scores = scores
        profile.updated_at = datetime.datetime.utcnow()

        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to update user learning evolution: {e}")


# ==================== 兼容旧接口 ====================

async def get_recent_messages(db, conversation_id: str, limit: int = 10):
    return await get_working_memory(db, conversation_id, limit=limit)

async def get_user_learning_history(db, user_id: str, limit: int = 5):
    conv_result = await db.execute(
        select(Conversation.id)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.updated_at))
        .limit(limit)
    )
    conv_ids = [row[0] for row in conv_result.all()]
    if not conv_ids:
        return []
    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id.in_(conv_ids), Message.role == "assistant")
        .order_by(desc(Message.created_at))
        .limit(10)
    )
    messages = msg_result.scalars().all()
    return [
        {"intent_type": m.intent_type, "knowledge_points": m.knowledge_points or [], "content_preview": m.content[:100] if m.content else ""}
        for m in messages
    ]
