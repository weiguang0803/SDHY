"""
师道汉韵 · 管理后台 API 子包 (Admin API Package)
将原单体 538 行 admin.py 模块化拆分，保持所有历史 API 路径 100% 向后兼容。
"""

from fastapi import APIRouter

from backend.api.admin.auth import router as auth_router
from backend.api.admin.dashboard import router as dashboard_router
from backend.api.admin.users import router as users_router
from backend.api.admin.conversations import router as conversations_router
from backend.api.admin.system import router as system_router
from backend.api.admin.analytics import router as analytics_router
from backend.api.admin.observability import router as observability_router
from backend.api.admin.diagnosis import router as diagnosis_router
from backend.api.admin.growth import router as growth_router

router = APIRouter(prefix="/api/admin", tags=["admin"])

# 挂载鉴权与控制台子路由
router.include_router(auth_router)
router.include_router(dashboard_router)

# 挂载用户、会话与系统管理子路由
router.include_router(users_router)
router.include_router(conversations_router)
router.include_router(system_router)

# 挂载规划新增四大核心模块子路由（首期预置）
router.include_router(analytics_router)
router.include_router(observability_router)
router.include_router(diagnosis_router)
router.include_router(growth_router)
