import React, { useState } from 'react'
import {
  BrainIcon,
  TargetIcon,
  MemoryIcon,
  BookIcon,
  ProfileIcon,
  OrchestratorIcon,
  TeachingIcon,
  MultimodalIcon,
  ShieldCheckIcon,
  CheckIcon,
  ClockIcon,
  ChevronIcon
} from '../Common/AdminIcons'
import './AgentProcessTimeline.css'

const AGENT_PIPELINE = [
  { id: 'intent_agent', name: '意图识别', icon: TargetIcon, color: '#6366f1', desc: '分析教学意图、句型目标与跨语言实体' },
  { id: 'memory_agent', name: '分层记忆', icon: MemoryIcon, color: '#3b82f6', desc: '检索工作记忆、情景上下文与 L3 认知画像' },
  { id: 'knowledge_agent', name: '知识检索', icon: BookIcon, color: '#0ea5e9', desc: '匹配官方课程标准、对外汉语知识库与教具' },
  { id: 'profile_agent', name: '画像匹配', icon: ProfileIcon, color: '#8b5cf6', desc: '对齐学员母语认知偏见与 HSK 等级梯度' },
  { id: 'orchestrator_agent', name: '教学策略', icon: OrchestratorIcon, color: '#ec4899', desc: '制定脚手架进阶方案与双语解释模式' },
  { id: 'teaching_agent', name: '教学生成', icon: TeachingIcon, color: '#f59e0b', desc: '生成五大标准教学模块与三行对照例句' },
  { id: 'multimodal_agent', name: '多模态直出', icon: MultimodalIcon, color: '#14b8a6', desc: '直出黑白线稿简笔画、微课视频与笔顺教具' },
  { id: 'validator_agent', name: '质量验证', icon: ShieldCheckIcon, color: '#22c55e', desc: '五维学术适切度评分与母语混淆安全拦截' }
]

/**
 * 格式化时间戳并计算时间差
 */
const formatDuration = (ms) => {
  if (ms === null || ms === undefined || isNaN(ms)) return null
  if (ms < 1000) return `${Math.max(10, Math.round(ms))}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * 格式化 Agent 输出结果文本
 */
const formatAgentOutput = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    try {
      if (val.summary) return val.summary
      if (val.message) return val.message
      if (val.result) return typeof val.result === 'string' ? val.result : JSON.stringify(val.result)
      return JSON.stringify(val, null, 2)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

export default function AgentProcessTimeline({ agentProcess = [], defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // 1. 归一化输入数据
  let rawEvents = []
  try {
    if (Array.isArray(agentProcess)) {
      rawEvents = agentProcess
    } else if (typeof agentProcess === 'string' && agentProcess.trim()) {
      const parsed = JSON.parse(agentProcess)
      rawEvents = Array.isArray(parsed) ? parsed : Object.values(parsed)
    } else if (typeof agentProcess === 'object' && agentProcess !== null) {
      rawEvents = Object.values(agentProcess)
    }
  } catch (err) {
    console.warn('Failed to parse agentProcess in admin review:', err)
  }

  if (!rawEvents || rawEvents.length === 0) {
    return null
  }

  // 2. 映射各个 Agent 的 start/complete 事件
  let totalCalculatedDuration = 0
  let earliestTime = null
  let latestTime = null
  let completedCount = 0

  const agentSteps = AGENT_PIPELINE.map((agentDef) => {
    // 兼容标准格式与 SSE 原始格式
    const matchingEvents = rawEvents.filter((e) => {
      const agentId = e.agent || e.payload?.agent
      return agentId === agentDef.id
    })

    const startEv = matchingEvents.find(
      (e) => e.status === 'start' || e.type === 'agent_start'
    )
    const completeEv = matchingEvents.find(
      (e) => e.status === 'complete' || e.type === 'agent_complete'
    )

    let durationMs = null
    const startTs = startEv?.timestamp ? new Date(startEv.timestamp).getTime() : null
    const completeTs = completeEv?.timestamp ? new Date(completeEv.timestamp).getTime() : null

    if (startTs && !isNaN(startTs)) {
      if (!earliestTime || startTs < earliestTime) earliestTime = startTs
    }
    if (completeTs && !isNaN(completeTs)) {
      if (!latestTime || completeTs > latestTime) latestTime = completeTs
    }

    if (startTs && completeTs && completeTs >= startTs) {
      durationMs = completeTs - startTs
      totalCalculatedDuration += durationMs
    }

    const isDone = Boolean(completeEv)
    if (isDone) completedCount++

    const message = completeEv?.message || 
                    completeEv?.payload?.result || 
                    completeEv?.payload?.message || 
                    startEv?.message || 
                    startEv?.payload?.message || 
                    ''

    return {
      ...agentDef,
      isDone,
      durationText: formatDuration(durationMs),
      output: formatAgentOutput(message)
    }
  })

  // 计算总耗时
  let totalDurationText = ''
  if (earliestTime && latestTime && latestTime >= earliestTime) {
    totalDurationText = formatDuration(latestTime - earliestTime)
  } else if (totalCalculatedDuration > 0) {
    totalDurationText = formatDuration(totalCalculatedDuration)
  }

  return (
    <div className={`agent-process-timeline-card ${expanded ? 'expanded' : 'collapsed'}`}>
      {/* 顶部可交互折叠栏 */}
      <div 
        className="timeline-header" 
        onClick={() => setExpanded(!expanded)} 
        title={expanded ? '点击收起智能体推演轴' : '点击展开查看 8 大智能体协同推演详情'}
      >
        <div className="header-left">
          <div className="header-brain-icon">
            <BrainIcon size={18} />
          </div>
          <span className="header-title">智能体协同推演流水线</span>
          <span className="header-badge completed-badge">
            <CheckIcon size={12} /> {completedCount}/{AGENT_PIPELINE.length} 阶段完成
          </span>
          {totalDurationText && (
            <span className="header-badge duration-badge">
              <ClockIcon size={12} /> {totalDurationText}
            </span>
          )}
        </div>

        <div className="header-right">
          <span className="toggle-text">{expanded ? '收起' : '展开详情'}</span>
          <span className={`toggle-arrow ${expanded ? 'open' : ''}`}>
            <ChevronIcon size={16} direction={expanded ? 'up' : 'down'} />
          </span>
        </div>
      </div>

      {/* 展开内容：垂直时间轴与执行输出 */}
      {expanded && (
        <div className="timeline-body">
          <div className="timeline-list">
            {agentSteps.map((step, idx) => {
              const isLast = idx === agentSteps.length - 1
              const IconComp = step.icon

              return (
                <div key={step.id} className={`timeline-node ${step.isDone ? 'done' : 'pending'}`}>
                  {/* 连接线与彩色节点 */}
                  <div className="node-rail">
                    <div 
                      className="node-dot" 
                      style={{ 
                        backgroundColor: step.isDone ? step.color : 'var(--border)',
                        boxShadow: step.isDone ? `0 0 10px ${step.color}40` : 'none'
                      }}
                    >
                      <IconComp size={13} color="#ffffff" />
                    </div>
                    {!isLast && <div className="node-line" />}
                  </div>

                  {/* 节点详情主体 */}
                  <div className="node-content">
                    <div className="node-top-bar">
                      <div className="node-title-group">
                        <span className="node-name" style={{ color: step.isDone ? step.color : 'var(--text-secondary)' }}>
                          {step.name}
                        </span>
                        <span className="node-id">({step.id})</span>
                      </div>

                      <div className="node-meta-group">
                        {step.durationText && (
                          <span className="node-duration-chip">
                            ⏱ {step.durationText}
                          </span>
                        )}
                        <span className={`node-status-pill ${step.isDone ? 'success' : 'pending'}`}>
                          {step.isDone ? '已完成' : '推演中'}
                        </span>
                      </div>
                    </div>

                    <div className="node-desc">{step.desc}</div>

                    {/* 节点输出或决策结论抽屉 */}
                    {step.output && (
                      <div className="node-output-drawer">
                        <span className="output-tag">决策产出:</span>
                        <span className="output-content">{step.output}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
