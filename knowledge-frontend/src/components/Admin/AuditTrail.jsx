import React, { useState, useEffect } from 'react'
import { knowledgeApi } from '../../services/knowledgeApi'
import { formatDateTime } from '../../utils/date'
import { 
  HistoryIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  SendIcon, 
  SparklesIcon 
} from '../Common/Icons'
import './AuditTrail.css'

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await knowledgeApi.getAuditTrail(100)
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load audit trail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getActionBadge = (action) => {
    switch (action) {
      case 'submit':
        return (
          <span className="action-tag submit">
            <SendIcon size={12} /> 提交审核
          </span>
        )
      case 'approve':
        return (
          <span className="action-tag approve">
            <CheckCircleIcon size={12} /> 审核通过
          </span>
        )
      case 'reject':
        return (
          <span className="action-tag reject">
            <XCircleIcon size={12} /> 驳回修改
          </span>
        )
      case 'direct_publish':
        return (
          <span className="action-tag direct">
            <SparklesIcon size={12} /> 直接入库
          </span>
        )
      default:
        return <span className="action-tag">{action}</span>
    }
  }

  return (
    <div className="audit-trail-container animate-fade-in">
      <div className="audit-header glass-card">
        <div className="audit-title-box">
          <HistoryIcon size={22} color="var(--primary)" />
          <div>
            <h2>采编与审核全流程交互追溯 (Audit Trail)</h2>
            <p>实时记录采集员提审、审核员核验与驳回理由交互全景流水</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={fetchLogs} disabled={loading}>
          <HistoryIcon size={14} /> 刷新动态
        </button>
      </div>

      {loading ? (
        <div className="loading-state">加载交互流转日志中...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state glass-card">
          <p>暂无采审交互流转日志</p>
        </div>
      ) : (
        <div className="timeline-wrapper glass-card">
          {logs.map((item, index) => (
            <div key={item.id || index} className={`timeline-item ${item.action} animate-slide-up`}>
              <div className={`timeline-dot ${item.action}`}></div>
              <div className="timeline-content">
                <div className="timeline-top">
                  <span className="timeline-word">【{item.word}】</span>
                  {getActionBadge(item.action)}
                  <span className="timeline-time">{formatDateTime(item.created_at, true)}</span>
                </div>

                <div className="timeline-actors">
                  <span className="actor-applicant">采集员：{item.applicant_name}</span>
                  {item.reviewer_name && (
                    <span className="actor-reviewer"> ➔ 审核员：{item.reviewer_name}</span>
                  )}
                </div>

                {item.comment && (
                  <div className={`timeline-comment comment-${item.action} ${item.action === 'reject' ? 'reject-comment' : ''}`}>
                    <strong>交互意见/理由：</strong> {item.comment}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
