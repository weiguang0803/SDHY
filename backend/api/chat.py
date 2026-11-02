from fastapi import APIRouter, Header, HTTPException
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import json
import asyncio
from backend.agents.graph import agent_graph
from backend.agents.state import AgentState
from backend.services.user_service import get_user_from_token
from backend.services.memory_service import update_user_learning_evolution, check_and_generate_rolling_summary
from backend.database.connection import async_session_factory
from backend.models.message import Message
from backend.models.conversation import Conversation
from sqlalchemy.future import select

router = APIRouter(prefix="/api/chat", tags=["chat"])

from typing import Optional

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    regenerate: Optional[bool] = False
    message_id: Optional[str] = None

@router.post("/stream")
async def chat_stream(request: ChatRequest, authorization: str = Header(...)):
    async with async_session_factory() as db:
        user = await get_user_from_token(authorization, db)
        user_id = user.id

    async def event_generator():
        try:
            source_user_message_id = None
            # 1. 消息持久化处理：如果不是重新生成，则保存用户消息；若是重新生成且提供了旧消息ID，则清理旧的AI回复
            async with async_session_factory() as db:
                if request.regenerate and request.message_id:
                    old_msg_res = await db.execute(
                        select(Message).where(
                            Message.id == request.message_id,
                            Message.conversation_id == request.conversation_id
                        )
                    )
                    old_msg = old_msg_res.scalar_one_or_none()
                    if old_msg:
                        previous_user_res = await db.execute(
                            select(Message).where(
                                Message.conversation_id == request.conversation_id,
                                Message.role == "user",
                                Message.created_at <= old_msg.created_at
                            ).order_by(Message.created_at.desc(), Message.id.desc()).limit(1)
                        )
                        previous_user = previous_user_res.scalar_one_or_none()
                        source_user_message_id = previous_user.id if previous_user else None
                        await db.delete(old_msg)
                        await db.commit()
                elif not request.regenerate:
                    user_msg = Message(
                        conversation_id=request.conversation_id,
                        role="user",
                        content=request.message
                    )
                    db.add(user_msg)
                    await db.commit()
                    source_user_message_id = user_msg.id

            # 2. 初始化多智能体状态
            initial_state: AgentState = {
                "user_input": request.message,
                "user_id": user_id,
                "conversation_id": request.conversation_id,
                "intent": {},
                "short_term_memory": [],
                "episodic_memory": {},
                "profile_memory": {},
                "long_term_memory": [],
                "knowledge_context": {},
                "user_profile": {},
                "teaching_strategy": {},
                "teaching_response": "",
                "multimodal_data": {},
                "validation_result": {},
                "retry_count": 0,
                "agent_events": []
            }

            last_events_count = 0
            final_state = dict(initial_state)

            # 3. 逐节点运行 Graph，精准呈现"先占位运行，后填充结果"的时序
            async for output in agent_graph.astream(initial_state, stream_mode='updates'):
                for node_name, node_state in output.items():
                    if node_state and "agent_events" in node_state:
                        new_events = node_state["agent_events"][last_events_count:]
                        for event in new_events:
                            event_type = event.get("status", "info")
                            if event_type == "start":
                                yield {
                                    "event": "agent_start",
                                    "data": json.dumps(event, ensure_ascii=False)
                                }
                                await asyncio.sleep(0.6)
                            elif event_type == "complete":
                                yield {
                                    "event": "agent_complete",
                                    "data": json.dumps(event, ensure_ascii=False)
                                }
                                await asyncio.sleep(0.3)
                            else:
                                yield {
                                    "event": "agent_thinking",
                                    "data": json.dumps(event, ensure_ascii=False)
                                }
                                await asyncio.sleep(0.15)
                        
                        last_events_count = len(node_state["agent_events"])
                    
                    if node_state:
                        final_state.update(node_state)

            # 4. 打字机流式输出回复
            full_response = final_state.get("teaching_response", "")
            if full_response:
                chunk_size = 2
                for i in range(0, len(full_response), chunk_size):
                    chunk = full_response[i:i+chunk_size]
                    yield {
                        "event": "token",
                        "data": json.dumps({"content": chunk}, ensure_ascii=False)
                    }
                    await asyncio.sleep(0.025)

            # 5. 推送多模态资源标注数据（延迟 0.35s 确保独立事件包刷新）
            multimodal = final_state.get("multimodal_data", {})
            has_multimodal_content = (
                multimodal and (
                    multimodal.get("multimodal_items") or 
                    multimodal.get("videos") or 
                    multimodal.get("suggested_questions")
                )
            )
            if has_multimodal_content:
                yield {
                    "event": "multimodal",
                    "data": json.dumps(multimodal, ensure_ascii=False)
                }
                await asyncio.sleep(0.35)

            # 7. 保存 AI 回复与历史记录（包含多模态资源标注）
            async with async_session_factory() as db:
                knowledge_points = [
                    p.strip() for p in (final_state.get("intent", {}).get("knowledge_points") or [])
                    if isinstance(p, str) and p.strip()
                ] if isinstance(final_state.get("intent", {}).get("knowledge_points"), list) else []
                if source_user_message_id and knowledge_points:
                    source_user_res = await db.execute(select(Message).where(Message.id == source_user_message_id))
                    source_user_message = source_user_res.scalar_one_or_none()
                    if source_user_message:
                        source_user_message.knowledge_points = list(dict.fromkeys(knowledge_points))
                ai_msg = Message(
                    conversation_id=request.conversation_id,
                    role="assistant",
                    content=full_response,
                    agent_process=final_state.get("agent_events", []),
                    intent_type=final_state.get("intent", {}).get("type"),
                    # 模块一统计直接读取 messages.knowledge_points，避免解析展示事件文本。
                    knowledge_points=knowledge_points,
                    multimodal=multimodal
                )
                db.add(ai_msg)
                
                conv_result = await db.execute(
                    select(Conversation).where(Conversation.id == request.conversation_id)
                )
                conv = conv_result.scalar_one_or_none()
                if conv and conv.title in ["New Conversation", "新对话", ""]:
                    title = request.message[:25]
                    if len(request.message) > 25:
                        title += "..."
                    conv.title = title
                await db.commit()

                # 完成前确保回复及知识点已落库，管理员刷新统计可立即读取。
                yield {
                    "event": "done",
                    "data": json.dumps({"message": "done"}, ensure_ascii=False)
                }

                # 8. 异步触发分层记忆演化（更新学员持久化认知画像与情景滚动摘要）
                try:
                    intent_type = final_state.get("intent", {}).get("type", "question")
                    kps = final_state.get("intent", {}).get("knowledge_points", [])
                    val_passed = final_state.get("validation_result", {}).get("passed", True)
                    
                    await update_user_learning_evolution(
                        db=db,
                        user_id=user_id,
                        intent_type=intent_type,
                        knowledge_points=kps,
                        user_input=request.message,
                        validation_passed=val_passed
                    )
                    await check_and_generate_rolling_summary(
                        db=db,
                        conversation_id=request.conversation_id,
                        user_id=user_id
                    )
                except Exception as mem_err:
                    pass

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": str(e)}, ensure_ascii=False)
            }

    return EventSourceResponse(event_generator())
