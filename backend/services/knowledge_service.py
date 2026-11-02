import datetime
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_, or_
from fastapi import HTTPException
from jose import jwt
from backend.models.user import User
from backend.models.knowledge_entry import KnowledgeEntry
from backend.models.knowledge_review import KnowledgeReview
from backend.config import settings
from backend.services.user_service import get_password_hash, verify_password, create_access_token

VALID_KNOWLEDGE_ROLES = {"admin", "reviewer", "collector"}

async def verify_knowledge_user(authorization: str, db, allowed_roles: set = None) -> User:
    """验证知识管理平台用户 Token 与角色"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Token decode failed or expired")
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")
    
    if not user.role or user.role not in VALID_KNOWLEDGE_ROLES:
        raise HTTPException(
            status_code=403,
            detail="无权访问知识管理平台，该平台仅限采集员、审核员及管理员访问"
        )
    
    if allowed_roles and user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Permission denied. Requires one of {allowed_roles}")
    
    return user

async def register_knowledge_user(data: dict, db) -> dict:
    """注册知识管理平台用户（需要校验环境变量 KNOWLEDGE_SECRET_KEY）"""
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "collector").strip()
    secret_key = data.get("secret_key", "").strip()
    display_name = data.get("display_name", username).strip()
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    if role not in VALID_KNOWLEDGE_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {VALID_KNOWLEDGE_ROLES}")
    
    if secret_key != settings.KNOWLEDGE_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid registration secret key")
    
    # 检查用户名是否已存在
    stmt = select(User).where(User.username == username)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=username,
        password_hash=get_password_hash(password),
        display_name=display_name,
        role=role,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.id, "username": new_user.username, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "display_name": new_user.display_name,
            "role": new_user.role
        }
    }

async def login_knowledge_user(data: dict, db) -> dict:
    """知识管理平台用户登录"""
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    
    stmt = select(User).where(User.username == username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")
    
    if user.role not in VALID_KNOWLEDGE_ROLES:
        raise HTTPException(
            status_code=403, 
            detail="无权登录知识管理平台，该平台仅限采集员、审核员及管理员访问"
        )
    
    token = create_access_token({"sub": user.id, "username": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name or user.username,
            "role": user.role
        }
    }

# ==================== 词条 CRUD 与业务流转 ====================

async def create_knowledge_entry(user: User, data: dict, db) -> KnowledgeEntry:
    """创建新词条（采集员默认 draft 或 pending_review；管理员可直接 approved）"""
    word = data.get("word", "").strip()
    if not word:
        raise HTTPException(status_code=400, detail="Word name is required")
    
    # 状态控制：如果是管理员，可直接发布；采集员可选择存草稿或直接提审
    requested_status = data.get("status", "draft")
    if user.role == "admin" and requested_status == "approved":
        final_status = "approved"
    elif requested_status in ["draft", "pending_review"]:
        final_status = requested_status
    else:
        final_status = "draft"
    
    entry = KnowledgeEntry(
        word=word,
        pinyin=data.get("pinyin", ""),
        category=data.get("category", "词汇"),
        hsk_level=data.get("hsk_level", "初学者"),
        tags=data.get("tags", []),
        text_content=data.get("text_content"),
        image_content=data.get("image_content"),
        video_content=data.get("video_content"),
        status=final_status,
        created_by=user.id,
        updated_by=user.id
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    
    # 如果创建即提审或直发，记录日志
    if final_status in ["pending_review", "approved"]:
        action_type = "submit" if final_status == "pending_review" else "direct_publish"
        review_log = KnowledgeReview(
            entry_id=entry.id,
            applicant_id=user.id,
            reviewer_id=user.id if final_status == "approved" else None,
            action=action_type,
            comment="创建并提交审核" if final_status == "pending_review" else "管理员直接入库发布",
            snapshot={
                "word": entry.word,
                "pinyin": entry.pinyin,
                "text_content": entry.text_content,
                "image_content": entry.image_content,
                "video_content": entry.video_content
            }
        )
        db.add(review_log)
        await db.commit()
        
    return entry

async def update_knowledge_entry(entry_id: str, user: User, data: dict, db) -> KnowledgeEntry:
    """修改词条内容"""
    stmt = select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # 权限检查：采集员只能修改自己创建且非审核中的词条；管理员可修改所有
    if user.role == "collector" and entry.created_by != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own entries")
    
    if "word" in data and data["word"]:
        entry.word = data["word"]
    if "pinyin" in data:
        entry.pinyin = data["pinyin"]
    if "category" in data:
        entry.category = data["category"]
    if "hsk_level" in data:
        entry.hsk_level = data["hsk_level"]
    if "tags" in data:
        entry.tags = data["tags"]
    if "text_content" in data:
        entry.text_content = data["text_content"]
    if "image_content" in data:
        entry.image_content = data["image_content"]
    if "video_content" in data:
        entry.video_content = data["video_content"]
        
    # 状态变更
    if "status" in data:
        new_status = data["status"]
        if user.role == "admin":
            entry.status = new_status
        elif new_status in ["draft", "pending_review"]:
            entry.status = new_status
    
    entry.updated_by = user.id
    entry.updated_at = datetime.datetime.now()
    await db.commit()
    await db.refresh(entry)
    return entry

async def submit_entry_for_review(entry_id: str, user: User, db) -> KnowledgeEntry:
    """采集员提交词条审核"""
    stmt = select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    if user.role == "collector" and entry.created_by != user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    entry.status = "pending_review"
    entry.updated_by = user.id
    entry.updated_at = datetime.datetime.now()
    
    # 记录流转日志
    review_log = KnowledgeReview(
        entry_id=entry.id,
        applicant_id=user.id,
        action="submit",
        comment="采集员提交词条入库申请",
        snapshot={
            "word": entry.word,
            "pinyin": entry.pinyin,
            "text_content": entry.text_content,
            "image_content": entry.image_content,
            "video_content": entry.video_content
        }
    )
    db.add(review_log)
    await db.commit()
    await db.refresh(entry)
    return entry

async def review_knowledge_entry(entry_id: str, reviewer: User, action: str, comment: str, db) -> KnowledgeEntry:
    """审核员/管理员审核词条 (action: 'approve' | 'reject')"""
    if reviewer.role not in {"admin", "reviewer"}:
        raise HTTPException(status_code=403, detail="Only reviewers and admins can review entries")
    
    stmt = select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    if action == "approve":
        entry.status = "approved"
    elif action == "reject":
        if not comment or not comment.strip():
            raise HTTPException(status_code=400, detail="Rejection reason (comment) is required when rejecting")
        entry.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    entry.updated_by = reviewer.id
    entry.updated_at = datetime.datetime.now()
    
    # 记录审核流转与意见
    review_log = KnowledgeReview(
        entry_id=entry.id,
        applicant_id=entry.created_by,
        reviewer_id=reviewer.id,
        action=action,
        comment=comment or ("审核通过入库" if action == "approve" else "已驳回"),
        snapshot={
            "word": entry.word,
            "pinyin": entry.pinyin,
            "status": entry.status,
            "text_content": entry.text_content,
            "image_content": entry.image_content,
            "video_content": entry.video_content
        }
    )
    db.add(review_log)
    await db.commit()
    await db.refresh(entry)
    return entry

async def list_knowledge_entries(user: User, params: dict, db) -> dict:
    """列表查询词条，支持状态、类别、等级、关键词过滤"""
    status = params.get("status")
    category = params.get("category")
    hsk_level = params.get("hsk_level")
    keyword = params.get("keyword")
    scope = params.get("scope", "all")
    my_only = params.get("my_only", False)
    page = int(params.get("page", 1))
    page_size = int(params.get("page_size", 20))
    
    query = select(KnowledgeEntry)
    
    # 只要指定了 scope == 'mine' 或 my_only，按当前登录用户 ID 过滤仅看自己创建的
    if scope == "mine" or my_only is True or str(my_only).lower() in ["true", "1"]:
        query = query.where(KnowledgeEntry.created_by == user.id)
    
    if status and status != "all":
        query = query.where(KnowledgeEntry.status == status)
    if category and category != "all":
        query = query.where(KnowledgeEntry.category == category)
    if hsk_level and hsk_level != "all":
        query = query.where(KnowledgeEntry.hsk_level == hsk_level)
    if keyword and keyword.strip():
        kw = f"%{keyword.strip()}%"
        query = query.where(or_(KnowledgeEntry.word.ilike(kw), KnowledgeEntry.pinyin.ilike(kw)))
    
    # 统计总数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # 分页与排序
    query = query.order_by(desc(KnowledgeEntry.updated_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    entries = result.scalars().all()
    
    # 附带创建者用户名
    creator_ids = {e.created_by for e in entries if e.created_by}
    user_map = {}
    if creator_ids:
        u_res = await db.execute(select(User.id, User.username, User.display_name).where(User.id.in_(creator_ids)))
        for u in u_res.all():
            user_map[u[0]] = u[2] or u[1]
            
    items = []
    for e in entries:
        items.append({
            "id": e.id,
            "word": e.word,
            "pinyin": e.pinyin,
            "category": e.category,
            "hsk_level": e.hsk_level,
            "tags": e.tags or [],
            "status": e.status,
            "has_text": bool(e.text_content),
            "has_image": bool(e.image_content and e.image_content.get("url")),
            "has_video": bool(e.video_content and e.video_content.get("url")),
            "text_content": e.text_content,
            "image_content": e.image_content,
            "video_content": e.video_content,
            "created_by": e.created_by,
            "creator_name": user_map.get(e.created_by, "未知用户"),
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None
        })
        
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

async def get_entry_detail(entry_id: str, db) -> dict:
    """获取单个词条详情及历史审核交互记录"""
    stmt = select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id)
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # 关联创建者名称
    u_stmt = select(User.username, User.display_name).where(User.id == entry.created_by)
    u_row = (await db.execute(u_stmt)).first()
    creator_name = (u_row[1] or u_row[0]) if u_row else "未知用户"
    
    # 查询审核交互日志
    rev_stmt = select(KnowledgeReview).where(KnowledgeReview.entry_id == entry_id).order_by(desc(KnowledgeReview.created_at))
    rev_res = await db.execute(rev_stmt)
    reviews = rev_res.scalars().all()
    
    # 查找涉及的用户名称
    user_ids = {r.applicant_id for r in reviews if r.applicant_id} | {r.reviewer_id for r in reviews if r.reviewer_id}
    name_map = {}
    if user_ids:
        u_all = await db.execute(select(User.id, User.username, User.display_name).where(User.id.in_(user_ids)))
        for u in u_all.all():
            name_map[u[0]] = u[2] or u[1]
            
    review_logs = []
    for r in reviews:
        review_logs.append({
            "id": r.id,
            "action": r.action,
            "applicant_name": name_map.get(r.applicant_id, "申请人"),
            "reviewer_name": name_map.get(r.reviewer_id, "审核员") if r.reviewer_id else None,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
        
    return {
        "id": entry.id,
        "word": entry.word,
        "pinyin": entry.pinyin,
        "category": entry.category,
        "hsk_level": entry.hsk_level,
        "tags": entry.tags or [],
        "text_content": entry.text_content,
        "image_content": entry.image_content,
        "video_content": entry.video_content,
        "status": entry.status,
        "created_by": entry.created_by,
        "creator_name": creator_name,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
        "reviews": review_logs
    }

async def get_audit_trail(limit: int = 50, db = None) -> list:
    """获取采审全流程交互动态（时间线）"""
    stmt = select(KnowledgeReview, KnowledgeEntry.word).join(
        KnowledgeEntry, KnowledgeReview.entry_id == KnowledgeEntry.id
    ).order_by(desc(KnowledgeReview.created_at)).limit(limit)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    user_ids = set()
    for rev, _ in rows:
        if rev.applicant_id: user_ids.add(rev.applicant_id)
        if rev.reviewer_id: user_ids.add(rev.reviewer_id)
        
    name_map = {}
    if user_ids:
        u_res = await db.execute(select(User.id, User.username, User.display_name).where(User.id.in_(user_ids)))
        for u in u_res.all():
            name_map[u[0]] = u[2] or u[1]
            
    trail = []
    for rev, word in rows:
        trail.append({
            "id": rev.id,
            "entry_id": rev.entry_id,
            "word": word,
            "action": rev.action,
            "applicant_name": name_map.get(rev.applicant_id, "采集员"),
            "reviewer_name": name_map.get(rev.reviewer_id, "审核员") if rev.reviewer_id else None,
            "comment": rev.comment,
            "created_at": rev.created_at.isoformat() if rev.created_at else None
        })
    return trail

async def get_knowledge_dashboard_stats(db) -> dict:
    """获取知识管理平台数据大屏统计信息"""
    # 词条总数与状态分布
    total_entries = (await db.execute(select(func.count(KnowledgeEntry.id)))).scalar() or 0
    approved_entries = (await db.execute(select(func.count(KnowledgeEntry.id)).where(KnowledgeEntry.status == "approved"))).scalar() or 0
    pending_entries = (await db.execute(select(func.count(KnowledgeEntry.id)).where(KnowledgeEntry.status == "pending_review"))).scalar() or 0
    rejected_entries = (await db.execute(select(func.count(KnowledgeEntry.id)).where(KnowledgeEntry.status == "rejected"))).scalar() or 0
    draft_entries = (await db.execute(select(func.count(KnowledgeEntry.id)).where(KnowledgeEntry.status == "draft"))).scalar() or 0
    
    # 模态覆盖率（精确校验 JSON 内部是否实际含有有效多模态文件与内容）
    entries_for_modal = (await db.execute(select(KnowledgeEntry.text_content, KnowledgeEntry.image_content, KnowledgeEntry.video_content))).all()
    text_count = 0
    image_count = 0
    video_count = 0
    for t_raw, i_raw, v_raw in entries_for_modal:
        t = t_raw if isinstance(t_raw, dict) else {}
        img = i_raw if isinstance(i_raw, dict) else {}
        vid = v_raw if isinstance(v_raw, dict) else {}
        if bool(t.get('pinyin') or t.get('definition') or t.get('explanation') or t.get('translation')):
            text_count += 1
        if bool(img.get('url') or img.get('local_path') or img.get('file_url')):
            image_count += 1
        if bool(vid.get('url') or vid.get('local_path') or vid.get('video_url') or vid.get('file_url')):
            video_count += 1
    
    # 类别分布
    cat_stmt = select(KnowledgeEntry.category, func.count(KnowledgeEntry.id)).group_by(KnowledgeEntry.category)
    cat_rows = (await db.execute(cat_stmt)).all()
    categories_dist = [{"name": r[0] or "其他", "value": r[1]} for r in cat_rows]
    
    # 采编贡献排行榜
    top_collectors_stmt = select(
        User.username,
        User.display_name,
        func.count(KnowledgeEntry.id).label("entry_count")
    ).join(
        KnowledgeEntry, KnowledgeEntry.created_by == User.id
    ).group_by(User.id).order_by(desc("entry_count")).limit(5)
    
    top_rows = (await db.execute(top_collectors_stmt)).all()
    collectors_ranking = [{"name": r[1] or r[0], "count": r[2]} for r in top_rows]
    
    # 近 7 天提审与审核通过趋势
    today = datetime.datetime.now().date()
    cutoff_date = today - datetime.timedelta(days=6)
    cutoff_str = cutoff_date.isoformat()
    
    trend_stmt = select(
        func.date(KnowledgeReview.created_at).label("d_str"),
        KnowledgeReview.action,
        func.count(KnowledgeReview.id)
    ).where(
        func.date(KnowledgeReview.created_at) >= cutoff_str
    ).group_by(func.date(KnowledgeReview.created_at), KnowledgeReview.action)
    
    trend_rows = (await db.execute(trend_stmt)).all()
    trend_map = {}
    for d_str, action, cnt in trend_rows:
        if d_str not in trend_map:
            trend_map[d_str] = {"submit": 0, "approve": 0, "reject": 0}
        if action in trend_map[d_str]:
            trend_map[d_str][action] = cnt
            
    trend_data = []
    for i in range(7):
        curr_d = (cutoff_date + datetime.timedelta(days=i)).isoformat()
        metrics = trend_map.get(curr_d, {"submit": 0, "approve": 0, "reject": 0})
        trend_data.append({
            "date": curr_d,
            "submitted": metrics["submit"],
            "approved": metrics["approve"],
            "rejected": metrics["reject"]
        })
        
    return {
        "total_entries": total_entries,
        "approved_entries": approved_entries,
        "pending_entries": pending_entries,
        "rejected_entries": rejected_entries,
        "draft_entries": draft_entries,
        "pass_rate": round((approved_entries / total_entries * 100), 1) if total_entries > 0 else 0,
        "modal_stats": {
            "text": text_count,
            "image": image_count,
            "video": video_count
        },
        "category_distribution": categories_dist,
        "collectors_ranking": collectors_ranking,
        "seven_days_trend": trend_data
    }


# ==================== 学员端智能体教学知识库检索 (RAG) ====================

async def search_approved_knowledge(user_input: str, knowledge_points: list = None, target_words: list = None, category: str = None, db = None, limit: int = 3) -> dict:
    """
    针对学员提问检索已审核入库 (status='approved') 的教学知识词条。
    采用四重跨语言立体检索引擎：
    1. 跨语言语义对齐目标中文词 (target_words) 精确与子串匹配（1.0 / 0.88）
    2. 双语权威释义/英文翻译 (translation) 倒排语义匹配（0.75 - 0.90）
    3. 中文词条/前缀/子串包含（0.70 - 1.0）
    4. 拼音与多语言标签加权（0.25 - 0.65）
    """
    if not db:
        return {"hit": False, "entries": [], "primary_entry": None, "prompt_context": ""}

    query = select(KnowledgeEntry).where(KnowledgeEntry.status == "approved")
    result = await db.execute(query)
    all_approved = result.scalars().all()

    if not all_approved:
        return {"hit": False, "entries": [], "primary_entry": None, "prompt_context": ""}

    import re
    input_text = (user_input or "").strip()
    input_lower = input_text.lower()
    kp_list = [str(kp).strip() for kp in (knowledge_points or []) if kp]
    tw_list = [str(tw).strip() for tw in (target_words or []) if tw]

    # 提取英文/外语关键 Token（过滤高频停用词）
    en_stop = {"what", "is", "are", "the", "a", "an", "how", "to", "in", "chinese", "tell", "me", "about", "can", "you", "please", "do", "does", "meaning", "say", "write", "of", "and", "for", "with", "this", "that", "want", "know"}
    input_tokens = [tok for tok in re.findall(r'[a-zA-Z]{3,}', input_lower) if tok not in en_stop]

    scored_entries = []

    for entry in all_approved:
        score = 0.0
        word = entry.word or ""
        pinyin = (entry.pinyin or "").lower()
        tags = [str(t).lower() for t in (entry.tags or [])]
        ent_cat = entry.category or ""
        txt_info = entry.text_content if isinstance(entry.text_content, dict) else {}
        translation = (txt_info.get("translation") or "").lower()

        # 1. 跨语言映射目标词直接一致或原句词汇完全一致（最高置信度 1.0）
        if word == input_text or any(word == tw for tw in tw_list) or any(word == kp for kp in kp_list):
            score += 1.0
        # 2. 词条或目标中文词存在包含关系（置信度 0.88）
        elif word and (word in input_text or any(word in tw or tw in word for tw in tw_list) or any(word in kp or kp in word for kp in kp_list)):
            score += 0.88
        # 3. 用户输入是词条的前缀或子串（如用户输入"抄手"问"红油抄手"）
        elif word and (input_text in word):
            score += 0.70

        # 4. 【核心突破】外语双语释义/英文翻译命中 (Translation Matching)
        # 针对留学生纯英文或纯外语提问场景（如 "What is Chongqing noodles?" 或 "tell me about hot pot"）
        if translation:
            # 检查外语关键词在 translation 中的命中
            matched_tokens = [tok for tok in input_tokens if tok in translation]
            if matched_tokens:
                # 命中 1 个关键外语词得 0.75，命中 2 个及以上得 0.90
                trans_score = min(0.90, 0.65 + 0.15 * len(matched_tokens))
                score = max(score, trans_score)
            # 检查 knowledge_points 中的外语短语是否在 translation 中
            for kp in kp_list:
                kp_clean = kp.lower().strip()
                if len(kp_clean) >= 3 and (kp_clean in translation or any(tok in kp_clean for tok in translation.split()[:5])):
                    score = max(score, 0.80)

        # 5. 拼音匹配（无声调或带声调包含）
        pinyin_clean = pinyin.replace(" ", "")
        input_clean = input_lower.replace(" ", "")
        if pinyin_clean and (pinyin_clean in input_clean or input_clean in pinyin_clean):
            score = max(score, 0.65)

        # 6. 标签命中
        matched_tags = [t for t in tags if t in input_lower or any(t in kp.lower() for kp in kp_list)]
        if matched_tags:
            score += 0.25 * len(matched_tags)

        # 7. 分类对齐奖励
        if category and category != "all" and ent_cat == category:
            score += 0.15

        if score >= 0.6:
            # 检查是否有本地简笔画与本地短视频
            has_img = bool(entry.image_content and entry.image_content.get("url"))
            has_vid = bool(entry.video_content and entry.video_content.get("url"))

            scored_entries.append({
                "entry": entry,
                "score": min(round(score, 2), 1.0),
                "has_image": has_img,
                "has_video": has_vid
            })

    # 按置信度排序
    scored_entries.sort(key=lambda x: x["score"], reverse=True)
    top_entries = scored_entries[:limit]

    if not top_entries:
        return {"hit": False, "entries": [], "primary_entry": None, "prompt_context": ""}

    primary = top_entries[0]
    p_entry = primary["entry"]

    # 提取格式化实体数据
    formatted_entries = []
    for item in top_entries:
        e = item["entry"]
        img_info = e.image_content if isinstance(e.image_content, dict) else {}
        vid_info = e.video_content if isinstance(e.video_content, dict) else {}
        txt_info = e.text_content if isinstance(e.text_content, dict) else {}

        formatted_entries.append({
            "id": e.id,
            "word": e.word,
            "pinyin": e.pinyin,
            "category": e.category,
            "hsk_level": e.hsk_level,
            "tags": e.tags or [],
            "score": round(item["score"], 2),
            "text_content": txt_info,
            "image_content": img_info,
            "video_content": vid_info,
            "has_local_image": item["has_image"],
            "has_local_video": item["has_video"]
        })

    # 构建供 Teaching Agent 使用的高置信度标准教学基准 Prompt 上下文
    primary_data = formatted_entries[0]
    txt = primary_data.get("text_content", {})
    explanation = txt.get("explanation") or ""
    translation = txt.get("translation") or ""
    textbook_exs = txt.get("textbook_examples") or []
    daily_exs = txt.get("daily_examples") or []
    topic_rd = txt.get("topic_reading") or ""

    prompt_lines = [
        f"【📚 教学知识管理库权威匹配成功（置信度: {primary_data['score']}，请优先使用并严格遵循）】",
        f"- 核心词条：{primary_data['word']} (标准拼音: {primary_data['pinyin']} | 适用等级: {primary_data['hsk_level']} | 类别: {primary_data['category']})"
    ]
    if translation:
        prompt_lines.append(f"- 标准英文翻译/释义：{translation}")
    if explanation:
        prompt_lines.append(f"- 权威词条释义：{explanation}")
    if textbook_exs:
        prompt_lines.append("- 标准教材例句（优先作为示范例句）：")
        for ex in textbook_exs[:2]:
            ch = ex.get("chinese", "")
            py = ex.get("pinyin", "")
            tr = ex.get("translation", "")
            prompt_lines.append(f"  * {ch} ({py}) —— {tr}")
    if daily_exs:
        prompt_lines.append("- 真实口语交比例句：")
        for ex in daily_exs[:2]:
            ch = ex.get("chinese", "")
            tr = ex.get("translation", "")
            prompt_lines.append(f"  * {ch} —— {tr}")
    if topic_rd:
        prompt_lines.append(f"- 文化/情境拓展点拨：{topic_rd}")

    if primary_data["has_local_image"]:
        prompt_lines.append(f"- 🎨 配套教具已就绪：知识库已包含该词条的手绘黑白简笔画，系统将随回复原生直出展示！")
    if primary_data["has_local_video"]:
        prompt_lines.append(f"- 🎬 配套微课已就绪：知识库已包含该词条的15秒教学短视频，系统将随回复原生直出播放！")

    prompt_context = "\n".join(prompt_lines)

    return {
        "hit": True,
        "score": primary_data["score"],
        "entries": formatted_entries,
        "primary_entry": primary_data,
        "has_local_media": primary_data["has_local_image"] or primary_data["has_local_video"],
        "prompt_context": prompt_context
    }

