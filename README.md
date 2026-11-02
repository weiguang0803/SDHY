# 师道汉韵 (International Chinese Education AI)

> **基于 LangGraph 多智能体协同的国际中文教育个性化 AI 教学与知识治理平台**  
> *Driven by Multi-Agent Orchestration for Tailored Chinese Language Learning, Multi-Modal Resource Governance & Administration*

---

## 📖 项目简介 (Project Overview)

**师道汉韵** 是一款专为国际中文学习者（汉语作为第二语言/外语学习者）、教学管理者及教研采编审核人员打造的全栈智能教学与知识治理系统。

- **🎓 学员学习端 (User Client, Port 5175)**：系统采用 **LangGraph** 构建了包含 **8 个专业分工智能体** 的协同图谱（Graph Pipeline），集成了 **L1/L2/L3 分层认知记忆体系**、**官方教学知识库 RAG 权威基准** 与 **跨语言语义实体检索**。从意图识别与外语概念对齐、分层记忆装配、知识库权威检索、用户画像匹配、个性化策略制定到双语化教学生成、多模态教具直出（本地手绘简笔画与 15s 情境微课）以及五维适切度质量校验，全流程流式呈现给用户。包含规范化双语 Markdown 教学模板，涵盖**语音发音、汉字笔顺动画、词汇简笔画、教学微课与语言自适应追问**；采用 **880px~960px 黄金阅读舒适宽度容器** 与气泡贴合对齐的智能体协同推理步骤流；每条消息支持【重新生成、收藏、复制、删除】快捷操作；侧边栏配备【全部 / 收藏对话】分类切换。
- **🛠️ 管理控制台 (Admin Dashboard, Port 5174)**：提供独立、支持深浅双主题切换的高阶管理后台。支持管理员秘钥鉴权、**6 大 Apple / Glassmorphism Pro 高级微拟物磨砂玻璃指标卡**、近 7 天消息趋势折线图与母语分布双拼（1.4fr : 1fr）、**底部满宽核心交互意图频次垂直柱状图**、**学员与知识平台成员分类管理 Tab**、全平台用户认知画像与薄弱点审查抽屉、**全要素对话审查（Markdown 富文本 + 8 大智能体推演轴 + 多模态教具与微课预览）**与系统配置监控。深度集成工业级**【学情分析中心】**（母语×教学主题热力矩阵、自报水平人均提问深度、掌握度排行榜、L3疑点榜、90天学习日历、知识供给缺口挖掘与导出）与**【教学增长分析】**（学员规模与每日新增双轴图、30日留存率 Cohort 同期群分析、自报水平抗毛边环形图、母语覆盖动态高保真条形图、全周 5 大黄金时段活跃热力图）。
- **📚 知识管理平台 (Knowledge Platform, Port 5176)**：提供专属权威知识治理工作台。划分 **管理员、审核员、采集员** 三大角色（支持 `.env` 秘钥配置）。支持文本释义、黑白教学简笔画、15秒微课短视频三大模态独立采编与 AI 一键辅助生成；提供审核员多模态比对核验与驳回理由批注、全流程交互时间线审计 (`Audit Trail`) 与**完全对齐同款设计规范的知识全景大屏**。

---

## 🌟 核心特色 (Key Features)

### 1. 🤖 八大智能体协同流水线与自适应多语推演 (8 Multi-Agent Pipeline & Adaptive i18n)
- 🎯 **意图识别智能体 (`intent_agent`)**：深度解析用户提问，归类为 6 大教学意图，并具备**跨语言概念映射能力 (`target_chinese_words`)**，外国学员使用纯英文、法文或卢旺达语等母语提问时自动对齐目标中文实体。
- 🧠 **分层记忆智能体 (`memory_agent`)**：协同装配 L1 无损滑动窗口、L2 动态情景滚动摘要（跨会话轨迹提炼）与 L3 学员终身持久认知画像（偏误追踪与薄弱点）。
- 📚 **知识库路由智能体 (`knowledge_agent`)**：检索已审核入库 (`status='approved'`) 的知识词条，锁定权威释义、教材规范例句与本地手绘简笔画/微课视频。
- 👤 **画像匹配智能体 (`profile_agent`)**：加载学习者 HSK 等级（HSK1-6）、注册邮箱与母语背景（支持英语、日语、韩语、法语、西班牙语、俄语、阿拉伯语、卢旺达语等 9 大语系）。
- 🎭 **教学策略智能体 (`orchestrator_agent`)**：根据画像、意图与历史薄弱点动态下发自适应语言模式、教学方法与难度阶梯。
- ✨ **双语教学生成智能体 (`teaching_agent`)**：严格基于国际二语教学 5 大标准化双语 Markdown 模块模板，实行“母语定义优先”，输出中文/拼音/外语三行对齐的高质量教学内容；主动注入历史高频薄弱点防范指令，实现个性化靶向教学。
- 🎨 **多模态与教具调度智能体 (`multimodal_agent`)**：优先直出知识库本地简笔画与 15s 竖屏微课；支持跨语种笔顺提问识别与目标汉字动态解构，驱动前端 HanziWriter 笔顺演示；智能推荐知名高校真实权威公开课。
- 🛡️ **质量验证智能体 (`validator_agent`)**：执行准确性、适切度、完整性、安全性与外语初学者语言适配度的五维校验，未通过则触发自我修正重试。
- 🌐 **9 大语系自适应协同思维链**：推演轴根据学员母语自适应展示对应母语的思维状态（涵盖中、英、日、韩、法、西、俄、阿、卢旺达语），彻底消除子串误判，无需人工切换即可完全自适应呈现。

### 2. 🧠 智能体分层认知与跨会话记忆体系 (Tiered Memory Architecture - L1/L2/L3)
- **L1 短期无损工作记忆 (Short-Term Working Memory)**：保留当前会话最近 4~8 轮精确对话无损窗口，保障代词回指与多轮追问的即时语境理解。
- **L2 情景动态滚动摘要 (Episodic Rolling Memory & Trajectory)**：
  - 基于 `conversation_summaries` 数据表，满 4 条消息（2 轮深度交互）由 LLM 异步压缩为 100 字滚动情景摘要；
  - **跨会话情景轨迹**：学员开启新会话时，自动跨越最近 3 个历史会话提取核心知识点轨迹，保持学习脉络连续性。
- **L3 长期持久认知画像与偏误追踪 (Long-Term Cognitive Profile)**：
  - 基于 `user_learning_profiles` 数据表，持久化记录学员掌握度、薄弱语法点（偏误频次与最后出错时间）、优势强项与五维能力雷达评分；
  - **跨会话教学反哺**：学员在任何历史会话中出现的语法偏误，在跨会话提问时都会主动被 TeachingAgent 读取并注入专属避坑指导，防止反复犯错。

### 3. 🎬 多模态权威视频资源与防盗链容灾播放体系 (Curated Videos & Anti-Hotlinking Protection)
- **41 部知名高校真实公开课**：精选并收录北京语言大学示范课（“把”字句、初级口语短文）、首都师范大学汉教大赛、全球微课大赛等真实权威教学视频，覆盖 7 大主题。
- **全链路防盗链穿透**：图片与播放器全局配置 `referrerPolicy="no-referrer"`，放宽 iframe 沙箱权限（补充 `allow-forms`, `allow-top-navigation-by-user-activation`），消除 403 裂图与安全阻断。
- **双重容灾与 1080P 一键直达**：推荐卡片配备 `[B站 ↗]` 快捷外链，弹窗播放器顶部设置动态呼吸提示条 `[前往 B 站 1080P 高清原站播放 ↗]`，遇网络风控时 1 秒无缝降级。
- **本地官方微课专项优化**：知识库本地微课原生置顶播放，并新增 `[0.75x 慢速跟读]`、`[1.0x 正常]`、`[1.25x]` 语速切换工具栏，助力留学生听辨发音。

### 4. 📚 教学知识库深度集成与多模态教具直出 (Approved Knowledge RAG & Local Asset Dispatch)
- **权威基准优先**：优先匹配已审核知识词条，规范统一教学释义与教材示范例句，杜绝大模型学术幻觉。
- **本地高保真教具原生直出**：知识库命中后，直接挂载本地白底手绘黑白简笔画（`uploads/knowledge/images/`）与 15s 竖屏微课教学短视频（`uploads/knowledge/videos/`）。
- **播放器自适应呈现**：微课播放器自适应比例渲染，提供“✨ 官方教学微课”原生播放体验。

### 5. 🌐 跨语言实体对齐与多语种倒排检索 (Cross-Lingual Semantic Alignment)
- **双保险跨语言检索**：
  1. **语义层映射**：`intent_agent` 先行将纯外语提问实体翻译对齐为目标中文词汇（如 `"How to write tea?"` $\rightarrow$ `['茶']`）；
  2. **释义倒排匹配**：`search_approved_knowledge` 检索词条库的标准英文翻译（`translation`），即使未提取出中文词也能通过外语释义命中；
- **跨语种笔顺驱动**：支持英、法、西、卢旺达语等多种语言的书写询问，汉字自动单字解构，驱动前端 HanziWriter 笔顺动态播放。

### 6. 📖 对外汉语二语教学双语标准化模板 (Bilingual Pedagogy Standard)
- **解决留学生纯中文阅读障碍**：
  - 5 大核心模块 H3 标题全面双语化（如 `### 💡 1. 核心概念解析 | Core Concept`）；
  - 核心释义推行“母语定义优先 (Native-First Definition)”与简浅中文下方的外语逐句对照；
  - 语法公式采用国际通用词性标签（如 `Subject (主语) + 在 (zài) + Place (地点) + Verb (动词)`）；
  - 例句严格规范为三行标准对齐排版（1.中文 2.拼音 3.外语精准翻译）；
  - 互动练习题目与句型模板双语提示，降低初学者开口门槛。

### 7. 💬 对话操作工具栏与侧边栏收藏体系 (Message Actions & Favorites)
- ⚡ **消息级快捷工具栏**：AI 教学回复末尾配备【🔄 重新生成、⭐ 收藏/取消收藏、📋 一键复制、🗑️ 二次确认气泡删除】快捷操作组。
- 📑 **侧边栏分类标签**：顶部提供分段式胶囊 Tab `[ 💬 全部 ]` 与 `[ ⭐ 收藏对话 ]`，并配备动态计数角标与专属空状态。
- 🌟 **无瑕疵单星标悬停交互**：已收藏会话常驻显示单颗高质感金星，悬停时平滑展开操作栏，杜绝双星标冲突。

### 8. ☀️/🌙 三大前端全景双主题系统与 Apple Glassmorphism Pro 高级微拟物视觉 (Unified Dual-Theme & Glassmorphism Pro)
- 🌓 **首屏零闪烁水合与全局主题热切换 (Zero-Flicker Hydration & Hot Swap)**：
  - 三大工程（学习端 5175、管理端 5174、知识端 5176）注入内联反闪烁脚本，优先读取 `localStorage` 记忆与系统色彩偏好，在 DOM 挂载前设置主题令牌，彻底杜绝白屏跳闪；
  - 三端侧边栏底栏排布统一规范：左侧展示用户信息与角色，右侧并排 `32×32px` 微拟物【☀️/🌙 主题切换】与【🚪 退出登录】微按钮框，交互手感与视觉度量 100% 深度对齐。
- 💎 **Apple / Linear 级微拟物设计系统（深浅自适应）**：
  - **暗色模式 (Dark Mode)**：`28px` 重度深邃毛玻璃滤镜（`backdrop-filter: blur(28px) saturate(190%)`）+ `1px` 物理反光高光内阴影 + 浮雕渐变微拟物圆盘图标勋章；
  - **浅色模式 (Light Mode)**：纯净象牙白卡片、细微柔和环境阴影、Linear 级彩色徽章（蓝/绿/橙/红/紫/青 6 色微拟物）、符合 WCAG AA 标准的实色药丸徽章与学术引文框，全要素无死角适配（登录页、大屏指标卡、审核流、追溯轴、汉字笔画等）；
- 📐 **双大屏结构完全统一**：管理控制台与知识全景大屏统一采用 **“6 大指标卡 → 中间 1.4fr : 1fr 双拼 → 底部满宽柱状图”** 经典金字塔结构。
- 📊 **满宽横向铺满与纵向流体高度**：
  - 引入 `.is-dashboard` 100% 满屏无缝铺满机制，消除管理端两侧留黑被收窄的痛点；
  - 图表高度与视口高度动态联动（中间双图表 `clamp(320px, 34vh, 460px)`，底部柱状图 `clamp(260px, 28vh, 380px)`），消除底部空白。
- 📖 **学员端 880px~960px 黄金阅读宽度容器**：杜绝宽屏上长文本横向过度拉伸导致的阅读疲劳。

### 9. 📚 知识管理与多模态资源治理中心 (Knowledge Platform - Port 5176)
- 👥 **三角色协同治理体系**：
  - **采集员 (Collector)**：负责词条采编、草稿保存、AI 辅助多模态内容一键生成与提交入库审核；支持精准“仅我创建”范围过滤。
  - **审核员 (Reviewer)**：多模态全面核验、一键通过入库、强制驳回理由填写与反馈。
  - **管理员 (Admin)**：全局统筹、免审直接入库发布、全流程采审交互追溯时间线 (`Audit Trail`) 与知识全景大屏。
- 🎨 **三模态独立采编与 AI 辅助生成**：
  - **文本模块 (Text)**：词条解释、教材规范例句、日常口语例句、英文翻译、文化主题拓展。
  - **简笔画模块 (Image)**：适合留学生的黑白线稿简笔画，支持 Prompt 在线自定义编辑与一键生成，自动转存至本地静态库。
  - **微课视频模块 (Video)**：10-15 秒真实生活语境教学短视频，支持文生视频任务提交、异步轮询与本地高清转存。
- 🔍 **多模态真实资产穿透统计**：穿透检查 JSON 真实 URL 字段，精准统计各模态实际覆盖率（如 `17/12/2`），杜绝空 JSON 字典造成的虚假 100% 全覆盖。

### 10. 🔒 三系统权限隔离与安全防护 (Security & Role Gatekeeping)
- **严格跨端登录隔离**：学员账号（`user`）严格限制于 5175 学习端；管理后台（5174）仅限超级管理员（`admin`）；知识管理平台（5176）仅限工作人员（`collector`、`reviewer`、`admin`），各端口具备清晰友好的鉴权拦截提示。
- **环境变量秘钥配置**：管理员与知识库注册秘钥完全交由 `.env` 配置（`ADMIN_SECRET_KEY`、`KNOWLEDGE_SECRET_KEY`），方便随需变更与安全轮换。
- **管理后台分类 Tab 独立管理**：将学生学员与知识平台教职员工清晰分为两类独立维护。

### 11. 📊 独立后台管理控制台 (Admin Dashboard - Port 5174)
- 🛡️ **安全秘钥注册与鉴权**：支持管理员秘钥验证注册，基于 JWT Role 隔离。
- 📈 **全景控制台大屏与高阶可视化**：
  - 6 大 Apple Glassmorphism Pro 微拟物磨砂玻璃 KPI 统计卡片：总用户数、今日活跃用户、今日新增消息、总对话数、总消息数、平均对话长度。
  - 3 大黄金比例图表：近 7 天消息趋势 AreaChart、学员母语语种分布 PieChart（内嵌学员总数中心徽标）、底部满宽学员核心交互意图分布与频次榜 BarChart（圆角彩色柱条）。
- 💡 **学情分析中心 (`LearnerAnalytics`)**：
  - **群体全景概览 (Overview)**：8 大核心母语背景 × 6 大教学主题（日常交流、语法讲解、词汇学习、文化知识、偏误纠错、其他）热力交叉矩阵；中文自报水平人均提问量对比；学员与管理员双轨活跃趋势折线图。
  - **学习主题与高频疑点 (Topics & Doubts)**：六大学习主题深度排行与学员覆盖数；高频具体知识点掌握度排行榜（配备 310px 限高与垂直微滚动条）；L3 学员多次偏误薄弱语法点追踪；90 天全景学习热力日历。
  - **知识供给缺口清单 (Gaps)**：自动比对学员提问知识点与已审核知识库词条，挖掘采编需求缺口；支持每页 10 条分页流转与卡片右上角一键导出 Markdown / Excel 清单。
  - **全链路居中弹窗穿透下钻 (Modal Drilldown)**：点击任意热力块、主题或知识点均可呼出居中模态弹窗（替代老版抽屉，解决顶部截断），配备 8 条/页分页流转器，下钻原始真实提问与完整会话上下文。
- 📈 **教学增长分析 (`GrowthAnalytics`)**：
  - **6 大核心增长与健康度 KPI**：累计注册学员、本月新增、30 日留存率（严格 Cohort 同期群分析）、区间活跃率、人均会话深度、会话收藏收敛率（专属纯矢量微光主题图标容器，无底部小字干扰）。
  - **学员增长与每日新增双轴图**：左轴累计学员面积渐变发光折线（Area），右轴每日新增圆角细柱（Bar，`maxBarSize=18`），杜绝遮罩干扰。
  - **中文自报水平分布环形图**：空心环形扇区几何去毛边与抗锯齿优化（`stroke="none"` 与 `shapeRendering="geometricPrecision"`），中心直接透出全体学员总规模与“全体学员”标签，底部配备结构化指标列表。
  - **学员母语覆盖矩阵 (Animated Matrix)**：100% 数据库动态统计（全量语系动态归纳），配置硬件加速阶梯式入场动效、微光流体动效、悬停电光蓝发光与高对比度滚动条（支持 5 种以上母语时自然平滑滚动）。
  - **全周活跃时段热力矩阵 (Weekly Heatmap)**：按上海时区划分早晨、上午、下午、晚上、深夜 5 大时段微网格，高亮峰值提问，未来日期虚线区隔，辅助教研答疑排班。
- 👥 **用户管理与画像抽屉 (`UserList` & `UserDetail`)**：支持状态管控（暂停登录/恢复）与开启/禁止新用户注册开关，真实分类学生提问意图（词汇、文化、语法、日常）。
- 💬 **全要素对话审查 (`ConvList` & `ConvDetail`)**：审查全平台会话记录，支持按用户筛选；深度还原每条消息的二语教学 Markdown 富文本排版、语法对比表格、8 大智能体协同推演时间轴卡片（含各阶段精确耗时、决策产出与五维适切度评分）以及内嵌多模态教具与微课视频预览（含简笔画灯箱与 HTML5 微课播放审查）。
- ⚙️ **系统配置监控 (`SystemInfo`)**：查看大模型模型配置、API 接口脱敏显示、动态相对路径数据库与空间占用。

---

## 🛠️ 技术栈 (Technology Stack)

### 后端 (Backend - Port 8888)
- **Framework**: Python 3.10+, FastAPI, Uvicorn
- **Orchestration**: LangGraph, LangChain
- **LLM & Multi-Modal**: 师道汉韵核心语言模型、简笔画生成模型、情境短视频生成管道
- **Database**: SQLite (动态相对路径便携存储), Async SQLAlchemy (AsyncIO)
- **Authentication**: JWT (python-jose), Passlib (pbkdf2_sha256)
- **Streaming & File Serving**: SSE (sse-starlette), StaticFiles (`/uploads`)

### 前端三大应用 (Frontend Stacks)
- **学员学习端 (`frontend` - Port 5175)**：React 18/19, Vite, Zustand, react-markdown, remark-gfm, rehype-highlight, hanzi-writer
- **管理控制台 (`admin-frontend` - Port 5174)**：React 18, Vite, Recharts, Zustand, react-markdown, remark-gfm, Glassmorphism & Linear Dual-Theme
- **知识管理平台 (`knowledge-frontend` - Port 5176)**：React 18, Vite, Recharts, Zustand, Multi-Modal Governance Matrix

---

## 📁 项目目录结构 (Directory Structure)

```text
SDHY/
├── backend/                  # 后端 FastAPI & LangGraph 模块 (Port 8888)
│   ├── agents/               # 智能体定义与 Graph 编排 (8大智能体)
│   │   ├── graph.py          # StateGraph 工作流组装与 SSE 迭代器
│   │   ├── intent_agent.py   # 意图识别智能体 (含跨语言实体映射与小语种检测)
│   │   ├── memory_agent.py   # 分层记忆检索智能体 (L1/L2/L3 装配)
│   │   ├── knowledge_agent.py# 知识库路由智能体 (RAG 权威基准与多模态教具锁定)
│   │   ├── profile_agent.py  # 用户画像智能体
│   │   ├── orchestrator_agent.py # 编排策略智能体
│   │   ├── teaching_agent.py # 双语模板化教学回复智能体
│   │   ├── multimodal_agent.py # 跨语言多模态调度与教具直出智能体
│   │   ├── validator_agent.py # 质量与语言适切度验证智能体
│   │   └── state.py          # 智能体共享图状态定义 (AgentState)
│   ├── api/                  # RESTful 与 SSE 接口路由
│   │   ├── admin/            # 管理后台多维中台路由 (/api/admin/*)
│   │   │   ├── analytics.py  # 学情分析中心 API (概览/下钻/导出)
│   │   │   ├── growth.py     # 教学增长分析 API (规模/留存/热力)
│   │   │   ├── dashboard.py  # 管理控制台大屏 KPI 统计
│   │   │   ├── conversations.py # 对话审查与智能体推演轴
│   │   │   ├── users.py      # 用户与角色权限管理
│   │   │   ├── diagnosis.py  # AI 学情研判接口
│   │   │   ├── observability.py # 智能体可观测性接口
│   │   │   ├── system.py     # 系统配置与模型监控
│   │   │   └── auth.py       # 管理员鉴权与令牌校验
│   │   ├── chat.py           # 流式交互接口 /api/chat/stream
│   │   ├── users.py          # 用户注册/登录/Profile 接口 
│   │   ├── conversations.py  # 会话 CRUD 接口
│   │   └── knowledge.py      # 知识管理平台接口 (/api/knowledge/*)
│   ├── database/             # SQLAlchemy 异步连接与相对路径初始化
│   ├── models/               # ORM 数据模型 (User, Conversation, Message, ConversationSummary, UserLearningProfile, KnowledgeEntry, KnowledgeReview)
│   ├── services/             # 业务服务层
│   │   ├── analytics_service.py # 学情分析只读聚合引擎 (矩阵/排行/缺口)
│   │   ├── growth_service.py # 教学增长与留存分析 (Cohort留存/周热力)
│   │   ├── metrics_service.py# 指标口径基准与上海时区计算常量
│   │   ├── llm_service.py    # 大模型调用与提示词管理
│   │   ├── memory_service.py # L1/L2/L3 分层认知记忆管理
│   │   ├── knowledge_service.py # 权威知识库 RAG 检索
│   │   ├── media_service.py  # 多模态教具与简笔画调度
│   │   ├── video_service.py  # 微课教学短视频治理
│   │   ├── user_service.py   # 用户画像与权限管理
│   │   ├── admin_service.py  # 控制台数据治理服务
│   │   └── system_service.py # 系统状态监控服务
│   ├── tests/                # 自动化回归测试
│   │   └── test_learner_analytics.py # 学情分析专项回归测试
│   └── main.py               # FastAPI 启动入口
│
├── frontend/                 # 学员学习端前端 (Port 5175)
│   ├── public/favicon.svg    
│   └── src/
│       ├── components/       # Auth, Chat, Multimodal, Sidebar
│       ├── hooks/            # 自定义 Hook (useSSE.js 流式监听)
│       └── stores/           # Zustand (chatStore.js)
│
├── admin-frontend/           # 管理控制台中台前端 (Port 5174)
│   ├── public/favicon.svg    
│   └── src/
│       ├── components/       # 业务组件包
│       │   ├── Dashboard/    # 控制台全景概览大屏
│       │   ├── Analytics/    # 学情分析中心 (群体矩阵/高频疑点/采编缺口)
│       │   ├── Growth/       # 教学增长分析 (核心KPI/走势/母语/周热力)
│       │   ├── Diagnosis/    # AI 学情研判中心
│       │   ├── Observability/# 智能体观测中心
│       │   ├── AskData/      # AI 智能问数台
│       │   ├── Users/        # 学员与教职员工双Tab管理
│       │   ├── Conversations/# 全要素对话审查与推演轴
│       │   ├── Common/       # 纯矢量 SVG 统一图标库与模态弹窗
│       │   └── Settings/     # 系统监控与配置中心
│       ├── services/         # adminApi.js 后台接口请求封装
│       └── stores/           # Zustand (adminStore.js)
│
├── knowledge-frontend/       # 知识管理平台前端 (Port 5176)
│   ├── public/favicon.svg    
│   └── src/
│       ├── components/       # Auth, Collector (采集), Reviewer (审核), Admin (治理)
│       ├── services/         # knowledgeApi.js 知识中台接口请求
│       ├── stores/           # Zustand (authStore.js)
│       └── utils/date.js     # 本地时区时间格式化器
│
├── docs/                     # 架构设计与规划方案文档
├── uploads/                  # 静态文件存储目录 (生成的简笔画与微课视频)
├── data/                     # 数据库存储目录 (sdhy.db)
├── .env                      # 环境变量配置文件
├── README.md                 # 项目完整主说明文档
├── CHANGELOG.md              # 项目全局全版本更新日志
├── MODULE1_CHANGELOG.md      # 模块一：学情分析中心变更记录
├── MODULE2_CHANGELOG.md      # 模块二：教学增长分析变更记录
└── ROADMAP.md                # 未来演化与技术需求路线图
```

---

## 🚀 快速启动 (Quick Start)

### 1. 环境准备与配置
- Python 3.10+ & Node.js 18+
- 根目录 `.env` 文件配置：
```env
DEFAULT_LLM_API_KEY=your_dashscope_api_key
DEFAULT_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_LLM_MODEL_NAME=qwen3-max
JWT_SECRET=your_jwt_secret_key
ADMIN_SECRET_KEY=your_admin_secret_key       # 管理端管理员注册秘钥，请自行设定安全口令
KNOWLEDGE_SECRET_KEY=your_knowledge_key     # 知识平台成员注册秘钥，请自行设定安全口令
```

### 2. 启动后端 (Port 8888)
```bash
# 激活环境并安装依赖
pip install -r backend/requirements.txt

# 启动 FastAPI 服务（端口 8888）
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8888 --reload
```

### 3. 启动学员学习端 (Port 5175)
```bash
cd frontend
npm install
npm run dev
```
访问：`http://localhost:5175`

### 4. 启动管理控制台 (Port 5174)
```bash
cd admin-frontend
npm install
npm run dev
```
访问：`http://localhost:5174` （注册需输入 `.env` 中设定的 `ADMIN_SECRET_KEY`）

### 5. 启动知识管理平台 (Port 5176)
```bash
cd knowledge-frontend
npm install
npm run dev
```
访问：`http://localhost:5176` （注册需输入 `.env` 中设定的 `KNOWLEDGE_SECRET_KEY`，支持管理员、审核员、采集员）

---

## 📜 许可证 (License)

本项目遵循 MIT 许可证开源。

#   S D H Y  
 #   S D H Y  
 