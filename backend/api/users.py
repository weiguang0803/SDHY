from fastapi import APIRouter, Depends, HTTPException, Header
from backend.database.connection import get_db
from backend.models.user import User
from backend.services.user_service import (
    get_user_by_username, get_password_hash, create_access_token,
    verify_password, get_user_from_token
)
from backend.services.system_service import get_system_setting
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/users", tags=["users"])

class UserRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = ""
    display_name: str = ""
    native_language: str = "English"
    chinese_level: str = "Beginner"

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    native_language: Optional[str] = None
    chinese_level: Optional[str] = None
    learning_goals: Optional[list] = None

@router.get("/public-config")
async def get_public_config(db: AsyncSession = Depends(get_db)):
    allow_reg_str = await get_system_setting(db, "allow_registration", "true")
    return {"allow_registration": allow_reg_str.lower() == "true"}

@router.post("/register")
async def register(user: UserRegister, db: AsyncSession = Depends(get_db)):
    allow_reg_str = await get_system_setting(db, "allow_registration", "true")
    if allow_reg_str.lower() != "true":
        raise HTTPException(status_code=403, detail="系统目前已关闭新用户注册，请联系管理员")

    db_user = await get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    user_email = user.email.strip() if user.email else f"{user.username}@gmail.com"
    new_user = User(
        username=user.username,
        email=user_email,
        password_hash=hashed_password,
        display_name=user.display_name or user.username,
        native_language=user.native_language,
        chinese_level=user.chinese_level
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.id, "username": new_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "display_name": new_user.display_name,
            "native_language": new_user.native_language,
            "chinese_level": new_user.chinese_level
        }
    }

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_username(db, user.username)
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if db_user.is_active is False:
        raise HTTPException(status_code=403, detail="该账号已被暂停登录，请联系管理员")
    if db_user.role in ["admin", "reviewer", "collector"]:
        raise HTTPException(
            status_code=403,
            detail=f"该账号为工作管理账号（{db_user.role}），请前往管理后台或知识管理平台登录"
        )
    access_token = create_access_token(data={"sub": db_user.id, "username": db_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email or f"{db_user.username}@gmail.com",
            "display_name": db_user.display_name,
            "native_language": db_user.native_language,
            "chinese_level": db_user.chinese_level
        }
    }

@router.get("/profile")
async def get_profile(authorization: str = Header(...), db: AsyncSession = Depends(get_db)):
    user = await get_user_from_token(authorization, db)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or f"{user.username}@gmail.com",
        "display_name": user.display_name,
        "native_language": user.native_language,
        "chinese_level": user.chinese_level,
        "learning_goals": user.learning_goals or [],
        "profile_summary": user.profile_summary or "",
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.put("/profile")
async def update_profile(
    update: UserProfileUpdate,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_from_token(authorization, db)
    if update.display_name is not None:
        user.display_name = update.display_name
    if update.email is not None:
        user.email = update.email
    if update.native_language is not None:
        user.native_language = update.native_language
    if update.chinese_level is not None:
        user.chinese_level = update.chinese_level
    if update.learning_goals is not None:
        user.learning_goals = update.learning_goals
    await db.commit()
    return {"message": "Profile updated"}
