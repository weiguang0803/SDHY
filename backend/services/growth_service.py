from collections import Counter, defaultdict
from datetime import datetime, time, timedelta
import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.conversation import Conversation
from backend.models.message import Message
from backend.models.user import User
from backend.services.metrics_service import SHANGHAI_TZ, STUDENT_ROLES, UTC_TZ


PERIODS = [
    {"name": "早晨", "hours": "05:00–08:59"},
    {"name": "上午", "hours": "09:00–11:59"},
    {"name": "下午", "hours": "12:00–17:59"},
    {"name": "晚上", "hours": "18:00–22:59"},
    {"name": "深夜", "hours": "23:00–04:59"},
]
LEVELS = ("初学者", "HSK1-2", "HSK3-4", "HSK5-6", "其他 / 未填写")
LANGUAGES = {
    "english": "英语", "japanese": "日语", "korean": "韩语",
    "french": "法语", "spanish": "西班牙语", "russian": "俄语",
    "arabic": "阿拉伯语", "kinyarwanda": "卢旺达语",
    "sinhala": "僧伽罗语", "chinese": "汉语",
    "german": "德语", "portuguese": "葡萄牙语", "italian": "意大利语",
    "thai": "泰语", "vietnamese": "越南语", "indonesian": "印度尼西亚语",
    "hindi": "印地语", "bengali": "孟加拉语", "urdu": "乌尔都语",
    "tamil": "泰米尔语", "nepali": "尼泊尔语", "swahili": "斯瓦希里语",
    "malay": "马来语", "burmese": "缅甸语", "khmer": "高棉语",
    "filipino": "菲律宾语", "turkish": "土耳其语", "persian": "波斯语",
    "other": "其他", "unknown": "未填写",
}


def language_label(value):
    """统一英文、中英括号及中文名称；无法识别的外文不直接显示。"""
    value = (value or "").strip()
    if not value:
        return "未填写"
    base = re.split(r"[（(]", value, maxsplit=1)[0].strip().lower()
    if base in LANGUAGES:
        return LANGUAGES[base]
    chinese = re.findall(r"[\u4e00-\u9fff]+", value)
    return "".join(chinese) if chinese else "其他"


def level_group(value):
    normalized = (value or "").strip().lower().replace(" ", "")
    if normalized in ("beginner", "初学者"):
        return LEVELS[0]
    for index, aliases in enumerate((
        ("hsk1", "hsk2", "hsk1-2"),
        ("hsk3", "hsk4", "hsk3-4"),
        ("hsk5", "hsk6", "hsk5-6"),
    ), start=1):
        if normalized in aliases:
            return LEVELS[index]
    return LEVELS[4]


def period_index(hour):
    if 5 <= hour < 9:
        return 0
    if 9 <= hour < 12:
        return 1
    if 12 <= hour < 18:
        return 2
    if 18 <= hour < 23:
        return 3
    return 4


def percentage(numerator, denominator):
    return round(numerator / denominator * 100, 2) if denominator else None


async def get_growth_overview(db: AsyncSession, days: int = 30, *, now=None):
    if days not in (7, 30, 90):
        raise ValueError("days must be 7, 30 or 90")
    now = now or datetime.now(UTC_TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=UTC_TZ)
    local_now = now.astimezone(SHANGHAI_TZ)
    today = local_now.date()
    start = today - timedelta(days=days - 1)
    start_utc = datetime.combine(start, time.min, SHANGHAI_TZ).astimezone(UTC_TZ).replace(tzinfo=None)
    now_utc = now.astimezone(UTC_TZ).replace(tzinfo=None)

    students = (await db.execute(select(
        User.id, User.created_at, User.native_language, User.chinese_level,
    ).where(User.role.in_(STUDENT_ROLES), User.created_at <= now_utc))).all()
    levels, languages, new_by_day = Counter(), Counter(), Counter()
    cohorts = defaultdict(set)
    for user in students:
        registered = user.created_at.replace(tzinfo=UTC_TZ).astimezone(SHANGHAI_TZ).date()
        new_by_day[registered] += 1
        cohorts[registered].add(user.id)
        levels[level_group(user.chinese_level)] += 1
        languages[language_label(user.native_language)] += 1

    # 项目数据库为 SQLite；先在数据库聚合，避免加载正文、逐条消息或逐学员查询。
    local_day = func.date(Message.created_at, "+8 hours")
    activity = (await db.execute(select(
        Conversation.user_id, Conversation.id, Conversation.is_favorite,
        local_day.label("day"), func.count(Message.id).label("count"),
    ).select_from(Message).join(Conversation, Message.conversation_id == Conversation.id)
        .join(User, Conversation.user_id == User.id)
        .where(
            User.role.in_(STUDENT_ROLES), User.created_at <= now_utc,
            Conversation.is_deleted.is_(False), Message.role == "user",
            Message.created_at >= start_utc, Message.created_at <= now_utc,
            Message.created_at >= User.created_at,
        ).group_by(Conversation.user_id, Conversation.id, Conversation.is_favorite, local_day))).all()

    active_by_day = defaultdict(set)
    active_users, conversations, favorites = set(), set(), set()
    questions = 0
    for row in activity:
        day = datetime.strptime(row.day, "%Y-%m-%d").date()
        active_by_day[day].add(row.user_id)
        active_users.add(row.user_id)
        conversations.add(row.id)
        if row.is_favorite:
            favorites.add(row.id)
        questions += row.count

    growth, retention = [], []
    cumulative = sum(count for day, count in new_by_day.items() if day < start)
    eligible_total = retained_total = 0
    for offset in range(days):
        day = start + timedelta(days=offset)
        cumulative += new_by_day[day]
        growth.append({"date": day.isoformat(), "new_students": new_by_day[day], "total_students": cumulative})
        cohort_day = day - timedelta(days=30)
        cohort = cohorts[cohort_day]
        mature = day < today  # 今天尚未结束，不能将未完成观察误判为流失。
        retained = len(cohort & active_by_day[day]) if mature else None
        if mature:
            eligible_total += len(cohort)
            retained_total += retained
        retention.append({
            "cohort_date": cohort_day.isoformat(), "observation_date": day.isoformat(),
            "cohort_size": len(cohort), "retained": retained,
            "mature": mature, "rate": percentage(retained, len(cohort)) if mature else None,
        })

    total = len(students)
    return {
        "timezone": "Asia/Shanghai", "generated_at": local_now.isoformat(),
        "range": {"days": days, "start_date": start.isoformat(), "end_date": today.isoformat()},
        "metrics": {
            "total_students": total,
            "new_this_month": sum(count for day, count in new_by_day.items() if day >= today.replace(day=1)),
            "retention_30d": percentage(retained_total, eligible_total),
            "retention_eligible": eligible_total, "retention_returned": retained_total,
            "active_rate": percentage(len(active_users), total), "active_students": len(active_users),
            "conversation_depth": round(questions / len(active_users), 2) if active_users else None,
            "questions": questions, "active_conversations": len(conversations),
            "favorite_rate": percentage(len(favorites), len(conversations)), "favorite_conversations": len(favorites),
        },
        "growth": growth, "retention": retention,
        "levels": [{"name": name, "value": levels[name]} for name in LEVELS],
        "languages": [{"name": name, "value": count} for name, count in sorted(languages.items(), key=lambda item: (-item[1], item[0]))],
    }


async def get_weekly_heatmap(db: AsyncSession, week_date=None, *, now=None):
    now = now or datetime.now(UTC_TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=UTC_TZ)
    today = now.astimezone(SHANGHAI_TZ).date()
    selected = week_date or today
    monday = selected - timedelta(days=selected.weekday())
    next_monday = monday + timedelta(days=7)
    start_utc = datetime.combine(monday, time.min, SHANGHAI_TZ).astimezone(UTC_TZ).replace(tzinfo=None)
    end_utc = datetime.combine(next_monday, time.min, SHANGHAI_TZ).astimezone(UTC_TZ).replace(tzinfo=None)
    now_utc = now.astimezone(UTC_TZ).replace(tzinfo=None)
    local_day = func.date(Message.created_at, "+8 hours")
    local_hour = func.strftime("%H", Message.created_at, "+8 hours")
    activity = (await db.execute(select(
        local_day.label("day"), local_hour.label("hour"), func.count(Message.id).label("count"),
    ).select_from(Message).join(Conversation, Message.conversation_id == Conversation.id)
        .join(User, Conversation.user_id == User.id)
        .where(
            User.role.in_(STUDENT_ROLES), Conversation.is_deleted.is_(False),
            Message.role == "user", Message.created_at >= start_utc,
            Message.created_at < end_utc, Message.created_at <= now_utc,
            Message.created_at >= User.created_at,
        ).group_by(local_day, local_hour))).all()
    values = [[0] * 5 for _ in range(7)]
    for row in activity:
        day = datetime.strptime(row.day, "%Y-%m-%d").date()
        values[(day - monday).days][period_index(int(row.hour))] += row.count
    return {
        "timezone": "Asia/Shanghai", "week_start": monday.isoformat(),
        "week_end": (next_monday - timedelta(days=1)).isoformat(),
        "total_questions": sum(map(sum, values)), "periods": PERIODS,
        "rows": [
            {"day": name, "date": (monday + timedelta(days=index)).isoformat(),
             "is_future": monday + timedelta(days=index) > today, "values": values[index]}
            for index, name in enumerate(("周一", "周二", "周三", "周四", "周五", "周六", "周日"))
        ],
    }
