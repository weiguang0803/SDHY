from backend.agents.state import AgentState
from backend.services.llm_service import get_llm
import json
import datetime

async def intent_agent(state: AgentState):
    start_event = {
        "agent": "intent_agent",
        "status": "start",
        "message": "正在进行用户意图识别与语言检测...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]
    
    prompt = """你是国际中文教育系统的意图识别、跨语言对齐与小语种检测专家。请分析用户的输入，识别意图类型、使用语言，并精准提取或映射出用户关心的核心目标中文词汇。

用户输入：{user_input}

【关键规则】：
1. 语言检测：
   - 若输入包含卢旺达语词汇（如 Muraho, Amakuru, Bite, Murakoze, Ndashaka, Igichinwa, Yego, Oya 等），请识别为 "Kinyarwanda/卢旺达语"。
   - ⚠️ 绝对不要将卢旺达语误识别为斯瓦希里语 (Swahili/Kiswahili)！两者属于同语族但完全不同的语言。
2. 跨语言实体映射 (target_chinese_words - 核心极其关键)：
   - 无论用户是用中文、英文还是其他母语（法文、西文、卢旺达语等）提问，都必须分析出用户意图所指向的【目标中文词汇或汉字】！
   - 例如：
     * "What is Chongqing noodles?" -> target_chinese_words: ["小面", "重庆小面"]
     * "How do you write 'tea' in Chinese?" -> target_chinese_words: ["茶"]
     * "Tell me about panda" -> target_chinese_words: ["熊猫"]
     * "What does 抄手 mean?" -> target_chinese_words: ["抄手"]
     * "Comment dit-on merci en chinois ?" -> target_chinese_words: ["谢谢"]
     * "Muraho, nigute bavuga ikawa mu gishinwa?" -> target_chinese_words: ["咖啡"]
   - 若是纯中文输入，直接提取其中的核心词汇或语法点。
   - 若用户无明确指代词汇，则填入空数组 []。

严格按 JSON 格式输出：
{{
    "type": "<question|practice|correction|resource|conversation|assessment>",
    "language": "<Detected Language>",
    "knowledge_points": ["相关知识点"],
    "target_chinese_words": ["目标中文词汇1", "目标中文词汇2"],
    "difficulty": "beginner",
    "description": "简要描述"
}}""".format(user_input=state['user_input'])
    
    try:
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        intent_data = json.loads(content.strip())
        if not isinstance(intent_data.get("target_chinese_words"), list):
            intent_data["target_chinese_words"] = []
    except Exception:
        import re
        c_words = re.findall(r'[\u4e00-\u9fff]{2,4}', state['user_input'])
        intent_data = {
            "type": "question",
            "language": "Auto",
            "knowledge_points": c_words if c_words else ["基础中文概念"],
            "target_chinese_words": c_words if c_words else [],
            "difficulty": "beginner",
            "description": "自动推导知识问答意图"
        }
    
    kp_text = ", ".join(intent_data.get('knowledge_points', [])) or "基础概念"
    tw_list = intent_data.get('target_chinese_words', [])
    tw_text = f" ｜ 映射目标中文词：{', '.join(tw_list)}" if tw_list else ""
    lang_info = intent_data.get('language', '')
    lang_desc = f" ｜ 检测语言：{lang_info}" if lang_info else ""
    
    complete_event = {
        "agent": "intent_agent",
        "status": "complete",
        "message": f"🎯 意图识别为：{intent_data.get('type', 'question')}{lang_desc} ｜ 核心知识点：{kp_text}{tw_text}",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {"intent": intent_data, "agent_events": events}
