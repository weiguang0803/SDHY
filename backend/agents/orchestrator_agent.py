from backend.agents.state import AgentState
from backend.services.llm_service import get_llm
import json
import datetime

async def orchestrator_agent(state: AgentState):
    start_event = {
        "agent": "orchestrator_agent",
        "status": "start",
        "message": "正在分析输入与画像，制定动态个性化中文教学策略...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]
    
    user_input = state.get("user_input", "")
    user_input_lower = user_input.lower()
    intent = state.get("intent", {})
    profile = state.get("user_profile", {})
    native_lang = profile.get('native_lang', 'English')
    level = profile.get('level', '初学者')

    intent_lang = str(intent.get('language', '')).lower()
    kinyarwanda_kw = ["muraho", "amakuru", "bite", "murakoze", "kwiga", "igichinwa", "yego", "oya", "kinyarwanda", "rwanda", "ndashaka"]
    is_kinyarwanda_input = any(kw in user_input_lower for kw in kinyarwanda_kw) or "kinyarwanda" in intent_lang or "卢旺达" in intent_lang

    # 动态确定保底语言模式（优先准确识别卢旺达语与僧伽罗语）
    lang_str = str(native_lang).lower()
    if is_kinyarwanda_input or "rwanda" in lang_str or "kinyarwanda" in lang_str or "卢旺达" in str(native_lang) or "kinyarwanda" in intent_lang or "卢旺达" in intent_lang:
        fallback_lang = "中卢双语(中文+卢旺达语/Kinyarwanda)"
    elif "sinhala" in lang_str or "僧伽罗" in str(native_lang):
        fallback_lang = "中僧双语(中文+僧伽罗语/Sinhala)"
    elif any("\u3040" <= c <= "\u30ff" for c in user_input) or "japan" in lang_str or "日" in str(native_lang):
        fallback_lang = "中日双语"
    elif any("\uac00" <= c <= "\ud7a3" for c in user_input) or "korea" in lang_str or "韩" in str(native_lang):
        fallback_lang = "中韩双语"
    elif "french" in lang_str or "法" in str(native_lang):
        fallback_lang = "中法双语"
    elif "spanish" in lang_str or "西" in str(native_lang):
        fallback_lang = "中西双语"
    elif "russian" in lang_str or "俄" in str(native_lang):
        fallback_lang = "中俄双语"
    elif "german" in lang_str or "德" in str(native_lang):
        fallback_lang = "中德双语"
    elif "chinese" in lang_str or "中文" in str(native_lang):
        fallback_lang = "全中文"
    else:
        fallback_lang = "中英双语"
    
    prompt = f"""你是国际中文教育的主控编排专家。请结合用户的注册母语、知识水平以及用户当前输入的具体语言，制定个性化的中文教学策略。

用户注册画像：水平={level}, 母语={native_lang}
用户提问内容："{user_input}"
用户意图分析：类型={intent.get('type', 'question')}, 语言={intent.get('language', '')}, 知识点={", ".join(intent.get('knowledge_points', []))}

【关键语言模式判定与小语种防混淆规则】：
1. 观察用户提问内容与注册母语（{native_lang}）。
2. ⚠️【卢旺达语 (Kinyarwanda) 严禁误判】：
   - 卢旺达语（Kinyarwanda）是卢旺达官方语言。绝对不能误判或混淆为斯瓦希里语（Kiswahili/Swahili）！
   - 若用户的注册母语是卢旺达语或提问包含卢旺达语词汇，目标语言模式必须确定为："中卢双语(中文+卢旺达语/Kinyarwanda)"。
3. 确定回复语言模式（例如：中卢双语、中僧双语、中日双语、中英双语、全中文等）。

输出 JSON 格式（严格 JSON，不要包含其它任何文本）：
{{
    "approach": "讲解与对比示范",
    "focus": "针对用户母语语序与习惯的针对性讲解",
    "language": "{fallback_lang}",
    "examples_needed": true,
    "difficulty_level": "{level}"
}}

/no_think"""
    
    try:
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        strategy = json.loads(content.strip())
    except Exception:
        strategy = {
            "approach": "动态对比教学",
            "focus": f"针对{fallback_lang}学习者的偏误分析与例句示范",
            "language": fallback_lang,
            "examples_needed": True,
            "difficulty_level": level
        }
        
    complete_event = {
        "agent": "orchestrator_agent",
        "status": "complete",
        "message": f"🎭 制定策略：{strategy.get('approach', '讲解')} ｜ 语言模式：{strategy.get('language', fallback_lang)}",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {"teaching_strategy": strategy, "agent_events": events}
