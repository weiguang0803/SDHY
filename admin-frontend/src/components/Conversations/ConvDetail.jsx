import React, { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../services/adminApi'
import { CloseIcon, TrashIcon, BrainIcon, SparklesIcon } from '../Common/AdminIcons'
import RichMarkdown from './RichMarkdown'
import AgentProcessTimeline from './AgentProcessTimeline'
import MultimodalPreview from './MultimodalPreview'
import './ConvDetail.css'

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    let str = String(timeStr)
    if (!str.endsWith('Z') && !str.includes('+') && str.includes('T')) {
      str += 'Z'
    }
    const d = new Date(str)
    return isNaN(d.getTime()) 
      ? timeStr 
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return timeStr
  }
}

const intentLabelMap = {
  question: '问答求助',
  practice: '互动练习',
  correction: '偏误纠错',
  assessment: '水平评估',
  resource: '学习资源',
  conversation: '日常会话',
  chat: '自由交流',
  error_correction: '偏误纠错',
  grammar: '语法问答',
  vocabulary: '词汇学习',
  pronunciation: '语音发音',
  stroke: '汉字笔画'
}

const formatIntent = (type) => {
  if (!type) return ''
  const key = String(type).toLowerCase().trim()
  return intentLabelMap[key] || type
}

const ConvDetail = ({ convId, onClose, onDelete, highlightMessageId, onReturnToAnalytics }) => {
  const highlightedMessage = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) highlightedMessage.current?.scrollIntoView({ block: 'center' })
  }, [loading, messages, highlightMessageId])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await adminApi.getConvMessages(convId)
        setMessages(data || [])
      } catch (err) {
        console.error('Failed to load messages', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [convId])

  const userCount = messages.filter(m => m.role === 'user').length
  const aiCount = messages.filter(m => m.role === 'assistant').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content conv-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* 对话弹窗顶栏 */}
        <div className="modal-header">
          <div className="header-info">
            <h2>对话审查详情</h2>
            <span className="msg-badge total-badge">{messages.length} 条记录</span>
            <span className="msg-badge sub-badge">学 {userCount} / 师 {aiCount}</span>
            <span className="conv-id-chip">ID: {convId?.slice(0, 8)}...</span>
          </div>

          <div className="header-actions">
            {onReturnToAnalytics && <button className="action-btn" style={{ width: 'auto', padding: '0 12px' }} onClick={onReturnToAnalytics} title="返回学情分析中心">← 学情分析</button>}
            <button className="action-btn delete" onClick={onDelete} title="删除该对话及所有消息">
              <TrashIcon size={18} />
            </button>
            <button className="action-btn close" onClick={onClose} title="关闭 (Esc)">
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* 消息滚动流视口 */}
        <div className="chat-container">
          {loading ? (
            <div className="conv-loading-state">
              <div className="conv-spinner"></div>
              <span>正在拉取对话全要素审查数据...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">暂无消息记录</div>
          ) : (
            <div className="message-list">
              {messages.map((msg, idx) => {
                const isAI = msg.role === 'assistant'
                const hasAgentProcess = isAI && msg.agent_process && (
                  Array.isArray(msg.agent_process) ? msg.agent_process.length > 0 : Boolean(msg.agent_process)
                )
                const hasMultimodal = isAI && msg.multimodal && (
                  (Array.isArray(msg.multimodal.multimodal_items) && msg.multimodal.multimodal_items.length > 0) ||
                  (Array.isArray(msg.multimodal.videos) && msg.multimodal.videos.length > 0)
                )
                const knowledgePoints = Array.isArray(msg.knowledge_points) ? msg.knowledge_points : []

                return (
                  <div key={msg.id || idx} ref={msg.id === highlightMessageId ? highlightedMessage : null} style={msg.id === highlightMessageId ? { outline: '2px solid var(--primary)', outlineOffset: '6px', borderRadius: '8px' } : undefined} className={`message-wrapper ${isAI ? 'ai' : 'user'}`}>
                    {/* 头像 */}
                    {isAI ? (
                      <div className="msg-avatar ai" title="师道汉韵教学智能体">
                        <SparklesIcon size={18} color="#ffffff" />
                      </div>
                    ) : null}
                    
                    <div className="message-bubble-container">
                      {/* 消息气泡顶栏元数据 */}
                      <div className="message-meta-header">
                        <span className="sender-name">
                          {isAI ? '师道汉韵 AI 助教' : '学员发言'}
                        </span>
                        <span className="time">{formatTime(msg.created_at)}</span>

                        {isAI && msg.intent_type && (
                          <span className="intent-badge">{formatIntent(msg.intent_type)}</span>
                        )}

                        {isAI && knowledgePoints.length > 0 && (
                          <div className="kp-badges-group">
                            {knowledgePoints.slice(0, 3).map((kp, kIdx) => (
                              <span key={kIdx} className="kp-badge">
                                {kp}
                              </span>
                            ))}
                            {knowledgePoints.length > 3 && (
                              <span className="kp-badge more">+{knowledgePoints.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 1. 智能体推演时间轴卡片（仅 AI 消息，可折叠/展开） */}
                      {hasAgentProcess && (
                        <AgentProcessTimeline agentProcess={msg.agent_process} />
                      )}

                      {/* 2. 消息内容正文（学生端/AI 消息） */}
                      <div className="message-bubble">
                        {isAI ? (
                          <RichMarkdown content={msg.content} />
                        ) : (
                          <div className="user-raw-text">{msg.content}</div>
                        )}
                      </div>

                      {/* 3. 关联多模态教具与视频预览（仅 AI 消息） */}
                      {hasMultimodal && (
                        <MultimodalPreview multimodal={msg.multimodal} />
                      )}
                    </div>

                    {!isAI && (
                      <div className="msg-avatar user" title="学习者">
                        U
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConvDetail
