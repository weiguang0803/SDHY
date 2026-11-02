from backend.agents.state import AgentState
from backend.database.connection import async_session_factory
from backend.services.knowledge_service import search_approved_knowledge
import datetime

async def knowledge_agent(state: AgentState):
    """
    教学知识库检索与路由智能体 (Knowledge RAG Agent)
    优先检索已审核入库 (approved) 的标准化教学知识词条。
    如果命中，锁定权威释义、教材例句与本地手绘简笔画/微课视频资源。
    """
    start_event = {
        "agent": "knowledge_agent",
        "status": "start",
        "message": "正在检索官方教学知识管理库（优先匹配标准词条与多模态教具）...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]

    user_input = state.get("user_input", "")
    intent = state.get("intent", {})
    knowledge_points = intent.get("knowledge_points", [])
    target_words = intent.get("target_chinese_words", [])

    knowledge_result = {
        "hit": False,
        "entries": [],
        "primary_entry": None,
        "has_local_media": False,
        "prompt_context": ""
    }

    try:
        async with async_session_factory() as db:
            knowledge_result = await search_approved_knowledge(
                user_input=user_input,
                knowledge_points=knowledge_points,
                target_words=target_words,
                category=None,
                db=db,
                limit=3
            )
    except Exception as e:
        # 异常时保底不阻断主流程
        pass

    if knowledge_result.get("hit"):
        p_entry = knowledge_result.get("primary_entry", {})
        word_name = p_entry.get("word", "")
        score = p_entry.get("score", 1.0)
        has_img = p_entry.get("has_local_image", False)
        has_vid = p_entry.get("has_local_video", False)
        
        media_badges = []
        if has_img: media_badges.append("🎨简笔画")
        if has_vid: media_badges.append("🎬微课短视频")
        media_desc = f" ｜ 附带资产：{'+'.join(media_badges)}" if media_badges else ""

        complete_event = {
            "agent": "knowledge_agent",
            "status": "complete",
            "message": f"📚 知识库精准命中：【{word_name}】(置信度: {score}){media_desc}，优先调用权威教学释义",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    else:
        complete_event = {
            "agent": "knowledge_agent",
            "status": "complete",
            "message": "📖 知识库未包含特定词条，平滑切换至通用智能教学推理模式",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    events.append(complete_event)
    return {
        "knowledge_context": knowledge_result,
        "agent_events": events
    }
