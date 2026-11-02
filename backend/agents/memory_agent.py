from backend.agents.state import AgentState
from backend.database.connection import async_session_factory
from backend.services.memory_service import (
    get_working_memory,
    get_episodic_memory,
    get_user_cognitive_profile,
    get_user_learning_history
)
import datetime

async def memory_agent(state: AgentState):
    """
    分层记忆检索智能体 (Hierarchical Memory Agent)
    分层装配：
    1. L1 短期工作记忆：保留最近无损上下文与例句
    2. L2 情景动态记忆：提取当前会话或历史学习脉络摘要
    3. L3 长期持久画像：沉淀学员薄弱语法偏误、HSK考点掌握度及能力分布
    """
    start_event = {
        "agent": "memory_agent",
        "status": "start",
        "message": "正在检索三层分层记忆（短期上下文、情景动态摘要、持久认知画像）...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]

    working_memory = []
    episodic_memory = {}
    cognitive_profile = {}
    legacy_history = []

    try:
        async with async_session_factory() as db:
            # 1. L1: 短期工作记忆（无损）
            working_memory = await get_working_memory(db, state["conversation_id"], limit=6)
            
            # 2. L2: 情景动态记忆（摘要 + 轨迹）
            episodic_memory = await get_episodic_memory(db, state["conversation_id"], state["user_id"])
            
            # 3. L3: 长期持久认知画像（薄弱点、雷达评分）
            cognitive_profile = await get_user_cognitive_profile(db, state["user_id"])
            
            # 兼容旧逻辑
            legacy_history = await get_user_learning_history(db, state["user_id"], limit=5)
    except Exception as e:
        pass

    # 提炼反馈事件信息
    weak_count = len(cognitive_profile.get("weak_points", []))
    summary_status = "含阶段摘要" if episodic_memory.get("has_summary") else "无损上下文"
    desc_msg = f"🧠 记忆装配完毕：{len(working_memory)}轮对话窗口 ｜ {summary_status} ｜ 追踪{weak_count}项易错语法点"

    complete_event = {
        "agent": "memory_agent",
        "status": "complete",
        "message": desc_msg,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)

    return {
        "short_term_memory": working_memory,
        "episodic_memory": episodic_memory,
        "profile_memory": cognitive_profile,
        "long_term_memory": legacy_history,
        "agent_events": events
    }
