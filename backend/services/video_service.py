import random
import logging

logger = logging.getLogger(__name__)

# 精选 B站 真实有效的权威对外汉语教学视频资源库（按主题分类）
# 资源涵盖：北京语言大学(北语)示范课、首都师范大学、汉语桥、全球中文微课大赛等真实收录视频
CURATED_VIDEOS = {
    "语法": [
        {
            "bvid": "BV1B7411Z7Bq",
            "title": "北语示范课“把”字句教学",
            "author": "北京语言大学对外汉语示范课",
            "duration": "51:23",
            "cover": "https://i2.hdslb.com/bfs/archive/ecc625dc09d8dbca7cf03af3890ad45545d13794.jpg"
        },
        {
            "bvid": "BV1Gy4y1k7JH",
            "title": "【北语对外汉语示范课】语法教学 把字句 于淼",
            "author": "北语汉教教研",
            "duration": "42:15",
            "cover": "https://i1.hdslb.com/bfs/archive/ab85abe846ac07006b6bd512b8b61ebe08b39629.jpg"
        },
        {
            "bvid": "BV1ve4y1U7Wg",
            "title": "2021全球中文微课大赛三等奖“把”字句2",
            "author": "全球中文微课大赛",
            "duration": "08:35",
            "cover": "https://i2.hdslb.com/bfs/archive/85f35ebb8ee20da4db401bbf4667c6c47438863d.jpg"
        },
        {
            "bvid": "BV13W41197q7",
            "title": "对外汉语教学示范课（是……的）part1",
            "author": "对外汉语精品公开课",
            "duration": "15:20",
            "cover": "https://i1.hdslb.com/bfs/archive/757985e96e3b384ed612342550dcdf4751185a76.jpg"
        },
        {
            "bvid": "BV1oE411r7sz",
            "title": "“越来越...”的教学方法与句式拓展",
            "author": "对外汉语语法专项",
            "duration": "12:40",
            "cover": "https://i2.hdslb.com/bfs/archive/e2d3f2133c14262de77c2a5f1cb61c5333b01973.jpg"
        },
        {
            "bvid": "BV1oE411r74m",
            "title": "“一边...一边...”复句教学与操练",
            "author": "对外汉语语法专项",
            "duration": "10:15",
            "cover": "https://i0.hdslb.com/bfs/archive/a15a669dc8dc55fdf0c7275e859aae068031b782.jpg"
        },
        {
            "bvid": "BV1Ca9oBKE4f",
            "title": "【比字句】对外汉语教学 国际中文教育语法比较",
            "author": "国际中文教育课堂",
            "duration": "18:22",
            "cover": "https://i0.hdslb.com/bfs/archive/7568e93e82ce3de3ff20dd6fe4b7f76395d09c00.jpg"
        },
        {
            "bvid": "BV1ub4y1Y7Pa",
            "title": "汉语国际教育试讲课 有字句与存现句精讲",
            "author": "汉教教研室",
            "duration": "20:45",
            "cover": "https://i1.hdslb.com/bfs/archive/ebc29c308a1e18ca8686bac40e0bac423c18d3c3.jpg"
        },
        {
            "bvid": "BV1S741147Kn",
            "title": "【教学示范】初级汉语语法/北语慕课-国家级精品课",
            "author": "北京语言大学慕课",
            "duration": "35:10",
            "cover": "https://i1.hdslb.com/bfs/archive/fc6334733a5147aaba8dad4a73fbe9f3c03b2b49.jpg"
        },
        {
            "bvid": "BV11A411v7Z9",
            "title": "首师大对外汉语教学技能大赛一等奖“的”字短语",
            "author": "首都师范大学汉教",
            "duration": "16:50",
            "cover": "https://i0.hdslb.com/bfs/archive/59e27f0677d34c47f47316692d7e29151127f02e.jpg"
        }
    ],
    "词汇": [
        {
            "bvid": "BV1LF4m1N7uW",
            "title": "对外汉语课堂之词汇教学—今天天气怎么样",
            "author": "对外汉语课堂",
            "duration": "14:30",
            "cover": "https://i2.hdslb.com/bfs/archive/745d0716fd8bae4c661f7b99622ef01a478b5720.jpg"
        },
        {
            "bvid": "BV1Kc411h7qK",
            "title": "汉语国际教育示范课 学汉语初级 你去过长城吗",
            "author": "北语国际汉语示范课",
            "duration": "22:15",
            "cover": "https://i2.hdslb.com/bfs/archive/7e747a4f54f6fc033f6fa61c2ec311c45fdf611d.jpg"
        },
        {
            "bvid": "BV1QV411h7gW",
            "title": "对外汉语教学·示范课《这是谁的书包》常用实物词",
            "author": "华语基础教学",
            "duration": "18:00",
            "cover": "https://i0.hdslb.com/bfs/archive/4a198cb481ae90b85fafb46aa06f410833e75f74.jpg"
        },
        {
            "bvid": "BV1Be4y1R7aX",
            "title": "对外汉语--试讲高频考点核心词汇与句型操练",
            "author": "国际中文教师公开课",
            "duration": "25:40",
            "cover": "https://i1.hdslb.com/bfs/archive/64133f4c2a6829ad3151117019c756ef85e2c4a8.jpg"
        }
    ],
    "发音": [
        {
            "bvid": "BV1dt4y1i7YF",
            "title": "【北语对外汉语示范课】张辉 语音教学与四声调训练",
            "author": "北京语言大学张辉教授",
            "duration": "38:20",
            "cover": "https://i2.hdslb.com/bfs/archive/23f967c38fbfb49497a31ab4a2f66bf8e47632c9.jpg"
        },
        {
            "bvid": "BV1Hq4y1W7A5",
            "title": "汉语拼音(中英双语教学)-第十七集 | 总复习与发音要领",
            "author": "和宽宽一起学中文",
            "duration": "06:19",
            "cover": "https://i2.hdslb.com/bfs/archive/d077fb14cd22ba273f280e339f53d45dc24d36ce.jpg"
        },
        {
            "bvid": "BV1PG411f7r3",
            "title": "[拼音启蒙] 超实用的拼音学习 轻松掌握声母韵母发音",
            "author": "就要考第一",
            "duration": "49:01",
            "cover": "https://i2.hdslb.com/bfs/archive/07027da3649ee5cc318deaffff8f105d94411555.png"
        }
    ],
    "汉字": [
        {
            "bvid": "BV1rK4y1C7Se",
            "title": "汉语国际教育示范课 学汉语初级 汉字结构与笔顺教学",
            "author": "汉语国际教育示范课",
            "duration": "28:10",
            "cover": "https://i1.hdslb.com/bfs/archive/d4bc6a7b3e0e2e95165c8c4cfde321c7ae9cbd64.jpg"
        },
        {
            "bvid": "BV1fg4y1b7px",
            "title": "汉语国际教育示范课 学汉语中级 汉字应用与书面写作",
            "author": "汉教名师示范课",
            "duration": "32:00",
            "cover": "https://i2.hdslb.com/bfs/archive/f67c9e4e2b9796298e3a46d4ce2539122f9fe3bb.jpg"
        }
    ],
    "对话": [
        {
            "bvid": "BV1pb411i71V",
            "title": "[北语][汉语课堂教学示范][初级口语课教学]（杨楠）",
            "author": "北京语言大学杨楠",
            "duration": "45:30",
            "cover": "https://i0.hdslb.com/bfs/archive/c0f2b29d462812da521745f90ba8802120621e4a.jpg"
        },
        {
            "bvid": "BV1ZY4y1q7sM",
            "title": "[北语][汉语课堂教学示范][综合课短文与情境会话]（魏苹）",
            "author": "北京语言大学魏苹",
            "duration": "41:00",
            "cover": "https://i2.hdslb.com/bfs/archive/62f898299324b1a46ff687d4cd9e3311fd0ce8ad.png"
        },
        {
            "bvid": "BV1vJ411F7NA",
            "title": "外国人学汉语系列-情境短文与日常会话教学",
            "author": "国际汉语桥课堂",
            "duration": "19:15",
            "cover": "https://i0.hdslb.com/bfs/archive/90bc95070eee558bf8ec36b95d732e1e48a8046e.jpg"
        },
        {
            "bvid": "BV1SJ411i7AM",
            "title": "Chinese Class 黄亚娟美国对外汉语教学情景实录(中英双语)",
            "author": "黄亚娟中文课堂",
            "duration": "24:50",
            "cover": "https://i2.hdslb.com/bfs/archive/05b499188705c804ab2d28ceaf787199b88a43df.jpg"
        },
        {
            "bvid": "BV19f4y1Q7EA",
            "title": "【对外汉语】 外国人学中文沉浸式课堂互动与口语练习",
            "author": "对外汉语中文堂",
            "duration": "15:40",
            "cover": "https://i1.hdslb.com/bfs/archive/b4c290aa81af2d7ead853fd4a26b265b56ae0eef.png"
        }
    ],
    "HSK": [
        {
            "bvid": "BV1ae4y137Fj",
            "title": "2022汉语国际教育大赛一等奖——HSK标准教程3《我被他影响了》",
            "author": "汉教技能大赛",
            "duration": "20:00",
            "cover": "https://i2.hdslb.com/bfs/archive/61041d98c4540695856b6dbae8bd3be6d59bdbba.jpg"
        },
        {
            "bvid": "BV1Ap4y1C7od",
            "title": "汉语国际教育示范课 汉语学习中级 综合课程精讲",
            "author": "国际汉语教育示范课",
            "duration": "48:10",
            "cover": "https://i0.hdslb.com/bfs/archive/a15b72e736c90e7c7b3b05dcc2da1b00e4956b3e.jpg"
        },
        {
            "bvid": "BV1DE32eiEWV",
            "title": "（北京语言大学）汉语课堂教学示范 综合课教学 魏平（上）",
            "author": "北京语言大学魏平",
            "duration": "40:20",
            "cover": "https://i1.hdslb.com/bfs/archive/bbb4af1f0786c8092f156afb3a7df88fdfcbeede.jpg"
        },
        {
            "bvid": "BV1kv32eREtx",
            "title": "（北京语言大学）汉语课堂教学示范 综合课教学 魏平（中）",
            "author": "北京语言大学魏平",
            "duration": "39:50",
            "cover": "https://i0.hdslb.com/bfs/archive/c57ed1cacfcdbd4510291847ee73400b085866b8.jpg"
        }
    ],
    "文化": [
        {
            "bvid": "BV1Up4y147AP",
            "title": "北京语言大学，汉语国际教育文化与跨文化交际示范课",
            "author": "北京语言大学文化示范课",
            "duration": "46:30",
            "cover": "https://i0.hdslb.com/bfs/archive/09b5aa074f3fe7ccbd68bd67997c5e9526d631c5.jpg"
        },
        {
            "bvid": "BV1dK4y1C7vB",
            "title": "汉语国际教育示范课 学汉语中高级 请给我们一个无烟的环境",
            "author": "汉教教研公开课",
            "duration": "30:40",
            "cover": "https://i0.hdslb.com/bfs/archive/e10c5334de1a58ee03d012072043238be94dd311.jpg"
        },
        {
            "bvid": "BV1jW411d79Z",
            "title": "对外汉语示范课 中国传统社会与当代生活实践",
            "author": "汉语文化教学",
            "duration": "35:00",
            "cover": "https://i2.hdslb.com/bfs/archive/5c9172cdaf79b117a29ded90ebce646617d66262.jpg"
        }
    ]
}

# 主题关键词映射
TOPIC_KEYWORDS = {
    "语法": ["语法", "句型", "句式", "把字句", "被字句", "比字句", "存现句", "补语", "了", "着", "过", "的地得", "比", "越来越", "一边", "grammar", "structure"],
    "词汇": ["词汇", "词语", "意思", "区别", "近义词", "反义词", "成语", "词", "word", "vocab", "meaning", "解释"],
    "发音": ["发音", "拼音", "声调", "读音", "怎么读", "声母", "韵母", "四声", "pronunciation", "pinyin", "tone"],
    "汉字": ["汉字", "笔顺", "笔画", "偏旁", "部首", "怎么写", "写法", "书法", "character", "stroke", "write"],
    "对话": ["对话", "会话", "口语", "怎么说", "说", "交流", "情景", "短文", "conversation", "dialogue", "speak"],
    "HSK": ["HSK", "hsk", "考试", "测试", "练习", "真题", "综合课", "exam", "test", "practice"],
    "文化": ["文化", "节日", "传统", "习俗", "历史", "中国", "无烟", "生活", "culture", "festival", "tradition"]
}

def match_topic(user_input: str, video_keywords: str = "") -> str:
    """Match user input to the most relevant video topic category."""
    combined = (user_input + " " + video_keywords).lower()
    
    scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in combined)
        if score > 0:
            scores[topic] = score
    
    if scores:
        return max(scores, key=scores.get)
    return "语法"  # default fallback

def get_recommended_videos(user_input: str, video_keywords: str = "", count: int = 2) -> list:
    """Get recommended videos based on user input and LLM-generated keywords."""
    topic = match_topic(user_input, video_keywords)
    pool = CURATED_VIDEOS.get(topic, CURATED_VIDEOS["语法"])
    
    selected = random.sample(pool, min(count, len(pool)))
    
    videos = []
    for v in selected:
        bvid = v["bvid"]
        # 精确官方外链嵌入地址，启用 danmaku=0 静音弹幕干扰，as_wide=1 宽屏，high_quality=1 请求高画质
        embed_url = f"https://player.bilibili.com/player.html?bvid={bvid}&page=1&danmaku=0&high_quality=1&as_wide=1"
        page_url = f"https://www.bilibili.com/video/{bvid}"
        
        videos.append({
            "bvid": bvid,
            "title": v["title"],
            "cover": v.get("cover", ""),
            "author": v.get("author", "国际汉语名师课"),
            "play_count": 0,
            "duration": v.get("duration", "15:00"),
            "embed_url": embed_url,
            "page_url": page_url,
            "topic": topic
        })
    
    return videos

async def search_bilibili_videos(keyword: str, count: int = 2) -> list:
    """
    Wrapper that uses curated video library with topic matching.
    Falls back gracefully and never blocks the main flow.
    """
    try:
        return get_recommended_videos("", keyword, count)
    except Exception as e:
        logger.warning(f"Video recommendation failed: {e}")
        return []
