import os
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.database.connection import get_db
from backend.models.user import User
from backend.config import settings
from backend.api.deps import get_current_admin
from backend.services.system_service import get_system_setting, set_system_setting

router = APIRouter(prefix="/system")

class SystemConfigUpdate(BaseModel):
    allow_registration: bool

@router.get("/config")
async def get_admin_system_config(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取系统运行配置"""
    allow_reg = await get_system_setting(db, "allow_registration", "true")
    return {"allow_registration": allow_reg.lower() == "true"}

@router.put("/config")
async def update_admin_system_config(
    req: SystemConfigUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """更新系统运行配置（如注册开关）"""
    val = "true" if req.allow_registration else "false"
    await set_system_setting(db, "allow_registration", val)
    return {"status": "ok", "allow_registration": req.allow_registration}

@router.get("/info")
async def get_system_info(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取系统底层环境、数据库占用与大模型配置概览"""
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    file_size_mb = 0
    if os.path.exists(db_path):
        file_size_mb = os.path.getsize(db_path) / (1024 * 1024)
        
    masked_key = f"{settings.DEFAULT_LLM_API_KEY[:3]}...{settings.DEFAULT_LLM_API_KEY[-3:]}" if len(settings.DEFAULT_LLM_API_KEY) > 6 else "***"
    
    return {
        "llm_model": settings.DEFAULT_LLM_MODEL_NAME,
        "llm_base_url": settings.DEFAULT_LLM_BASE_URL,
        "llm_api_key_masked": masked_key,
        "database_path": db_path,
        "database_size_mb": round(file_size_mb, 2)
    }
