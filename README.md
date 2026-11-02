# 师道汉韵（SDHY）

面向国际中文教育的 AI 教学与知识管理平台，使用 FastAPI、LangGraph 和 React，包含学员学习端、管理控制台与知识管理平台。

## 主要功能

- **智能教学**：通过意图识别、记忆检索、知识检索、用户画像、教学策略、内容生成、多模态调度和质量校验等智能体协同处理学习问题。
- **学习记忆**：结合会话上下文、会话摘要和长期学习画像，支持个性化教学。
- **多模态学习**：支持教学图片、视频资源和汉字笔顺展示。
- **知识治理**：提供知识采编、审核和资源管理流程。
- **教学管理**：提供用户管理、对话查看、学情分析与教学增长分析。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 后端 | Python、FastAPI、Uvicorn |
| 智能体 | LangGraph、LangChain、兼容 OpenAI 的模型接口 |
| 数据存储 | SQLite、SQLAlchemy、aiosqlite |
| 前端 | React、Vite、Zustand |
| 可视化及内容 | Recharts、Markdown、Hanzi Writer |

## 目录结构

```text
SDHY/
├── backend/              # 后端接口、智能体、模型和业务服务
├── frontend/             # 学员学习端
├── admin-frontend/       # 管理控制台
├── knowledge-frontend/   # 知识管理平台
├── data/                 # 本地数据库及种子数据
├── uploads/knowledge/    # 教学图片、视频等资源
├── .env.example          # 环境配置模板
└── init_db_seed.py       # 种子数据导入、导出工具
```

## 本地启动

准备 Python 3.10+、Node.js 20.19+ 和 npm。以下命令以 Windows PowerShell 为例。

### 1. 获取项目

```powershell
git clone https://github.com/weiguang0803/SDHY.git
cd SDHY
```

后续命令从包含 `backend`、`frontend` 和 `.env.example` 的项目根目录执行。

### 2. 配置环境

首次运行时复制配置模板；已有 `.env` 时保留现有文件：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`，填写模型 API 密钥、接口地址和模型名，并设置 `JWT_SECRET`、`ADMIN_SECRET_KEY`、`KNOWLEDGE_SECRET_KEY`。使用视频生成功能时还需填写对应服务配置。模型功能需要可访问的服务和有效凭据。

### 3. 启动后端

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8888 --reload
```

后端启动时会初始化数据库表。默认数据库路径为 `data/sdhy.db`。

- 健康检查：<http://localhost:8888/health>
- API 文档：<http://localhost:8888/docs>

### 4. 启动前端

分别打开三个终端，在项目根目录执行相应命令：

**学员学习端**

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

**管理控制台**

```powershell
npm --prefix admin-frontend install
npm --prefix admin-frontend run dev
```

**知识管理平台**

```powershell
npm --prefix knowledge-frontend install
npm --prefix knowledge-frontend run dev
```

| 应用 | 默认访问地址 |
| --- | --- |
| 学员学习端 | <http://localhost:5175> |
| 管理控制台 | <http://localhost:5174> |
| 知识管理平台 | <http://localhost:5176> |

前端开发服务器将 `/api` 和 `/uploads` 请求代理到后端的 8888 端口。端口被占用时，以终端显示的实际地址为准。

## 数据与资源

SQLite 数据库、数据库备份、`.env`、`node_modules` 和构建产物不纳入版本控制。克隆仓库不会获得本地完整会话数据。

如需迁移已有数据，停止后端后将数据库放到 `data/sdhy.db`，并同步其引用的 `uploads/knowledge/` 资源。替换前备份原数据库。视频文件按现有忽略规则不上传，需另行复制。

项目提供 `init_db_seed.py` 和 `data/seed_data.json`；需要导入种子数据时运行 `python init_db_seed.py`。请先备份已有数据并确认种子内容适合当前环境。

## 前端构建

```powershell
npm --prefix frontend run build
npm --prefix admin-frontend run build
npm --prefix knowledge-frontend run build
```

构建结果位于各前端目录的 `dist/`。正式部署时需为静态站点配置 `/api`、`/uploads` 的反向代理，并根据部署域名调整后端跨域设置。
