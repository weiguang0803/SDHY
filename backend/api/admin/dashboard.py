from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.models.user import User
from backend.api.deps import get_current_admin
from backend.services.admin_service import (
    get_dashboard_stats,
    get_message_trend,
    get_language_distribution,
    get_intent_distribution
)

router = APIRouter(prefix="/dashboard")

@router.get("/stats")
async def dashboard_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """控制台核心概览指标统计"""
    return await get_dashboard_stats(db)

@router.get("/message-trend")
async def message_trend(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """控制台最近 7 天消息吞吐量趋势"""
    return await get_message_trend(db)

@router.get("/language-distribution")
async def language_distribution(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """学员母语分布统计（已排除非学员账号）"""
    return await get_language_distribution(db)

@router.get("/intent-distribution")
async def intent_distribution(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """学员提问意图分布统计"""
    return await get_intent_distribution(db)
