import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List, Any

from backend.database.connection import get_db
from backend.config import UPLOADS_DIR
from backend.services.knowledge_service import (
    register_knowledge_user, login_knowledge_user, verify_knowledge_user,
    create_knowledge_entry, update_knowledge_entry, submit_entry_for_review,
    review_knowledge_entry, list_knowledge_entries, get_entry_detail,
    get_audit_trail, get_knowledge_dashboard_stats
)
from backend.services.media_service import (
    generate_entry_text_content, generate_line_art_image,
    submit_cdance_video_task, query_and_save_video_task
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

# ==================== 请求体定义 ====================

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None
    role: str = "collector"  # admin, reviewer, collector
    secret_key: str  # 平台注册校验秘钥 (由 KNOWLEDGE_SECRET_KEY 配置)

class LoginRequest(BaseModel):
    username: str
    password: str

class EntryCreateUpdateRequest(BaseModel):
    word: str
    pinyin: Optional[str] = ""
    category: Optional[str] = "词汇"
    hsk_level: Optional[str] = "初学者"
    tags: Optional[List[str]] = []
    text_content: Optional[dict] = None
    image_content: Optional[dict] = None
    video_content: Optional[dict] = None
    status: Optional[str] = "draft"  # draft, pending_review, approved

class ReviewActionRequest(BaseModel):
    action: str  # approve, reject
    comment: Optional[str] = ""

class AITextGenerateRequest(BaseModel):
    word: str
    category: Optional[str] = "词汇"
    hsk_level: Optional[str] = "初学者"

class AIImageGenerateRequest(BaseModel):
    word: str
    custom_prompt: Optional[str] = None

class AIVideoGenerateRequest(BaseModel):
    word: str
    custom_script: Optional[str] = None

# ==================== 认证与用户接口 ====================

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register_knowledge_user(req.dict(), db)

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_knowledge_user(req.dict(), db)

@router.get("/me")
async def get_me(authorization: str = Header(...), db: AsyncSession = Depends(get_db)):
    user = await verify_knowledge_user(authorization, db)
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name or user.username,
        "role": user.role
    }

# ==================== 词条 CRUD 与流转 ====================

@router.get("/entries")
async def get_entries(
    status: Optional[str] = "all",
    category: Optional[str] = "all",
    hsk_level: Optional[str] = "all",
    keyword: Optional[str] = None,
    scope: Optional[str] = "all",  # mine or all
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db)
    params = {
        "status": status,
        "category": category,
        "hsk_level": hsk_level,
        "keyword": keyword,
        "scope": scope,
        "page": page,
        "page_size": page_size
    }
    return await list_knowledge_entries(user, params, db)

@router.get("/entries/{entry_id}")
async def get_entry(
    entry_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    await verify_knowledge_user(authorization, db)
    return await get_entry_detail(entry_id, db)

@router.post("/entries")
async def create_entry(
    req: EntryCreateUpdateRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db, allowed_roles={"admin", "collector"})
    entry = await create_knowledge_entry(user, req.dict(), db)
    return {"message": "Entry created successfully", "id": entry.id, "status": entry.status}

@router.put("/entries/{entry_id}")
async def update_entry(
    entry_id: str,
    req: EntryCreateUpdateRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db, allowed_roles={"admin", "collector"})
    entry = await update_knowledge_entry(entry_id, user, req.dict(), db)
    return {"message": "Entry updated successfully", "id": entry.id, "status": entry.status}

@router.delete("/entries/{entry_id}")
async def delete_entry(
    entry_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db, allowed_roles={"admin", "collector"})
    # 删除逻辑
    stmt = f"DELETE FROM knowledge_entries WHERE id = '{entry_id}'"
    from sqlalchemy import text
    if user.role == "collector":
        stmt += f" AND created_by = '{user.id}'"
    await db.execute(text(stmt))
    await db.commit()
    return {"message": "Entry deleted successfully"}

@router.post("/entries/{entry_id}/submit")
async def submit_entry(
    entry_id: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db, allowed_roles={"admin", "collector"})
    entry = await submit_entry_for_review(entry_id, user, db)
    return {"message": "Entry submitted for review", "status": entry.status}

@router.post("/entries/{entry_id}/review")
async def review_entry(
    entry_id: str,
    req: ReviewActionRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await verify_knowledge_user(authorization, db, allowed_roles={"admin", "reviewer"})
    entry = await review_knowledge_entry(entry_id, user, req.action, req.comment, db)
    return {"message": f"Entry {req.action}ed successfully", "status": entry.status}

# ==================== 审计与数据大屏 ====================

@router.get("/audit-trail")
async def audit_trail(
    limit: int = Query(50, ge=1, le=200),
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    await verify_knowledge_user(authorization, db)
    return await get_audit_trail(limit=limit, db=db)

@router.get("/dashboard/stats")
async def dashboard_stats(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    await verify_knowledge_user(authorization, db, allowed_roles={"admin", "reviewer"})
    return await get_knowledge_dashboard_stats(db)

# ==================== 多模态 AI 生成与上传接口 ====================

@router.post("/ai/generate-text")
async def ai_generate_text(
    req: AITextGenerateRequest,
    authorization: str = Header(...)
):
    # 只要登录即可调用生成
    return await generate_entry_text_content(req.word, req.category, req.hsk_level)

@router.post("/ai/generate-image")
async def ai_generate_image(
    req: AIImageGenerateRequest,
    authorization: str = Header(...)
):
    return await generate_line_art_image(req.word, req.custom_prompt)

@router.post("/ai/generate-video")
async def ai_generate_video(
    req: AIVideoGenerateRequest,
    authorization: str = Header(...)
):
    return await submit_cdance_video_task(req.word, req.custom_script)

@router.get("/ai/video-status/{task_id}")
async def ai_video_status(
    task_id: str,
    authorization: str = Header(...)
):
    return await query_and_save_video_task(task_id)

@router.post("/upload/file")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form("image"),  # image or video
    authorization: str = Header(...)
):
    sub_dir = "videos" if file_type == "video" else "images"
    ext = Path(file.filename).suffix or (".mp4" if file_type == "video" else ".png")
    filename = f"upload_{uuid.uuid4().hex[:12]}{ext}"
    save_path = UPLOADS_DIR / sub_dir / filename
    
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
        
    return {
        "url": f"/uploads/knowledge/{sub_dir}/{filename}",
        "filename": filename,
        "source_type": "upload"
    }
