"""Read-only module-one analytics; no model calls or historical-data writes."""
import datetime as dt
import re
import unicodedata
from collections import Counter, defaultdict
from zoneinfo import ZoneInfo
from sqlalchemy import select
from backend.models.user import User
from backend.models.message import Message
from backend.models.conversation import Conversation
from backend.models.knowledge_entry import KnowledgeEntry
from backend.models.user_learning_profile import UserLearningProfile
from backend.services.metrics_service import classify_question_topic

TZ = ZoneInfo('Asia/Shanghai')
TOPICS = ['日常交流', '语法讲解', '词汇学习', '文化知识', '偏误纠错', '其他']
LANGUAGES = ['英语', '日语', '韩语', '法语', '西班牙语', '俄语', '阿拉伯语', '卢旺达语']
ALIASES = list(zip(LANGUAGES, ['english', 'japanese', 'korean', 'french', 'spanish', 'russian', 'arabic', 'kinyarwanda']))
IGNORED_POINTS = {'基础中文概念', '基础概念', '你好', '个人信息表达', '常用问候语', '日常问候语', '普通交流'}
TASK_POINTS = {'词汇', '词汇学习', '词汇翻译', '中英对照', '中英翻译', '词汇用法', '阅读理解', '造句练习', '名词解释', '基础词汇', '中文词汇', '基础表达', '跨语言对照', '语言水平评估', '汉语能力自测', '语言水平自评', '中文能力评估', 'HSK等级评估', '语言能力测试'}
# Analytics-only exclusions. Exact labels avoid deleting specific teaching content
# such as “火锅礼仪” or “形容词‘辣’的用法” via broad substring matching.
TASK_POINTS |= {
    '词汇释义', '名词学习', '日常词汇询问', '中文词汇翻译', '中日词汇对应',
    '日语与中文对照', '跨语言词汇查询', '动物名称翻译', '中英词汇对应',
    '日语到中文的词汇翻译', '日语汉字与中文对应', '中日语言对比',
    '语言对比（卢旺达语与中文）', '中英混合表达', '外来词或食材名称的中文对应',
}
BROAD_POINTS = {
    '食物词汇', '动物词汇', '交通词汇', '交通相关词汇', '饮料名称', '动物名称',
    '基本汉字', '食物类名词', '食物名词', '饮食词汇', '日常饮食词汇',
    '中文饮食文化词汇', '饮食文化词汇', '城市生活用语', '日常用语',
    '日常出行表达', '公共交通用语', '常用词汇书写', '重庆小面相关词汇',
    '注意事项', '安全注意事项', '语义差异', '文化象征', '文化常识',
    '中国文化', '传统文化', '文化习俗', '发音', '书写规范', '词汇辨析',
}
FOREIGN_POINTS = {'日语基本疑问词「何だ」的用法', '日语疑问句表达', '卢旺达语疑问句结构'}
# Explicit equivalents only: related topics and parent/child concepts are not aliases.
POINT_ALIASES = {'重庆小面': '小面', '公共汽车': '公交', '公交车': '公交'}


def canonical_point(value):
    if not isinstance(value, str):
        return ''
    point = unicodedata.normalize('NFKC', value).strip()
    key = normalize(point)
    if key in {normalize(x) for x in IGNORED_POINTS | TASK_POINTS | BROAD_POINTS | FOREIGN_POINTS}:
        return ''
    if re.fullmatch(r'hsk[1-9]\d*级?(词汇|生词|阅读理解|阅读|听力|语法|口语|写作)', key):
        return ''
    return POINT_ALIASES.get(point, point)


def normalize(value):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', str(value or '')).casefold())


def language(value):
    text = str(value or '').lower()
    return next((name for name, alias in ALIASES if name in text or alias in text), '其他/未知')


def local_day(value):
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    return value.astimezone(TZ).date()


def points_from(message):
    if isinstance(message.knowledge_points, list) and message.knowledge_points:
        points = [canonical_point(p) for p in message.knowledge_points]
        points = list({normalize(p): p for p in points if p}.values())
        if points:
            return list(dict.fromkeys(points)), '结构化字段'
    return [], '未识别'


async def load_questions(db):
    rows = (await db.execute(select(Message, Conversation, User).join(Conversation, Message.conversation_id == Conversation.id).join(User, Conversation.user_id == User.id).where(User.role.in_(['user', 'student', 'admin'])).order_by(Message.conversation_id, Message.created_at, Message.id))).all()
    records = []
    for i, (message, conv, user) in enumerate(rows):
        if message.role == 'user':
            points, source = points_from(message)
            # 自愈兼容兜底：若学员提问自身未冗余知识点，向后关联紧随其后的 AI 回复知识点
            if not points:
                for j in range(i + 1, min(i + 4, len(rows))):
                    next_msg = rows[j][0]
                    if next_msg.conversation_id != conv.id:
                        break
                    if next_msg.role == 'assistant':
                        next_points, _ = points_from(next_msg)
                        if next_points:
                            points = next_points
                            source = '结构化字段'
                            break
            records.append({'id': message.id, 'conversation_id': conv.id, 'user_id': user.id, 'name': user.display_name or user.username, 'role': user.role, 'language': language(user.native_language), 'level': user.chinese_level or '未知', 'content': message.content, 'date': local_day(message.created_at).isoformat(), 'created_at': message.created_at.isoformat() + ('Z' if message.created_at.tzinfo is None else ''), 'topic': classify_question_topic(message.content), 'points': points, 'source': source, 'deleted': bool(conv.is_deleted)})
    return records



def rank_points(records):
    groups = {}
    for row in records:
        for point in {normalize(p): p for p in row['points']}.values():
            item = groups.setdefault(normalize(point), {'point': point, 'count': 0, 'users': set()})
            item['count'] += 1
            item['users'].add(row['user_id'])
    return sorted([{'point': v['point'], 'count': v['count'], 'learners': len(v['users'])} for v in groups.values()], key=lambda x: (-x['count'], x['point']))


def rank_topics(records):
    """Aggregate every learner question into the six fixed learning themes."""
    groups = {topic: {'topic': topic, 'count': 0, 'users': set()} for topic in TOPICS}
    for row in records:
        group = groups[row['topic']]
        group['count'] += 1
        group['users'].add(row['user_id'])
    return [
        {'topic': item['topic'], 'count': item['count'], 'learners': len(item['users'])}
        for item in sorted(groups.values(), key=lambda x: (-x['count'], TOPICS.index(x['topic'])))
        if item['count']
    ]


async def build_analytics(db, start, end):
    records = await load_questions(db)
    selected = [r for r in records if start.isoformat() <= r['date'] <= end.isoformat()]
    students = [r for r in selected if r['role'] in ('user', 'student')]
    matrix = [{'language': lang, 'topic': topic, 'count': sum(r['language'] == lang and r['topic'] == topic for r in students)} for lang in LANGUAGES for topic in TOPICS]
    levels = defaultdict(list)
    for row in students:
        levels[row['level']].append(row)
    level_data = [{'level': level, 'average': round(len(rows) / len({r['user_id'] for r in rows}), 2), 'learners': len({r['user_id'] for r in rows})} for level, rows in sorted(levels.items())]
    trend = []
    for i in range((end - start).days + 1):
        day = (start + dt.timedelta(days=i)).isoformat()
        trend.append({'date': day, '学员': len({r['user_id'] for r in students if r['date'] == day}), '管理员': len({r['user_id'] for r in selected if r['role'] == 'admin' and r['date'] == day})})
    today = dt.datetime.now(TZ).date()
    all_students = [r for r in records if r['role'] in ('user', 'student')]
    counts = Counter(r['date'] for r in all_students)
    calendar = []
    for i in range(90):
        day = (today - dt.timedelta(days=89-i)).isoformat()
        calendar.append({'date': day, 'count': counts[day], 'learners': len({r['user_id'] for r in all_students if r['date'] == day})})
    profiles = (await db.execute(select(UserLearningProfile, User).join(User, UserLearningProfile.user_id == User.id).where(User.role.in_(['user', 'student'])))).all()
    weak = {}
    for profile, user in profiles:
        for item in profile.weak_points if isinstance(profile.weak_points, list) else []:
            if not isinstance(item, dict) or not item.get('point'):
                continue
            point = str(item['point'])
            group = weak.setdefault(normalize(point), {'point': point, 'count': 0, 'users': {}})
            count = item.get('error_count', 0)
            group['count'] += max(0, int(count)) if isinstance(count, (int, float)) else 0
            group['users'][user.id] = user.display_name or user.username
    weak_data = sorted([{'point': v['point'], 'count': v['count'], 'learners': len(v['users']), 'names': list(v['users'].values())} for v in weak.values()], key=lambda v: -v['count'])
    entries = (await db.execute(select(KnowledgeEntry))).scalars().all()
    coverage = defaultdict(set)
    for entry in entries:
        coverage[normalize(canonical_point(entry.word))].add(entry.status)
    topic_ranking = rank_topics(students)
    ranking = rank_points(students)
    gaps = []
    for item in ranking:
        matches = coverage[normalize(item['point'])]
        if 'approved' not in matches:
            gaps.append({**item, 'status': '待审核' if 'pending_review' in matches else '未收录'})
    return {'start': start.isoformat(), 'end': end.isoformat(), 'summary': {'questions': len(students), 'learners': len({r['user_id'] for r in students}), 'recognized': sum(bool(r['points']) for r in students), 'gaps': len(gaps)}, 'outside_languages': sum(r['language'] not in LANGUAGES for r in students), 'languages': LANGUAGES, 'topics': TOPICS, 'matrix': matrix, 'levels': level_data, 'trend': trend, 'topic_ranking': topic_ranking, 'ranking': ranking, 'weak_points': weak_data, 'calendar': calendar, 'gaps': gaps}, students
