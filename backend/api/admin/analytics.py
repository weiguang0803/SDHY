import csv
import datetime as dt
import io
from typing import Optional
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.connection import get_db
from backend.api.deps import get_current_admin
from backend.services.analytics_service import build_analytics, normalize

router = APIRouter(prefix='/analytics', tags=['admin-analytics'], dependencies=[Depends(get_current_admin)])


def date_range(days: int = Query(30, ge=1, le=366), start: Optional[dt.date] = None, end: Optional[dt.date] = None):
    today = dt.datetime.now(ZoneInfo('Asia/Shanghai')).date()
    if bool(start) != bool(end):
        raise HTTPException(422, '开始和结束日期必须同时填写')
    finish = end or today
    begin = start or finish - dt.timedelta(days=days-1)
    if begin > finish or (finish-begin).days > 365 or finish > today:
        raise HTTPException(422, '请选择不超过366天且不晚于今天的有效日期区间')
    return begin, finish


@router.get('/ping')
async def ping():
    return {'status': 'ok', 'module': 'learner_analytics', 'phase': 1}


@router.get('/overview')
async def overview(window=Depends(date_range), db: AsyncSession = Depends(get_db)):
    result, _ = await build_analytics(db, *window)
    return result


@router.get('/questions')
async def questions(window=Depends(date_range), language: Optional[str] = None, topic: Optional[str] = None, point: Optional[str] = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    _, rows = await build_analytics(db, *window)
    rows = [r for r in rows if (not language or r['language'] == language) and (not topic or r['topic'] == topic) and (not point or normalize(point) in {normalize(p) for p in r['points']})]
    rows.sort(key=lambda r: r['created_at'], reverse=True)
    return {'total': len(rows), 'items': rows[(page-1)*page_size:page*page_size]}


def safe_csv(value):
    text = str(value)
    return "'" + text if text.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')) else text


@router.get('/export')
async def export(window=Depends(date_range), format: str = Query('csv', pattern='^(csv|md)$'), db: AsyncSession = Depends(get_db)):
    data, _ = await build_analytics(db, *window)
    headers = ['知识点', '提问次数', '涉及学员数', '知识库状态']
    rows = [[r['point'], r['count'], r['learners'], r['status']] for r in data['gaps']]
    note = f"统计区间：{data['start']} 至 {data['end']}（Asia/Shanghai）；按规范化词条名称匹配，未匹配不代表语义内容必然缺失。"
    if format == 'csv':
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow([note])
        writer.writerow(headers)
        writer.writerows([[safe_csv(v) for v in row] for row in rows])
        content, media = '\ufeff' + stream.getvalue(), 'text/csv; charset=utf-8'
    else:
        def escape(v):
            return str(v).replace('|', '\\|').replace('\n', ' ').replace('\r', ' ')
        content = '# 知识采编需求清单\n\n' + note + '\n\n|' + '|'.join(headers) + '|\n|---|---|---|---|\n' + '\n'.join('|' + '|'.join(escape(v) for v in row) + '|' for row in rows)
        media = 'text/markdown; charset=utf-8'
    return Response(content, media_type=media, headers={'Content-Disposition': f'attachment; filename="knowledge-gaps.{format}"'})
