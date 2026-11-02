from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.user import User
from backend.api.deps import get_current_admin

router = APIRouter(prefix="/diagnosis", tags=["admin-diagnosis"])

@router.get("/ping")
async def diagnosis_ping(
    current_admin: User = Depends(get_current_admin)
):
    """AI 学情研判中心路由探针"""
    return {"status": "ok", "module": "ai_learning_insights", "phase": 3}
