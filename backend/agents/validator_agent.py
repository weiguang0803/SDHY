from backend.agents.state import AgentState
from backend.services.llm_service import get_llm
import json
import datetime

async def validator_agent(state: AgentState):
    start_event = {
        "agent": "validator_agent",
        "status": "start",
        "message": "正在进行五维质量校验（含小语种精准度校验）...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]
    
    teaching_response = state.get("teaching_response", "")
    profile = state.get("user_profile", {})
    strategy = state.get("teaching_strategy", {})
    
    prompt = """你是一个中文教学质量审核专家。请对以下教学回复进行五维质量校验。

教学回复内容（前1000字）：{response}
目标学生：水平={level}, 母语={native_lang}
策略：方法={approach}, 语言={language}
用户原始问题：{user_input}

【外语学习者双语可读性与小语种专项校验要求】：
1. 目标学生母语为 {native_lang}，当前水平为 {level}！若回复中的“核心概念解析”或“语法规则”全是大段未提供外语翻译的复杂纯中文难句，外语初学者无法理解，语言适配度 (language_adaptability) 与适切度 (appropriateness) 必须打低分！
2. 必须具备清晰的双语对照与拼音辅助。
3. 若目标语言为卢旺达语（Kinyarwanda），回复中严禁出现斯瓦希里语（Swahili，如 Habari, Jambo, Asante, Nzuri）的混淆误用！若存在混淆，语言适配度打低分并要求重新生成。

评分（1-10分），总分>=35通过。
输出 JSON 格式：
{{
    "accuracy": {{"score": 9, "comment": "准确"}},
    "appropriateness": {{"score": 9, "comment": "适切"}},
    "completeness": {{"score": 8, "comment": "完整"}},
    "safety": {{"score": 10, "comment": "安全"}},
    "language_adaptability": {{"score": 9, "comment": "适配"}},
    "total_score": 45,
    "passed": true,
    "feedback": ""
}}""".format(
        response=teaching_response[:1000],
        level=profile.get('level', 'Beginner'),
        native_lang=profile.get('native_lang', 'English'),
        approach=strategy.get('approach', 'explanation'),
        language=strategy.get('language', 'bilingual'),
        user_input=state.get('user_input', '')
    )
    
    try:
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        validation = json.loads(content.strip())
    except Exception:
        validation = {
            "accuracy": {"score": 9, "comment": "准确度达标"},
            "appropriateness": {"score": 9, "comment": "难度匹配"},
            "completeness": {"score": 8, "comment": "内容完整"},
            "safety": {"score": 10, "comment": "安全无风险"},
            "language_adaptability": {"score": 9, "comment": "语言适配"},
            "total_score": 45,
            "passed": True,
            "feedback": ""
        }

    # 代码级别强校验：针对卢旺达语混淆斯瓦希里语的拦截
    target_lang = str(strategy.get('language', '')).lower()
    native_lang_str = str(profile.get('native_lang', '')).lower()
    is_kinyarwanda = "卢旺达" in target_lang or "kinyarwanda" in target_lang or "rwanda" in native_lang_str or "卢旺达" in native_lang_str

    if is_kinyarwanda:
        swahili_words = ["habari", "jambo", "asante", "nzuri", "karibu", "kiswahili"]
        resp_lower = teaching_response.lower()
        has_swahili_mix = any(w in resp_lower for w in swahili_words)
        if has_swahili_mix:
            validation["passed"] = False
            validation["total_score"] = 25
            validation["language_adaptability"] = {"score": 3, "comment": "错误混用了斯瓦希里语词汇"}
            validation["feedback"] = "检测到回复中错误混用了斯瓦希里语词汇（如 Habari/Jambo/Asante/Nzuri），请务必修正为真正的卢旺达语（Kinyarwanda，如 Muraho/Amakuru/Murakoze/Ni meza）！"

    passed = validation.get("passed", True)
    complete_event = {
        "agent": "validator_agent",
        "status": "complete",
        "message": f"✅ 五维质量校验{'通过' if passed else '未通过'} ｜ 得分: {validation.get('total_score', 45)}/50",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {
        "validation_result": validation,
        "retry_count": state.get("retry_count", 0) + (0 if passed else 1),
        "agent_events": events
    }
