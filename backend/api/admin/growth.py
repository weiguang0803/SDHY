from typing import Literal
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.user import User
from backend.api.deps import get_current_admin
from backend.services.growth_service import get_growth_overview, get_weekly_heatmap

router = APIRouter(prefix="/growth", tags=["admin-growth"])


@router.get("/overview")
async def growth_overview(
    days: Literal["7", "30", "90"] = "30",
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    return await get_growth_overview(db, int(days))


@router.get("/weekly-heatmap")
async def weekly_heatmap(
    week_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    return await get_weekly_heatmap(db, week_date)

@router.get("/ping")
async def growth_ping(
    current_admin: User = Depends(get_current_admin)
):
    """教学增长分析路由探针"""
    return {"status": "ok", "module": "growth_analytics", "phase": 4}
