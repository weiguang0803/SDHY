"""Module-one regression tests; all database fixtures live in memory."""
import datetime as dt
import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import sys
import httpx

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.database.connection import Base, get_db
from backend.models import User, Message, Conversation, KnowledgeEntry, UserLearningProfile
from backend.services.analytics_service import build_analytics, local_day, points_from
from backend.api.deps import get_current_admin, verify_admin
from backend.config import settings
from jose import jwt

# Import only module one: admin/__init__.py also imports unrelated LLM modules.
spec = importlib.util.spec_from_file_location('learner_analytics_routes', Path(__file__).parents[1] / 'api/admin/analytics.py')
routes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(routes)
router, date_range, safe_csv = routes.router, routes.date_range, routes.safe_csv


class AnalyticsTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine('sqlite+aiosqlite:///:memory:')
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        self.session = async_sessionmaker(self.engine, expire_on_commit=False)()
        self.day = dt.datetime.now(dt.timezone.utc).date()
        stamp = dt.datetime.combine(self.day, dt.time(2))
        roles = [('u1', 'user', 'English'), ('u2', 'student', 'French'), ('a', 'admin', 'English'), ('c', 'collector', 'English'), ('r', 'reviewer', 'English')]
        for uid, role, lang in roles:
            self.session.add(User(id=uid, username=uid, password_hash='test-only', role=role, native_language=lang, chinese_level='HSK2'))
            self.session.add(Conversation(id=uid, user_id=uid, is_deleted=uid == 'u1'))
        question = lambda mid, uid, content, seconds=0, points=None: Message(id=mid, conversation_id=uid, role='user', content=content, created_at=stamp+dt.timedelta(seconds=seconds), knowledge_points=points or [])
        self.session.add_all([
            question('q1', 'u1', '把字句怎么用？', points=['把字句', '把字句']),
            question('q2', 'u2', '被字句怎么用？'),
            Message(id='answer', conversation_id='u2', role='assistant', content='example', created_at=stamp+dt.timedelta(seconds=1), knowledge_points=['被字句']),
            Message(id='retry', conversation_id='u2', role='assistant', content='regenerated', created_at=stamp+dt.timedelta(seconds=2), knowledge_points=['被字句']),
            question('q3', 'u1', 'What is tea?', 10, ['茶']),
            question('q4', 'u1', '你好', 20),
            question('qa', 'a', '你好'), question('qc', 'c', '不应统计', points=['污染']), question('qr', 'r', '不应统计', points=['污染']),
            KnowledgeEntry(id='k1', word='把字句', status='pending_review', created_by='c'),
            KnowledgeEntry(id='k2', word='把字句', status='approved', created_by='c'),
            KnowledgeEntry(id='k3', word='被字句', status='pending_review', created_by='c'),
            UserLearningProfile(user_id='u1', weak_points=[{'point':'被字句', 'error_count':3}]),
            UserLearningProfile(user_id='c', weak_points=[{'point':'污染', 'error_count':99}]),
        ])
        await self.session.commit()

    async def asyncTearDown(self):
        await self.session.close()
        await self.engine.dispose()

    async def test_counts_roles_regeneration_and_evidence(self):
        data, rows = await build_analytics(self.session, self.day, self.day)
        self.assertEqual(data['summary'], {'questions':4, 'learners':2, 'recognized':2, 'gaps':1})
        self.assertEqual(sum(x['count'] for x in data['matrix']), 4)
        self.assertEqual(data['levels'][0]['average'], 2)
        self.assertEqual(data['trend'][0]['学员'], 2)
        self.assertEqual(data['trend'][0]['管理员'], 1)
        self.assertEqual({r['point']:r['count'] for r in data['ranking']}, {'把字句':1,'茶':1})
        self.assertEqual({r['point']:r['status'] for r in data['gaps']}, {'茶':'未收录'})
        self.assertEqual(data['topic_ranking'], [
            {'topic': '语法讲解', 'count': 2, 'learners': 2},
            {'topic': '日常交流', 'count': 1, 'learners': 1},
            {'topic': '文化知识', 'count': 1, 'learners': 1},
        ])
        self.assertTrue(next(r for r in rows if r['id'] == 'q1')['deleted'])
        self.assertEqual(next(r for r in rows if r['id'] == 'q2')['source'], '未识别')
        self.assertEqual(data['weak_points'][0]['count'], 3)
        self.assertEqual(len(data['weak_points']), 1)
        self.assertEqual(len(data['calendar']), 90)

    async def test_empty_window_does_not_fabricate_data(self):
        day = self.day - dt.timedelta(days=10)
        data, rows = await build_analytics(self.session, day, day)
        self.assertEqual(data['summary']['questions'], 0)
        self.assertEqual(data['gaps'], [])
        self.assertEqual(rows, [])
        self.assertEqual(len(data['matrix']), 48)

    async def test_alias_coverage_and_task_filtering(self):
        message = await self.session.get(Message, 'q1')
        message.knowledge_points = ['重庆小面', '小面', '词汇翻译', 'HSK4 阅读理解', '中秋节', '传统节日习俗']
        self.session.add(KnowledgeEntry(id='noodles', word='小面', status='approved', created_by='c'))
        await self.session.commit()
        data, rows = await build_analytics(self.session, self.day, self.day)
        ranking = {r['point']: r['count'] for r in data['ranking']}
        self.assertEqual(ranking['小面'], 1)
        self.assertNotIn('重庆小面', ranking)
        self.assertNotIn('词汇翻译', ranking)
        self.assertNotIn('HSK4 阅读理解', ranking)
        self.assertNotIn('小面', [r['point'] for r in data['gaps']])
        self.assertIn('中秋节', ranking)
        self.assertIn('传统节日习俗', ranking)
        self.assertIn('小面', next(r for r in rows if r['id'] == 'q1')['points'])

    async def test_structured_points_only_and_eight_languages(self):
        self.session.add(User(id='other', username='other', password_hash='test-only', role='user', native_language='Sinhala'))
        self.session.add(Conversation(id='other', user_id='other'))
        self.session.add(Message(id='other-q', conversation_id='other', role='user', content='你好', created_at=dt.datetime.combine(self.day, dt.time(3))))
        await self.session.commit()
        data, _ = await build_analytics(self.session, self.day, self.day)
        self.assertEqual(len(data['languages']), 8)
        self.assertEqual(len(data['matrix']), 48)
        self.assertEqual(data['outside_languages'], 1)
        self.assertEqual(data['summary']['questions'], 5)
        self.assertEqual(points_from(SimpleNamespace(knowledge_points=[], agent_process=[{'agent':'intent_agent','status':'complete','message':'核心知识点：不能从展示文本统计'}])), ([], '未识别'))

    async def test_chat_persists_points_before_done(self):
        async def graph_updates(*args, **kwargs):
            yield {'intent_agent': {'intent': {'type':'question', 'knowledge_points':['被字句', '', 42]}}}
            yield {'teaching_agent': {'teaching_response':'示例'}}
        graph = SimpleNamespace(agent_graph=SimpleNamespace(astream=graph_updates))
        memory = SimpleNamespace(update_user_learning_evolution=AsyncMock(), check_and_generate_rolling_summary=AsyncMock())
        # Stub unrelated graph/LLM and SSE transport, but run the real chat generator and database commits.
        with patch.dict(sys.modules, {'backend.agents.graph':graph, 'backend.services.memory_service':memory, 'sse_starlette.sse':SimpleNamespace(EventSourceResponse=lambda generator: generator)}):
            chat_spec = importlib.util.spec_from_file_location('analytics_chat_integration', Path(__file__).parents[1] / 'api/chat.py')
            chat = importlib.util.module_from_spec(chat_spec)
            chat_spec.loader.exec_module(chat)
        user = await self.session.get(User, 'u1')
        factory = async_sessionmaker(self.engine, expire_on_commit=False)
        with patch.object(chat, 'async_session_factory', factory), patch.object(chat, 'get_user_from_token', AsyncMock(return_value=user)), patch.object(chat.asyncio, 'sleep', AsyncMock()):
            stream = await chat.chat_stream(chat.ChatRequest(conversation_id='u1', message='新测试提问'), 'Bearer test')
            seen_done = False
            async for event in stream:
                if event['event'] == 'done':
                    seen_done = True
                    from sqlalchemy import select
                    async with factory() as db:
                        messages = (await db.execute(select(Message).where(Message.conversation_id == 'u1', Message.role == 'assistant'))).scalars().all()
                        self.assertEqual(messages[-1].knowledge_points, ['被字句'])
                        user_messages = (await db.execute(select(Message).where(Message.conversation_id == 'u1', Message.role == 'user').order_by(Message.created_at.desc()))).scalars().all()
                        self.assertEqual(user_messages[0].knowledge_points, ['被字句'])
                self.assertNotEqual(event['event'], 'error', event)
            self.assertTrue(seen_done)

    async def test_api_drilldown_exports_and_filters(self):
        app = FastAPI()
        app.include_router(router, prefix='/api/admin')
        async def database():
            yield self.session
        app.dependency_overrides[get_db] = database
        app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id='a', role='admin')
        window = {'start':self.day.isoformat(), 'end':self.day.isoformat()}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
            overview = await client.get('/api/admin/analytics/overview', params=window)
            self.assertEqual(overview.status_code, 200)
            response = await client.get('/api/admin/analytics/questions', params={**window, 'point':'被字句', 'page_size':1})
            self.assertEqual(response.json()['total'], 0)
            response = await client.get('/api/admin/analytics/questions', params={**window, 'point':'把字句', 'page_size':1})
            self.assertEqual(response.json()['total'], 1)
            self.assertEqual(response.json()['items'][0]['id'], 'q1')
            response = await client.get('/api/admin/analytics/questions', params={**window, 'language':'英语', 'topic':'语法讲解'})
            self.assertEqual(response.json()['total'], 1)
            response = await client.get('/api/admin/analytics/questions', params={**window, 'page_size':1, 'page':2})
            self.assertEqual(len(response.json()['items']), 1)
            for fmt in ('csv', 'md'):
                response = await client.get('/api/admin/analytics/export', params={**window,'format':fmt})
                self.assertEqual(response.status_code, 200)
                self.assertIn('茶', response.text)
                self.assertIn('未收录', response.text)
                self.assertNotIn('把字句', response.text)
            self.assertEqual((await client.get('/api/admin/analytics/export', params={'format':'xlsx'})).status_code, 422)
            self.assertEqual((await client.get('/api/admin/analytics/questions', params={'page':0})).status_code, 422)

    async def test_non_admin_and_disabled_admin_rejected(self):
        from fastapi import HTTPException
        for user_id in ('u1','c','r'):
            token = jwt.encode({'sub':user_id}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
            with self.assertRaises(HTTPException) as caught:
                await verify_admin('Bearer ' + token, self.session)
            self.assertEqual(caught.exception.status_code, 403)
        admin = await self.session.get(User, 'a')
        admin.is_active = False
        await self.session.flush()
        token = jwt.encode({'sub':'a'}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        with self.assertRaises(HTTPException) as caught:
            await verify_admin('Bearer ' + token, self.session)
        self.assertEqual(caught.exception.status_code, 403)


class BoundaryTests(unittest.TestCase):
    def test_analytics_excludes_labels_but_keeps_specific_content(self):
        excluded = ['词汇释义', '日语与中文对照', '动物词汇', '注意事项',
                    '文化象征', 'HSK 3级听力', '卢旺达语疑问句结构']
        retained = ['月饼', '小面', '在', '吃', '为什么', '汉字笔顺',
                    '地点状语位置', '火锅礼仪', '中秋节文化习俗', '“在”的用法']
        message = SimpleNamespace(knowledge_points=excluded + retained)
        self.assertEqual(points_from(message)[0], retained)
        self.assertEqual(message.knowledge_points, excluded + retained)
        self.assertEqual(points_from(SimpleNamespace(knowledge_points=excluded)), ([], '未识别'))

    def test_timezone_normalization_and_csv(self):
        self.assertEqual(local_day(dt.datetime(2026,10,15,16)), dt.date(2026,10,16))
        self.assertEqual(safe_csv(' =HYPERLINK("x")'), "' =HYPERLINK(\"x\")")
        self.assertEqual(safe_csv('被字句'), '被字句')
        self.assertEqual(points_from(SimpleNamespace(knowledge_points=[], agent_process=[])), ([], '未识别'))
        self.assertEqual(points_from(SimpleNamespace(knowledge_points=['你好', '把字句', '把字句'], agent_process=[])), (['把字句'], '结构化字段'))

    def test_date_validation(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            date_range(30, dt.date(2026,1,2), dt.date(2026,1,1))
        with self.assertRaises(HTTPException):
            date_range(30, dt.date(2026,1,2), None)

    def test_admin_authorization_on_every_route(self):
        app = FastAPI()
        app.include_router(router, prefix='/api/admin')
        with TestClient(app) as client:
            for path in ['ping', 'overview', 'questions', 'export']:
                self.assertEqual(client.get('/api/admin/analytics/' + path).status_code, 422)
                self.assertEqual(client.get('/api/admin/analytics/' + path, headers={'Authorization':'Bearer invalid'}).status_code, 401)


if __name__ == '__main__':
    unittest.main()
