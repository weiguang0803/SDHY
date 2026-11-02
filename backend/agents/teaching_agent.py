from backend.agents.state import AgentState
from backend.services.llm_service import get_llm
import datetime

async def teaching_agent(state: AgentState):
    start_event = {
        "agent": "teaching_agent",
        "status": "start",
        "message": "正在根据个性化策略、知识库基准与分层记忆生成双语教学内容...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]
    
    strategy = state.get("teaching_strategy", {})
    intent = state.get("intent", {})
    profile = state.get("user_profile", {})
    
    # 1. L1 短期工作记忆上下文
    context_text = "无"
    if state.get("short_term_memory"):
        recent = state["short_term_memory"][-4:]
        lines = ["{}: {}".format(m.get('role', 'user'), m.get('content', '')) for m in recent]
        context_text = "最近对话：\n" + "\n".join(lines)
    
    # 2. L2 情景动态记忆 (摘要)
    episodic_memory = state.get("episodic_memory", {})
    episodic_prompt = ""
    if episodic_memory.get("current_session_summary"):
        episodic_prompt = f"\n【情景学习脉络摘要】：{episodic_memory['current_session_summary']}\n"
    
    # 3. L3 长期持久画像 (易错偏误追踪)
    profile_memory = state.get("profile_memory", {})
    weak_points_list = profile_memory.get("weak_points", [])
    weak_prompt = ""
    if weak_points_list:
        weak_str = "、".join([f"{w.get('point')}(偏误{w.get('error_count',1)}次)" for w in weak_points_list[:3]])
        weak_prompt = f"\n⚠️【学员历史高频薄弱点防范】：学员曾在【{weak_str}】上出现偏误，请在释义或互动练习中进行针对性巩固与避坑指引！\n"

    # 4. 教学知识库命中与约束 (Knowledge RAG)
    knowledge_context = state.get("knowledge_context", {})
    knowledge_prompt = ""
    if knowledge_context.get("hit"):
        knowledge_prompt = f"""
{knowledge_context.get('prompt_context', '')}

⚠️【官方知识管理库权威基准使用准则（最高优先级）】：
1. 核心概念、拼音与语法释义必须严格基于上述知识库标准，例句示范优先采用知识库教材例句与口语例句！
2. 必须将知识库提供的英文释义（Translation）和例句译文完整融入回复中，严禁遗漏外语对照！
"""

    validation_feedback = ""
    if state.get("retry_count", 0) > 0 and state.get("validation_result"):
        feedback = state["validation_result"].get("feedback", "")
        validation_feedback = "\n\n⚠️ 上一次回复未通过验证，请改进以下方面：" + feedback
    
    kp_list = intent.get('knowledge_points', [])
    kp_str = ", ".join(kp_list) if kp_list else "通用知识"
    target_language = strategy.get('language', '中英双语')
    native_lang = profile.get('native_lang', 'English')
    level = profile.get('level', '初学者')
    intent_type = intent.get('type', 'question')

    # 针对卢旺达语的特别防混淆提示
    kinyarwanda_instructions = ""
    if "卢旺达" in target_language or "kinyarwanda" in target_language.lower() or "rwanda" in native_lang.lower() or "卢旺达" in native_lang:
        kinyarwanda_instructions = """
⚠️【关键防错提醒：卢旺达语 (Kinyarwanda) 严禁混淆斯瓦希里语 (Swahili)】：
1. 绝对不要使用斯瓦希里语词汇（如 Habari, Jambo, Asante, Nzuri, Karibu, Kiswahili）！斯瓦希里语不是卢旺达语！
2. 必须使用真正的卢旺达语（Kinyarwanda）对齐词汇：
   - 问候/你好：Muraho / Amakuru (你好吗) / Bite
   - 谢谢：Murakoze (对多人/尊称) / Urakoze
   - 再见：Murabeho
   - 很好：Ni meza / Ni byiza
   - 汉语/中文：Igichinwa / Igishenwa
   - 是/不是：Yego / Oya
3. 在所有 Markdown 双语例句与讲解中，必须提供精准的【中文 + 拼音 + 正确卢旺达语】三行或对照格式。
"""

    # 针对不同意图类型，匹配固定的标准化双语 Markdown 模块模板
    if intent_type == 'correction':
        template_instructions = f"""【必须严格使用的 5 大固定双语 Markdown 模块结构】：
### 📝 1. 纠错对比 | Error Correction
- ❌ 原句 (Your sentence)：...
- ✅ 正确表达 (Correct form)：... [标注准确拼音与 {target_language} 翻译]

### 🔍 2. 偏误原因解析 | Why is it wrong?
[必须使用学习者看得懂的母语/目标语言（{target_language}）详细解释错误原因，对比 {native_lang} 与汉语在语序或词义上的区别]

### 💡 3. 标准用法规则 | Grammar Formula
[给出简明结构公式，使用中英/双语标签如 Subject (主语) + Verb (动词)，配以 {target_language} 说明]

### 🌟 4. 巩固双语例句 | Practice Examples
[提供2-3个同类型正确例句，严格遵循三行格式：1.中文 2.拼音 3.{target_language} 准确翻译]

### 🎯 5. 举一反三互动小练习 | Quick Practice
[出1道同类型纠错或填空练习题，题目附带拼音和 {target_language} 翻译，并在末尾亲切引导学生作答]"""

    elif intent_type in ['conversation', 'practice']:
        template_instructions = f"""【必须严格使用的 4 大固定双语 Markdown 模块结构】：
### 🎭 1. 情境对话示范 | Dialogue Practice
[角色情境对话，每句严格提供三行：1.中文角色台词 2.拼音 3.{target_language} 精准对照]

### 🔑 2. 核心表达词汇卡 | Key Vocabulary
[列出对话中用到的3-5个核心词汇表达，格式：**词汇** (拼音) - {target_language} 释义]

### 💡 3. 跨文化与交际技巧 | Cultural & Usage Notes
[使用 {target_language} 针对 {native_lang} 母语背景学生讲解日常交际习惯与文化细节]

### 💬 4. 轮到你了 (互动挑战) | Your Turn
[设定一个开放式情境问题，题目必须附带拼音与 {target_language} 翻译，给出参考句型模板，引导学生尝试作答]"""

    elif intent_type == 'assessment':
        template_instructions = f"""【必须严格使用的 4 大固定双语 Markdown 模块结构】：
### 📊 1. 汉语水平诊断 | Proficiency Assessment
[针对 {level} 水平的能力诊断，采用 {target_language} 双语对比分析]

### 🎯 2. 强弱项分析 | Strengths & Weaknesses
[结合 {native_lang} 母语特点用 {target_language} 阐述学习优势与难点]

### 📚 3. 阶段学习路线规划 | Learning Roadmap
[按听、说、读、写划分的针对性突破建议，配双语说明]

### 💡 4. 行动方案与推荐资源 | Action Plan & Resources
[推荐适合该水平的练习方式与资源]"""

    else:  # default: question / resource / general
        template_instructions = f"""【必须严格使用的 5 大固定双语 Markdown 模块结构】：
### 💡 1. 核心概念解析 | Core Concept
- **核心词汇/表达**：**词汇** (拼音 / pīnyīn)
- **核心释义 (Definition in {native_lang})**：[用清晰简明的一句话母语/英文说明是什么]
- **双语解读 (Explanation)**：[用简单的中文简述含义，并在下方立即附上精准的 {target_language} 对照翻译！严禁出现大段未经翻译的纯中文难句！]

### 📖 2. 语法与用法规则 | Grammar & Usage Rules
[给出简明结构公式，语法词性标签采用双语（如 Noun 名词, Verb 动词, Subject 主语等），规则说明与使用场景必须配有清晰的 {target_language} 翻译对照！]

### 🎯 3. 实用双语例句示范 | Example Sentences
[提供3-4个实用高频例句，严格遵循三行标准格式]：
1. 中文句子
   zhōngwén jùzi (准确拼音)
   English/Target translation (精准译文)

### ⚠️ 4. 偏误防范与易错提示 | Common Mistakes & Tips
[从 {native_lang} 母语者的思维习惯出发，用学生看得懂的 {target_language} 明确指出容易误解或错用的地方（如直译误区、拼音混淆、语法搭配误区）]

### 💬 5. 互动巩固小练习 | Practice Challenge
[提供1道针对该知识点的小练习题。注意：题目内容必须附带拼音和 {target_language} 翻译！给出的答题句型模板也必须附带双语提示，让初学者能看懂并能轻松套用作答！]"""

    prompt = f"""你是一位享誉国际的对外汉语金牌教师，名叫"师道汉韵老师"。你的学生是【国际中文二语学习者 / 留学生】，而非母语为中文的中国人！请严格按照教学策略与固定双语模块模板为学生生成高质量的教学回复。

【学生画像】：当前水平={level}, 注册母语={native_lang}
【教学策略】：教学法={strategy.get('approach', '讲解')}, 语言模式={target_language}, 难度适合={strategy.get('difficulty_level', 'beginner')}
【用户意图】：类型={intent_type}, 核心知识点={kp_str}
【对话上下文】：
{context_text}
{episodic_prompt}
{weak_prompt}
{knowledge_prompt}

用户当前输入：{state['user_input']}
{validation_feedback}
{kinyarwanda_instructions}

{template_instructions}

【🔥 对外汉语教学极其关键的全局生成铁律（必须100%严格执行）】：
1. 必须使用上面指定的固定双语 H3 标题（如 `### 💡 1. 核心概念解析 | Core Concept`），标题文字不得随意更改！
2. ⚠️【严禁输出纯中文长难句与学术生僻术语】：学生的母语是 {native_lang}，当前处于 {level} 阶段！如果你在第1、2、4、5部分输出大段深奥纯中文，学生完全看不懂！所有讲解、概念定义、语法规则、易错分析、练习题题目都必须提供【中文（带拼音）+ 地道准确的 {target_language}（如英语）对照翻译】！
3. 【模块1与模块2的翻译深度】：概念解释必须以学生母语（{native_lang}）为主导进行清晰定义；语法公式中的词性严禁用“定语中心词”等深奥语文术语，使用国际通行的词性标签如 Noun (名词)、Verb (动词)、Subject (主语) 并配以英文说明。
4. 【例句三行格式】：第3部分例句必须严格按照“第一行中文，第二行拼音，第三行 {target_language} 翻译”的标准格式排版，行与行之间清晰美观。
5. 【练习必须可看懂】：第5部分互动题目的题干和引导语必须带拼音和翻译，确保学生能读懂要求并尝试互动。
6. 若上方命中了官方教学知识库，释义与例句必须优先采用知识库标准，保证权威性与规范性！"""

    try:
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        teaching_response = response.content
    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg or "401" in error_msg:
            teaching_response = (
                "⚠️ **大模型 API Key 校验失败 (401 Invalid API Key)**\n\n"
                "检测到当前 `.env` 中的阿里云 DashScope API Key 已失效或不正确。\n\n"
                "**【教学演示模式 Fallback】**\n"
                f"针对您的输入「**{state['user_input']}**」，师道汉韵智能协同系统已完成以下推演：\n"
                f"- 🎯 **意图**：{intent.get('type', '对话')}（{kp_str}）\n"
                f"- 👤 **画像**：{level}｜{native_lang}母语\n"
                f"- 🎭 **策略**：{strategy.get('approach', '讲解')}｜{target_language}\n"
                f"- 📚 **知识库**：{'已命中标准词库' if knowledge_context.get('hit') else '通用智能模式'}\n\n"
                "💡 **修复指引**：请在项目根目录 `.env` 文件中更新有效的 `DEFAULT_LLM_API_KEY` 即可恢复完整大模型生成。"
            )
        else:
            teaching_response = f"⚠️ 教学回复生成遭遇异常：{error_msg}\n\n针对您的提问「{state['user_input']}」，请稍后重试。"

    kb_info = "（知识库直出）" if knowledge_context.get("hit") else ""
    complete_event = {
        "agent": "teaching_agent",
        "status": "complete",
        "message": f"教学内容生成完成{kb_info}（模板：{intent_type} ｜ 双语模式：{target_language}）",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {"teaching_response": teaching_response, "agent_events": events}
