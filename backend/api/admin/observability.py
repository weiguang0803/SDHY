from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.user import User
from backend.api.deps import get_current_admin

router = APIRouter(prefix="/observability", tags=["admin-observability"])

@router.get("/ping")
async def observability_ping(
    current_admin: User = Depends(get_current_admin)
):
    """智能体观测中心路由探针"""
    return {"status": "ok", "module": "agent_observability", "phase": 2}
