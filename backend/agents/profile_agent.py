from backend.agents.state import AgentState
from backend.database.connection import async_session_factory
from backend.services.user_service import get_user_by_id
import datetime

async def profile_agent(state: AgentState):
    start_event = {
        "agent": "profile_agent",
        "status": "start",
        "message": "Matching user profile...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]
    profile = {"level": "Beginner", "native_lang": "English", "display_name": "Learner"}
    try:
        async with async_session_factory() as db:
            user = await get_user_by_id(db, state["user_id"])
            if user:
                profile = {
                    "level": user.chinese_level or "Beginner",
                    "native_lang": user.native_language or "English",
                    "display_name": user.display_name or user.username,
                    "learning_goals": user.learning_goals or [],
                    "profile_summary": user.profile_summary or ""
                }
    except Exception:
        pass
    complete_event = {
        "agent": "profile_agent",
        "status": "complete",
        "message": f"{profile['level']} | {profile['native_lang']}",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {"user_profile": profile, "agent_events": events}
