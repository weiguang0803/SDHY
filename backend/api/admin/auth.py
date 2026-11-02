from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from backend.database.connection import get_db
from backend.models.user import User
from backend.config import settings
from backend.services.user_service import (
    get_password_hash, verify_password, create_access_token
)

router = APIRouter()

class AdminRegisterReq(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None
    secret_key: str

class AdminLoginReq(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register_admin(req: AdminRegisterReq, db: AsyncSession = Depends(get_db)):
    """管理员注册接口（需提供 ADMIN_SECRET_KEY）"""
    if req.secret_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_admin = User(
        username=req.username,
        password_hash=get_password_hash(req.password),
        display_name=req.display_name or req.username,
        role="admin"
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)
    
    token = create_access_token({"sub": new_admin.id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login_admin(req: AdminLoginReq, db: AsyncSession = Depends(get_db)):
    """管理员登录接口"""
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an admin user")
    
    if user.is_active is False:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}
