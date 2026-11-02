import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api import users, conversations, chat, admin, knowledge
from backend.database.connection import init_db
from backend.config import DATA_DIR, BASE_DIR
from contextlib import asynccontextmanager

DATA_DIR.mkdir(parents=True, exist_ok=True)
uploads_dir = BASE_DIR / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="师道汉韵 Backend", description="多智能体协同国际中文教育系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录用于访问上传与生成的音视频和图片
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(users.router)
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(knowledge.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "师道汉韵 Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8888, reload=True)
