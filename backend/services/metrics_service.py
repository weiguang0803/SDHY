"""
师道汉韵 · 统一业务口径与学情统计计算服务 (Metrics Service)
规范全局统计时间窗口、时区定义、非学员角色过滤，杜绝虚假随机数与硬编码技术债务。
"""

import datetime
from zoneinfo import ZoneInfo
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, distinct, not_

from backend.models.user import User
from backend.models.conversation import Conversation
from backend.models.message import Message

# 统一时区定义：中国标准时间 (Asia/Shanghai, UTC+8)
SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")
UTC_TZ = datetime.timezone.utc

# 严格过滤角色定义：明确排除后台与采编人员，严防学情与留存指标被内部账号污染
EXCLUDE_STUDENT_ROLES = ("admin", "reviewer", "collector")
STUDENT_ROLES = ("user", "student")

def get_student_filter():
    """获取过滤非学员角色的 SQLAlchemy 条件"""
    return not_(User.role.in_(EXCLUDE_STUDENT_ROLES))

def parse_time_range(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    preset: Optional[str] = "7d"
) -> Tuple[datetime.datetime, datetime.datetime]:
    """
    解析统计时间区间，返回对应的 UTC 开始与结束时间（闭区间对齐）。
    
    支持预设快捷参数:
    - 7d: 最近 7 天
    - 30d: 最近 30 天
    - 90d: 最近 90 天
    - this_month: 本月起始至今
    - last_month: 上个月完整自然月
    - all: 全部历史（2024-01-01 至今）
    """
    now_shanghai = datetime.datetime.now(SHANGHAI_TZ)
    
    if start_date and end_date:
        try:
            s_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d").replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=SHANGHAI_TZ
            )
            e_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, microsecond=999999, tzinfo=SHANGHAI_TZ
            )
            return s_dt.astimezone(UTC_TZ).replace(tzinfo=None), e_dt.astimezone(UTC_TZ).replace(tzinfo=None)
        except ValueError:
            pass

    today_start = now_shanghai.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now_shanghai.replace(hour=23, minute=59, second=59, microsecond=999999)

    if preset == "7d":
        s_dt = today_start - datetime.timedelta(days=6)
        e_dt = today_end
    elif preset == "30d":
        s_dt = today_start - datetime.timedelta(days=29)
        e_dt = today_end
    elif preset == "90d":
        s_dt = today_start - datetime.timedelta(days=89)
        e_dt = today_end
    elif preset == "this_month":
        s_dt = today_start.replace(day=1)
        e_dt = today_end
    elif preset == "last_month":
        first_of_this_month = today_start.replace(day=1)
        last_month_end = first_of_this_month - datetime.timedelta(microseconds=1)
        s_dt = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        e_dt = last_month_end
    elif preset == "all":
        s_dt = datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=SHANGHAI_TZ)
        e_dt = today_end
    else:
        s_dt = today_start - datetime.timedelta(days=6)
        e_dt = today_end

    return s_dt.astimezone(UTC_TZ).replace(tzinfo=None), e_dt.astimezone(UTC_TZ).replace(tzinfo=None)

def calculate_growth_rate(current: float, previous: float) -> Optional[float]:
    """
    计算真实环比增长率（百分比数值），彻底杜绝哈希伪随机数。
    若前期为 0 且当期 > 0，返回 100.0 (代表新激活增量)；
    若双方均为 0，返回 0.0；
    若前期非 0，返回精确计算百分比并保留 1 位小数。
    """
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)

def format_trend_percent(val: Optional[float]) -> str:
    """格式化趋势百分比显示文本，如 '+12.5%' 或 '-5.0%' 或 '-'"""
    if val is None:
        return "-"
    if val > 0:
        return f"+{int(val)}%" if val.is_integer() else f"+{val}%"
    elif val < 0:
        return f"{int(val)}%" if val.is_integer() else f"{val}%"
    return "0%"

def classify_question_topic(user_q: Optional[str]) -> str:
    """
    统一提问意图与知识主题分类器。
    规范映射为 6 大维度：
    - 日常交流
    - 语法讲解
    - 词汇学习
    - 文化知识
    - 偏误纠错
    - 其他
    """
    if not user_q:
        return "日常交流"
    
    q = user_q.lower().strip()

    # 偏误纠错
    if any(k in q for k in ['纠错', '改错', '错误', '不对', '说得对吗', '对不对', '偏误', 'correction', 'correct this', 'is this right', 'wrong']):
        return "偏误纠错"
    
    # 文化知识
    if any(k in q for k in ['火锅', 'hot pot', '小面', 'chongqing noodles', '王老吉', '春', '节', '文化', 'culture', '轻轨', '中国菜', '地方', 'tea', '茶', '习俗', '故宫', '京剧']):
        return "文化知识"
    
    # 语法讲解
    if any(k in q for k in ['造句', 'sentence', '怎么用', '用法', '在句子中', '把字句', '被字句', '语法', 'grammar', '语序', '结构', '时态', '补语', '介词', '重叠', '了的用法']):
        return "语法讲解"
    
    # 词汇与汉字学习
    if any(k in q for k in ['write', 'stroke', '笔顺', '书写', '怎么写', 'how to speak', 'how to read', '怎么读', '怎么说', 'what is', '生词', '词汇', 'vocab', 'meaning', '意思是', 'dragon', 'leopard', '龙', '狮子', '熊猫', '学', '面包', '鸡蛋', 'bench', '风筝', '拼音', 'pinyin', '声调', 'tone']):
        return "词汇学习"
    
    # 日常交流与练习
    if any(k in q for k in ['练习', 'practice', 'hsk', '对话', 'chat', '问候', '你好', 'hello', '不知道', '交流', '打招呼', '模拟']):
        return "日常交流"

    return "日常交流"

async def get_student_count(db: AsyncSession) -> int:
    """获取平台真实学员总数（排除管理员与采编审核员）"""
    stmt = select(func.count(User.id)).where(get_student_filter())
    return (await db.execute(stmt)).scalar() or 0
