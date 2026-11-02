import React, { useState, useEffect } from 'react'
import { knowledgeApi } from '../../services/knowledgeApi'
import { formatDateTime } from '../../utils/date'
import { 
  ImageIcon, 
  VideoIcon, 
  BookOpenIcon, 
  HistoryIcon, 
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  SendIcon,
  SparklesIcon
} from './Icons'
import './EntryDetailModal.css'

export default function EntryDetailModal({ entryId, onClose }) {
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await knowledgeApi.getEntry(entryId)
        setEntry(data)
      } catch (err) {
        console.error('Fetch entry detail failed:', err)
      } finally {
        setLoading(false)
      }
    }
    if (entryId) {
      fetchDetail()
    }
  }, [entryId])

  if (!entryId) return null

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="detail-modal-card glass-card animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-title-group">
            <h2>{entry?.word || '词条详情'}</h2>
            <span className="detail-pinyin">{entry?.pinyin}</span>
            <span className={`status-badge ${entry?.status}`}>
              {entry?.status === 'draft' && '草稿'}
              {entry?.status === 'pending_review' && '待审核'}
              {entry?.status === 'approved' && '已入库'}
              {entry?.status === 'rejected' && '已驳回'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="loading-state">加载词条全模态数据中...</div>
        ) : !entry ? (
          <div className="empty-state">词条不存在或已删除</div>
        ) : (
          <div className="detail-body">
            {/* 基础标签属性 */}
            <div className="detail-meta-bar">
              <span className="meta-item">分类: <strong>{entry.category}</strong></span>
              <span className="meta-item">适用等级: <strong>{entry.hsk_level}</strong></span>
              <span className="meta-item">创建人: <strong>{entry.creator_name}</strong></span>
              {entry.tags?.length > 0 && (
                <div className="detail-tags">
                  {entry.tags.map((t, idx) => (
                    <span key={idx} className="tag-chip">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 三大独立模态内容展示 */}
            <div className="detail-modalities-layout">
              {/* 1. 文本内容 */}
              <div className="detail-section glass-card">
                <h4 className="section-heading">
                  <FileTextIcon size={16} /> 教学文本与例句
                </h4>
                {entry.text_content ? (
                  <div className="text-content-view">
                    {entry.text_content.translation && (
                      <div className="view-block">
                        <span className="block-label">英文释义：</span>
                        <p className="block-text highlight">{entry.text_content.translation}</p>
                      </div>
                    )}
                    {entry.text_content.explanation && (
                      <div className="view-block">
                        <span className="block-label">详细释义：</span>
                        <p className="block-text">{entry.text_content.explanation}</p>
                      </div>
                    )}
                    {entry.text_content.textbook_examples?.length > 0 && (
                      <div className="view-block">
                        <span className="block-label">规范教材例句：</span>
                        <ul className="examples-list">
                          {entry.text_content.textbook_examples.map((ex, i) => (
                            <li key={i}>
                              <div className="ex-zh">{ex.chinese}</div>
                              {ex.pinyin && <div className="ex-py">{ex.pinyin}</div>}
                              {ex.translation && <div className="ex-en">{ex.translation}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {entry.text_content.daily_examples?.length > 0 && (
                      <div className="view-block">
                        <span className="block-label">日常口语交比例句：</span>
                        <ul className="examples-list">
                          {entry.text_content.daily_examples.map((ex, i) => (
                            <li key={i}>
                              <div className="ex-zh">{ex.chinese}</div>
                              {ex.pinyin && <div className="ex-py">{ex.pinyin}</div>}
                              {ex.translation && <div className="ex-en">{ex.translation}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {entry.text_content.topic_reading && (
                      <div className="view-block">
                        <span className="block-label">文化/生活主题阅读拓展：</span>
                        <p className="block-text reading-box">{entry.text_content.topic_reading}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-hint">暂无文本释义内容</p>
                )}
              </div>

              {/* 2. 图片内容 */}
              <div className="detail-section glass-card">
                <h4 className="section-heading">
                  <ImageIcon size={16} /> 教学黑白简笔画
                </h4>
                {entry.image_content?.url ? (
                  <div className="image-content-view">
                    <img src={entry.image_content.url} alt={entry.word} className="detail-preview-img" />
                    {entry.image_content.prompt && (
                      <div className="prompt-meta">
                        <span className="prompt-label">Prompt:</span>
                        <p className="prompt-text">{entry.image_content.prompt}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-hint">暂无简笔画素材</p>
                )}
              </div>

              {/* 3. 视频内容 */}
              <div className="detail-section glass-card">
                <h4 className="section-heading">
                  <VideoIcon size={16} /> 15s 教学微课视频
                </h4>
                {entry.video_content?.url ? (
                  <div className="video-content-view">
                    <video src={entry.video_content.url} controls className="detail-preview-video" />
                    {entry.video_content.script && (
                      <div className="prompt-meta">
                        <span className="prompt-label">口语脚本:</span>
                        <p className="prompt-text">{entry.video_content.script}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-hint">暂无视频素材</p>
                )}
              </div>
            </div>

            {/* 审核与流转历史时间线 */}
            {entry.reviews?.length > 0 && (
              <div className="detail-section glass-card full-width">
                <h4 className="section-heading">
                  <HistoryIcon size={16} /> 采审交互与历史批注记录
                </h4>
                <div className="entry-review-timeline">
                  {entry.reviews.map(r => (
                    <div key={r.id} className="entry-review-item">
                      <div className="review-meta-row">
                        <span className={`action-badge ${r.action}`}>
                          {r.action === 'submit' && (
                            <span className="badge-inner"><SendIcon size={12} /> 采集员提审</span>
                          )}
                          {r.action === 'approve' && (
                            <span className="badge-inner"><CheckCircleIcon size={12} /> 审核通过</span>
                          )}
                          {r.action === 'reject' && (
                            <span className="badge-inner"><XCircleIcon size={12} /> 审核驳回</span>
                          )}
                          {r.action === 'direct_publish' && (
                            <span className="badge-inner"><SparklesIcon size={12} /> 直接入库</span>
                          )}
                        </span>
                        <span className="review-users">
                          {r.applicant_name} {r.reviewer_name ? `➔ ${r.reviewer_name}` : ''}
                        </span>
                        <span className="review-time">{formatDateTime(r.created_at, true)}</span>
                      </div>
                      {r.comment && (
                        <p className={`review-comment-box ${r.action === 'reject' ? 'reject' : ''}`}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
