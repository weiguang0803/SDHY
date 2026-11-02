import os
import time
import json
import uuid
import logging
import httpx
from pathlib import Path
from backend.config import settings, UPLOADS_DIR
from backend.services.llm_service import get_llm

logger = logging.getLogger(__name__)

DEFAULT_IMAGE_PROMPT_TEMPLATE = (
    "生成一张适合成人留学生对外汉语教学的黑白线稿简笔画，画面内容为{subject}，"
    "纯线条勾勒、无阴影，线条简洁流畅、干净利落，造型简化准确、写实不夸张，"
    "主体清晰突出，纯白色背景，无多余装饰，仅用线条勾勒轮廓，"
    "可添加简单斜线阴影增强立体感，画面干净整洁、易识别，"
    "适合汉语初学者学习使用的教学插图。"
)

async def generate_entry_text_content(word: str, category: str = "词汇", hsk_level: str = "初学者") -> dict:
    """使用大模型一键生成词条结构化文本内容"""
    llm = get_llm()
    prompt = f"""你是一名资深的国际中文教育专家。请针对对外汉语学习者，为词条【{word}】（类别：{category}，适用等级：{hsk_level}）生成权威、标准的结构化教学文本。

请严格输出 JSON 格式（不要包含任何 markdown 代码块外部的杂质）：
{{
    "pinyin": "拼音及准确声调",
    "translation": "精准的英文释义与核心译文",
    "explanation": "简明清晰的汉语词条释义与词性语法说明，适合第二语言学习者理解",
    "textbook_examples": [
        {{"chinese": "规范教材例句1", "pinyin": "例句拼音", "translation": "英文翻译"}},
        {{"chinese": "规范教材例句2", "pinyin": "例句拼音", "translation": "英文翻译"}}
    ],
    "daily_examples": [
        {{"chinese": "真实口语交比例句1", "pinyin": "例句拼音", "translation": "英文翻译"}},
        {{"chinese": "真实口语交比例句2", "pinyin": "例句拼音", "translation": "英文翻译"}}
    ],
    "topic_reading": "一段围绕该词条展开的简短趣味文化/生活主题短文（50-100字），附带拼音指导与阅读理解点拨"
}}

/no_think"""
    response = await llm.ainvoke(prompt)
    content = response.content
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    try:
        data = json.loads(content.strip())
        return data
    except Exception as e:
        logger.error(f"Failed to parse generated text JSON: {e}")
        return {
            "pinyin": "",
            "translation": "",
            "explanation": f"关于【{word}】的教学释义",
            "textbook_examples": [{"chinese": f"我们今天学习【{word}】。", "pinyin": "", "translation": f"We learn {word} today."}],
            "daily_examples": [{"chinese": f"这个就是【{word}】。", "pinyin": "", "translation": f"This is {word}."}],
            "topic_reading": f"【{word}】在日常汉语交际中非常常用。"
        }

async def generate_line_art_image(word: str, custom_prompt: str = None) -> dict:
    """使用图像生成模型生成对外汉语教学黑白简笔画"""
    prompt = custom_prompt if custom_prompt else DEFAULT_IMAGE_PROMPT_TEMPLATE.format(subject=word)
    
    api_key = settings.DEFAULT_LLM_API_KEY
    url = settings.IMAGE_MODEL_BASE_URL
    model = settings.IMAGE_MODEL
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"text": prompt}
                    ]
                }
            ]
        },
        "parameters": {
            "size": "1024*1024",
            "n": 1
        }
    }
    
    logger.info(f"Submitting image generation for word '{word}' using model {model}")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                res_data = res.json()
                # 解析 DashScope qwen-image / 万相 / OpenAI 兼容返回格式
                image_url = None
                if "output" in res_data:
                    output = res_data["output"]
                    if "choices" in output and len(output["choices"]) > 0:
                        content_list = output["choices"][0].get("message", {}).get("content", [])
                        for item in content_list:
                            if isinstance(item, dict) and "image" in item:
                                image_url = item["image"]
                                break
                    elif "results" in output and len(output["results"]) > 0:
                        image_url = output["results"][0].get("url")
                elif "data" in res_data and len(res_data["data"]) > 0:
                    image_url = res_data["data"][0].get("url")
                
                if image_url:
                    # 下载到本地 uploads 目录
                    img_res = await client.get(image_url)
                    if img_res.status_code == 200:
                        filename = f"sketch_{uuid.uuid4().hex[:12]}.png"
                        save_path = UPLOADS_DIR / "images" / filename
                        with open(save_path, "wb") as f:
                            f.write(img_res.content)
                        
                        return {
                            "success": True,
                            "url": f"/uploads/knowledge/images/{filename}",
                            "prompt": prompt,
                            "source_type": "ai_generated"
                        }
            
            logger.warning(f"Image generation API non-200 or unexpected response: {res.text}")
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        
    return {
        "success": False,
        "error": "图像生成失败，请检查网络或配置",
        "prompt": prompt
    }

async def generate_video_script(word: str, pinyin: str = "", translation: str = "") -> str:
    """生成适合 Cdance2.0 视频生成的对外汉语口语脚本"""
    llm = get_llm()
    prompt = f"""Create a realistic live-action vertical short video script for foreign beginners learning Chinese.

Word: "{word}"
Pinyin: "{pinyin}"
Meaning: "{translation}"

Style: real-life scenario / conversational teaching video, not animation. Warm atmosphere, real people, casual short-video pacing.
Spoken dialogue: English explanation with clear Chinese target word repetition.
On-screen Chinese learning text must clearly include “{word}” and “{pinyin}”.
Duration: 15 seconds.

Output ONLY the complete prompt in English suitable for AI video generation prompt input (no other conversational filler)."""
    response = await llm.ainvoke(prompt)
    return response.content.strip()

async def submit_cdance_video_task(word: str, custom_script: str = None) -> dict:
    """提交 Cdance2.0 纯文生视频任务"""
    if not custom_script:
        custom_script = f"""Create a realistic live-action vertical short video for foreign beginners learning Chinese word "{word}".
Style: real-life vlog / teaching video, not animation. Natural camera movement, warm atmosphere, real people.
Spoken dialogue: English only with clear Chinese pronunciation of "{word}".
Subtitles: Add accurate English subtitles.
On-screen Chinese learning text must appear clearly: "{word}".
Duration: 15 seconds. Aspect ratio: 9:16."""

    payload = {
        "model": settings.VIDEO_MODEL,
        "content": [
            {
                "type": "text",
                "text": custom_script
            }
        ],
        "generate_audio": True,
        "ratio": "9:16",
        "duration": 15,
        "watermark": False
    }

    headers = {
        "Authorization": f"Bearer {settings.VIDEO_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(settings.VIDEO_API_URL, headers=headers, json=payload)
            res.raise_for_status()
            data = res.json()
            task_id = data.get("id")
            if not task_id:
                return {"success": False, "error": "未返回任务ID"}
            
            return {
                "success": True,
                "task_id": task_id,
                "script": custom_script,
                "status": "processing"
            }
    except Exception as e:
        logger.error(f"Submit video task error: {e}")
        return {"success": False, "error": str(e)}

async def query_and_save_video_task(task_id: str) -> dict:
    """查询视频生成任务状态，成功后下载保存到本地"""
    query_url = f"{settings.VIDEO_API_URL}/{task_id}"
    headers = {
        "Authorization": f"Bearer {settings.VIDEO_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(query_url, headers=headers)
            res.raise_for_status()
            data = res.json()
            status = data.get("status", "UNKNOWN")

            if status == "succeeded":
                remote_video_url = data.get("content", {}).get("video_url")
                if not remote_video_url:
                    return {"status": "failed", "error": "未返回视频地址"}
                
                # 下载视频保存到本地
                v_res = await client.get(remote_video_url)
                if v_res.status_code == 200:
                    filename = f"cdance_{task_id}.mp4"
                    save_path = UPLOADS_DIR / "videos" / filename
                    with open(save_path, "wb") as f:
                        f.write(v_res.content)
                    
                    return {
                        "status": "succeeded",
                        "url": f"/uploads/knowledge/videos/{filename}",
                        "duration": 15,
                        "source_type": "ai_generated"
                    }
            elif status == "failed":
                err_msg = data.get("error", {}).get("message", "生成失败")
                return {"status": "failed", "error": err_msg}
            
            return {"status": status}
    except Exception as e:
        logger.error(f"Poll video task error: {e}")
        return {"status": "error", "error": str(e)}
