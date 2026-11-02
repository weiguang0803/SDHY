import React, { useState, useEffect } from 'react'
import { knowledgeApi } from '../../services/knowledgeApi'
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  SendIcon, 
  CheckCircleIcon,
  SearchIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon
} from '../Common/Icons'
import EntryEditor from './EntryEditor'
import EntryDetailModal from '../Common/EntryDetailModal'
import './CollectorWorkbench.css'

export default function CollectorWorkbench({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // 筛选与分页
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [hskFilter, setHskFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [scope, setScope] = useState(user.role === 'collector' ? 'mine' : 'all')
  
  // 编辑与预览弹窗
  const [editingEntry, setEditingEntry] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewEntryId, setPreviewEntryId] = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await knowledgeApi.getEntries({
        status: statusFilter,
        category: categoryFilter,
        hsk_level: hskFilter,
        keyword,
        scope
      })
      setEntries(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Fetch entries failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [statusFilter, categoryFilter, hskFilter, scope])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEntries()
  }

  const handleDelete = async (id, word) => {
    if (!window.confirm(`确定要删除词条【${word}】吗？`)) return
    try {
      await knowledgeApi.deleteEntry(id)
      setActionMsg(`词条【${word}】已删除`)
      fetchEntries()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleSubmitReview = async (id, word) => {
    try {
      await knowledgeApi.submitEntry(id)
      setActionMsg(`词条【${word}】已成功提交审核！`)
      fetchEntries()
    } catch (err) {
      alert('提交失败: ' + err.message)
    }
  }

  if (isCreating || editingEntry) {
    return (
      <EntryEditor 
        entry={editingEntry}
        userRole={user.role}
        onSave={() => {
          setIsCreating(false)
          setEditingEntry(null)
          fetchEntries()
        }}
        onCancel={() => {
          setIsCreating(false)
          setEditingEntry(null)
        }}
      />
    )
  }

  return (
    <div className="collector-workbench animate-fade-in">
      {/* 顶部操作与筛选栏 */}
      <div className="workbench-top-bar glass-card">
        <div className="search-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="搜索词条名称或拼音..." 
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              <SearchIcon size={14} /> 搜索
            </button>
          </form>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">全部状态</option>
            <option value="draft">草稿 (Draft)</option>
            <option value="pending_review">待审核 (Pending)</option>
            <option value="approved">已入库 (Approved)</option>
            <option value="rejected">已驳回 (Rejected)</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">全部分类</option>
            <option value="词汇">词汇</option>
            <option value="语法">语法</option>
            <option value="发音">发音</option>
            <option value="汉字">汉字</option>
            <option value="对话">对话</option>
            <option value="文化">文化</option>
            <option value="HSK">HSK</option>
          </select>

          <select value={scope} onChange={e => setScope(e.target.value)}>
            <option value="all">查看全员词条库</option>
            <option value="mine">仅看我创建的词条</option>
          </select>
        </div>

        <button className="btn-primary new-entry-btn" onClick={() => setIsCreating(true)}>
          <PlusIcon size={16} /> 新建知识词条
        </button>
      </div>

      {actionMsg && (
        <div className="action-banner animate-fade-in">
          <span>✓ {actionMsg}</span>
          <button onClick={() => setActionMsg('')}>×</button>
        </div>
      )}

      {/* 词条卡片列表 */}
      {loading ? (
        <div className="loading-state">正在检索词条库...</div>
      ) : entries.length === 0 ? (
        <div className="empty-state glass-card">
          <p>暂无符合条件的知识词条</p>
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            <PlusIcon size={16} /> 立即创建第一个词条
          </button>
        </div>
      ) : (
        <div className="entries-grid">
          {entries.map(item => (
            <div key={item.id} className="entry-card glass-card animate-slide-up">
              <div className="card-top">
                <div className="card-title-group">
                  <h3 className="card-word">{item.word}</h3>
                  <span className="card-pinyin">{item.pinyin}</span>
                </div>
                <span className={`status-badge ${item.status}`}>
                  {item.status === 'draft' && '草稿'}
                  {item.status === 'pending_review' && '待审核'}
                  {item.status === 'approved' && '已入库'}
                  {item.status === 'rejected' && '已驳回'}
                </span>
              </div>

              <div className="card-meta">
                <span className="meta-tag">{item.category}</span>
                <span className="meta-tag">{item.hsk_level}</span>
                <span className="creator-text">创建者: {item.creator_name}</span>
              </div>

              {/* 三大模态图标点亮 */}
              <div className="modality-badges">
                <span className={`mod-badge ${item.has_text ? 'active' : ''}`} title={item.has_text ? '已包含文本释义' : '缺少文本'}>
                  <FileTextIcon size={12} /> 文本 {item.has_text ? '✓' : '-'}
                </span>
                <span className={`mod-badge ${item.has_image ? 'active' : ''}`} title={item.has_image ? '已生成/上传简笔画' : '缺少图片'}>
                  <ImageIcon size={12} /> 简笔画 {item.has_image ? '✓' : '-'}
                </span>
                <span className={`mod-badge ${item.has_video ? 'active' : ''}`} title={item.has_video ? '已生成/上传短视频' : '缺少视频'}>
                  <VideoIcon size={12} /> 短视频 {item.has_video ? '✓' : '-'}
                </span>
              </div>

              {/* 释义预览 */}
              <p className="card-explanation">
                {item.text_content?.explanation || item.text_content?.translation || '暂无文本释义'}
              </p>

              {/* 底部按钮栏 */}
              <div className="card-actions">
                <button 
                  className="btn-icon" 
                  title="查看完整详情"
                  onClick={() => setPreviewEntryId(item.id)}
                >
                  <EyeIcon size={16} /> 详情
                </button>

                {(user.role === 'admin' || item.created_by === user.id) && (
                  <button 
                    className="btn-icon" 
                    title="编辑词条"
                    onClick={() => setEditingEntry(item)}
                  >
                    <EditIcon size={16} /> 编辑
                  </button>
                )}

                {item.status === 'draft' && (
                  <button 
                    className="btn-icon submit-btn" 
                    title="提交审核"
                    onClick={() => handleSubmitReview(item.id, item.word)}
                  >
                    <SendIcon size={16} /> 提审
                  </button>
                )}

                {(user.role === 'admin' || (user.role === 'collector' && item.status === 'draft')) && (
                  <button 
                    className="btn-icon danger" 
                    title="删除词条"
                    onClick={() => handleDelete(item.id, item.word)}
                  >
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 词条详情弹窗 */}
      {previewEntryId && (
        <EntryDetailModal 
          entryId={previewEntryId} 
          onClose={() => setPreviewEntryId(null)}
        />
      )}
    </div>
  )
}
