from backend.agents.state import AgentState
from backend.services.llm_service import get_llm
from backend.services.video_service import search_bilibili_videos
import json
import datetime

async def multimodal_agent(state: AgentState):
    start_event = {
        "agent": "multimodal_agent",
        "status": "start",
        "message": "正在分析多模态资源需求，优先调配知识库本地简笔画与微课视频...",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events = list(state.get("agent_events", [])) + [start_event]

    user_input = state.get("user_input", "")
    knowledge_context = state.get("knowledge_context", {})
    kb_hit = knowledge_context.get("hit", False)
    primary_entry = knowledge_context.get("primary_entry", {})

    # 判断用户是否询问笔顺/书写相关（支持跨语言多语种提问）
    stroke_keywords = [
        "笔顺", "笔画", "怎么写", "书写", "写法", "写字", "如何写",
        "stroke", "strokes", "stroke order", "how to write", "how do you write", "how to spell",
        "write", "writing", "handwriting", "character order", "order of stroke",
        "comment écrire", "écrire", "écriture",
        "cómo se escribe", "escribir",
        "kwandika", "amategeko yo kwandika"
    ]
    user_asks_stroke = any(kw in user_input.lower() for kw in stroke_keywords)

    # 提取意图中的跨语言目标中文词汇或知识库词条
    intent = state.get("intent", {})
    target_words = intent.get("target_chinese_words", [])
    candidate_chinese = list(target_words)
    if kb_hit and primary_entry and primary_entry.get("word"):
        if primary_entry["word"] not in candidate_chinese:
            candidate_chinese.insert(0, primary_entry["word"])
    candidate_str = ", ".join(candidate_chinese) if candidate_chinese else "无（请从用户提问语义中自动翻译映射）"

    prompt = f"""你是国际中文教育多模态教学资源匹配与学习路径专家。请根据用户的提问（无论用户使用中文还是外语/母语提问），提取或翻译出对应的【目标中文词汇或汉字】，并判断适合调配哪些多模态教具资源（语音朗读、笔顺动画、词汇配图、教学微课视频）。

用户提问内容："{user_input}"
系统对齐候选目标中文词：{candidate_str}
用户是否在询问笔顺/书写写法：{"是" if user_asks_stroke else "否"}

请严格输出 JSON（不要输出其他任何内容）：
{{
  "multimodal_items": [
    {{
      "word": "目标中文词汇",
      "pinyin": "cí huì",
      "pinyin_tones": ["ci2", "hui4"],
      "type": ["audio"],
      "characters_for_stroke": [],
      "image_keyword": "词汇中英文名称"
    }}
  ],
  "video_keywords": "中文学习 相关主题",
  "suggested_questions": [
    "延伸推荐问题1",
    "延伸推荐问题2",
    "延伸推荐问题3"
  ]
}}

【核心规则与跨语言提取指引】：
1. 跨语言实体对齐：若用户是用英语、法语、卢旺达语等外语母语提问（如 "What is Chongqing noodles?" 或 "How to write tea?"），必须将实体准确映射为中文词汇（如 "小面" 或 "茶"），填入 word，并标注准确拼音！
2. 笔顺动画规则 (stroke_order)：
   - 当用户询问笔顺/书写/怎么写时（"是"），type 必须包含 "stroke_order"，并在 characters_for_stroke 中列出要书写的每一个单个汉字（如 ["茶"] 或 ["小", "面"]）！
   - 若用户未询问笔顺，严禁标记 "stroke_order"，characters_for_stroke 必须保持为空！
3. 词汇配图规则 (image)：
   - 当词汇是具体具象的名词（食物、动物、水果、日常用品、交通工具等）时标记 "image"，并在 image_keyword 写上该物体的中英文名称（如 "tea" 或 "茶"）；抽象词、问候语或纯语法不标记 "image"。
4. 语音朗读 (audio)：用户询问的核心词汇默认赋予 "audio"。
5. video_keywords：根据提问生成适合中文教学的短视频搜索关键词。
6. suggested_questions：结合学员语言背景预测 3 个延伸问题，保持亲切自然。若用户用卢旺达语提问，推荐问题必须包含【正确卢旺达语 + 中文】形式，严禁使用斯瓦希里语！
/no_think"""

    multimodal_data = {"multimodal_items": [], "videos": [], "suggested_questions": []}

    try:
        llm = get_llm()
        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        parsed = json.loads(content.strip())

        if isinstance(parsed.get("multimodal_items"), list):
            multimodal_data["multimodal_items"] = parsed["multimodal_items"]

        if isinstance(parsed.get("suggested_questions"), list):
            multimodal_data["suggested_questions"] = [str(q) for q in parsed["suggested_questions"][:3]]

        # 笔顺字符一致性后处理
        for item in multimodal_data["multimodal_items"]:
            if user_asks_stroke:
                if "stroke_order" not in item.get("type", []):
                    item["type"].append("stroke_order")
                if not item.get("characters_for_stroke"):
                    c_chars = [c for c in item.get("word", "") if '\u4e00' <= c <= '\u9fff']
                    item["characters_for_stroke"] = c_chars
            else:
                if "stroke_order" in item.get("type", []):
                    item["type"] = [t for t in item["type"] if t != "stroke_order"]
                item["characters_for_stroke"] = []

        video_keywords = parsed.get("video_keywords", "")
    except Exception as e:
        multimodal_data["multimodal_items"] = []
        multimodal_data["suggested_questions"] = [
            f"关于“{user_input[:8]}”有什么常见用法？",
            f"给我出2道相关练习题",
            f"这个知识点在HSK几级出现？"
        ]
        video_keywords = "中文学习 " + user_input[:10]

    # 兜底保障：若 items 为空，但有候选中文词或知识库词条，自动补全
    if not multimodal_data.get("multimodal_items"):
        fallback_words = candidate_chinese if candidate_chinese else []
        if not fallback_words:
            import re
            fallback_words = re.findall(r'[\u4e00-\u9fff]{1,4}', user_input)
        for w in fallback_words[:2]:
            c_chars = [c for c in w if '\u4e00' <= c <= '\u9fff']
            item = {
                "word": w,
                "pinyin": primary_entry.get("pinyin", "") if (kb_hit and primary_entry.get("word") == w) else "",
                "pinyin_tones": [],
                "type": ["audio"],
                "characters_for_stroke": c_chars if user_asks_stroke else [],
                "image_keyword": w
            }
            if user_asks_stroke and c_chars:
                item["type"].append("stroke_order")
            multimodal_data["multimodal_items"].append(item)

    # ==================== 知识库多模态资源优先直出挂载 ====================
    local_asset_types = []

    if kb_hit and primary_entry:
        kb_word = primary_entry.get("word", "")
        kb_img = primary_entry.get("image_content") or {}
        kb_vid = primary_entry.get("video_content") or {}

        # 1. 优先直出本地黑白简笔画
        if primary_entry.get("has_local_image") and kb_img.get("url"):
            local_asset_types.append("手绘简笔画")
            # 查找或插入对应词汇条目
            existing_item = next((it for it in multimodal_data["multimodal_items"] if it.get("word") == kb_word), None)
            if existing_item:
                if "image" not in existing_item.get("type", []):
                    existing_item["type"].append("image")
                existing_item["local_image_url"] = kb_img["url"]
                existing_item["image_source"] = "knowledge_base"
                if not existing_item.get("image_keyword"):
                    existing_item["image_keyword"] = kb_word
                if user_asks_stroke and not existing_item.get("characters_for_stroke"):
                    existing_item["characters_for_stroke"] = [c for c in kb_word if '\u4e00' <= c <= '\u9fff']
                    if "stroke_order" not in existing_item.get("type", []):
                        existing_item["type"].append("stroke_order")
            else:
                multimodal_data["multimodal_items"].insert(0, {
                    "word": kb_word,
                    "pinyin": primary_entry.get("pinyin", ""),
                    "pinyin_tones": [],
                    "type": ["audio", "image"] + (["stroke_order"] if user_asks_stroke else []),
                    "characters_for_stroke": [c for c in kb_word if '\u4e00' <= c <= '\u9fff'] if user_asks_stroke else [],
                    "image_keyword": kb_word,
                    "local_image_url": kb_img["url"],
                    "image_source": "knowledge_base"
                })

        # 2. 优先直出本地 15s 教学微课视频
        if primary_entry.get("has_local_video") and kb_vid.get("url"):
            local_asset_types.append("15s微课视频")
            local_video_entry = {
                "title": f"【官方微课】{kb_word} 情境教学视频",
                "author": "师道汉韵教学教研室",
                "duration": f"0:{kb_vid.get('duration', 15)}",
                "is_local": True,
                "video_url": kb_vid["url"],
                "source_type": "knowledge_base",
                "cover": kb_img.get("url", "")
            }
            # 本地视频置顶
            multimodal_data["videos"].insert(0, local_video_entry)

    # 3. 若知识库没有本地视频，执行兜底视频推荐
    if not any(v.get("is_local") for v in multimodal_data.get("videos", [])):
        try:
            curated_videos = await search_bilibili_videos(video_keywords, count=2)
            multimodal_data["videos"].extend(curated_videos)
        except Exception:
            pass

    item_count = len(multimodal_data.get("multimodal_items", []))
    video_count = len(multimodal_data.get("videos", []))
    question_count = len(multimodal_data.get("suggested_questions", []))

    asset_desc = f"（已直出知识库：{'+'.join(local_asset_types)}）" if local_asset_types else ""
    complete_event = {
        "agent": "multimodal_agent",
        "status": "complete",
        "message": f"🎨 多模态就绪{asset_desc}：{item_count}个词汇教具 + {video_count}部微课视频 + {question_count}个延伸推荐",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    events.append(complete_event)
    return {"multimodal_data": multimodal_data, "agent_events": events}
