import React, { useState, useEffect } from 'react'
import { knowledgeApi } from '../../services/knowledgeApi'
import { formatDateTime } from '../../utils/date'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  ClockIcon, 
  FileTextIcon, 
  ImageIcon, 
  VideoIcon 
} from '../Common/Icons'
import EntryDetailModal from '../Common/EntryDetailModal'
import './ReviewerCenter.css'

export default function ReviewerCenter({ user }) {
  const [activeView, setActiveView] = useState('pending') // 'pending', 'all'
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 审核操作
  const [reviewingEntry, setReviewingEntry] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [inspectEntryId, setInspectEntryId] = useState(null)
  const [msg, setMsg] = useState('')

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await knowledgeApi.getEntries({
        status: activeView === 'pending' ? 'pending_review' : 'all',
        scope: 'all'
      })
      setEntries(res.items || [])
    } catch (err) {
      console.error('Failed to load reviewer entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [activeView])

  const handleApprove = async (entry) => {
    if (!window.confirm(`确认审核通过词条【${entry.word}】并正式入库上线吗？`)) return
    setProcessing(true)
    try {
      await knowledgeApi.reviewEntry(entry.id, {
        action: 'approve',
        comment: '审核通过入库'
      })
      setMsg(`词条【${entry.word}】已审核通过入库！`)
      fetchEntries()
    } catch (err) {
      alert('审核操作失败: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleOpenReject = (entry) => {
    setReviewingEntry(entry)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('请务必填写具体的驳回修改理由！')
      return
    }
    setProcessing(true)
    try {
      await knowledgeApi.reviewEntry(reviewingEntry.id, {
        action: 'reject',
        comment: rejectReason.trim()
      })
      setMsg(`词条【${reviewingEntry.word}】已被驳回，理由已同步给采集员`)
      setShowRejectModal(false)
      setReviewingEntry(null)
      fetchEntries()
    } catch (err) {
      alert('驳回操作失败: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="reviewer-center animate-fade-in">
      {/* 顶栏视图切换 */}
      <div className="reviewer-top-bar glass-card">
        <div className="tab-group">
          <button 
            className={`tab-item ${activeView === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveView('pending')}
          >
            <ClockIcon size={16} /> 待审核词条队列
          </button>
          <button 
            className={`tab-item ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => setActiveView('all')}
          >
            <FileTextIcon size={16} /> 全量知识库词条巡检
          </button>
        </div>
      </div>

      {msg && (
        <div className="reviewer-alert-banner animate-fade-in">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">加载审核列表中...</div>
      ) : entries.length === 0 ? (
        <div className="empty-state glass-card">
          <p>{activeView === 'pending' ? '当前暂无待审核词条，所有任务已处理完毕！' : '暂无词条记录'}</p>
        </div>
      ) : (
        <div className="reviewer-list">
          {entries.map(item => (
            <div key={item.id} className="review-card glass-card animate-slide-up">
              <div className="review-card-main">
                <div className="review-head">
                  <div className="review-word-box">
                    <span className="review-word">{item.word}</span>
                    <span className="review-pinyin">{item.pinyin}</span>
                  </div>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'pending_review' ? '待审核' : (item.status === 'approved' ? '已入库' : '已驳回')}
                  </span>
                </div>

                <div className="review-tags-row">
                  <span className="meta-tag">{item.category}</span>
                  <span className="meta-tag">{item.hsk_level}</span>
                  <span className="applicant-text">提交申请人: {item.creator_name}</span>
                  <span className="date-text">更新时间: {formatDateTime(item.updated_at)}</span>
                </div>

                {/* 模态检查状态 */}
                <div className="modalities-preview">
                  <span className={`mod-badge ${item.has_text ? 'active' : ''}`}>
                    <FileTextIcon size={12} /> 文本释义 {item.has_text ? '已配置' : '无'}
                  </span>
                  <span className={`mod-badge ${item.has_image ? 'active' : ''}`}>
                    <ImageIcon size={12} /> 黑白简笔画 {item.has_image ? '已生成/上传' : '无'}
                  </span>
                  <span className={`mod-badge ${item.has_video ? 'active' : ''}`}>
                    <VideoIcon size={12} /> 15s微课短视频 {item.has_video ? '已生成/上传' : '无'}
                  </span>
                </div>

                <p className="review-brief">
                  <strong>释义预览：</strong>
                  {item.text_content?.explanation || item.text_content?.translation || '未提供详细释义'}
                </p>
              </div>

              <div className="review-card-actions">
                <button 
                  className="btn-secondary inspect-btn"
                  onClick={() => setInspectEntryId(item.id)}
                >
                  <EyeIcon size={16} /> 审查全模态内容
                </button>

                {item.status === 'pending_review' && (
                  <>
                    <button 
                      className="btn-danger reject-btn"
                      onClick={() => handleOpenReject(item)}
                      disabled={processing}
                    >
                      <XCircleIcon size={16} /> 驳回修改
                    </button>
                    <button 
                      className="btn-primary approve-btn"
                      onClick={() => handleApprove(item)}
                      disabled={processing}
                    >
                      <CheckCircleIcon size={16} /> 审核通过入库
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情与全模态审查弹窗 */}
      {inspectEntryId && (
        <EntryDetailModal 
          entryId={inspectEntryId} 
          onClose={() => setInspectEntryId(null)}
        />
      )}

      {/* 驳回理由填写弹窗 */}
      {showRejectModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-card animate-slide-up">
            <h3>驳回词条【{reviewingEntry?.word}】修改申请</h3>
            <p className="reject-hint">请详细填写具体的修改意见与驳回理由（该内容将同步给采集员）：</p>
            
            <textarea 
              rows="4" 
              placeholder="例如：1. 例句英文翻译存在语法偏误；2. 简笔画主题不清晰，请重新生成..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="reject-textarea"
            />

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>取消</button>
              <button 
                className="btn-danger" 
                onClick={handleConfirmReject}
                disabled={processing || !rejectReason.trim()}
              >
                {processing ? '正在提交...' : '确认驳回并通知采集员'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
