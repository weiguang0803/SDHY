from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt
from typing import Optional

from backend.database.connection import get_db
from backend.models.user import User
from backend.config import settings

async def verify_admin(authorization: str, db: AsyncSession) -> User:
    """
    通用管理员鉴权逻辑，校验 Bearer Token 并确保用户存在且角色为 admin。
    保持与历史调用签名兼容。
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        token = parts[1]
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token decode error: {str(e)}")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin role required")
    
    if user.is_active is False:
        raise HTTPException(status_code=403, detail="Forbidden: Admin account is inactive")

    return user

async def get_current_admin(
    authorization: str = Header(..., description="Bearer JWT token"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI 依赖注入项：获取当前登录的管理员 User 对象。
    用法：current_admin: User = Depends(get_current_admin)
    """
    return await verify_admin(authorization, db)
