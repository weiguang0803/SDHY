import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/adminApi'
import { SearchIcon, TrashIcon, EyeIcon } from '../Common/AdminIcons'
import ConvDetail from './ConvDetail'
import './ConvList.css'
import useAdminStore from '../../stores/adminStore'

const ConvList = () => {
  const [conversations, setConversations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [viewingConvId, setViewingConvId] = useState(null)
  const { analyticsConversation, clearAnalyticsConversation, setCurrentPage } = useAdminStore()
  const [analyticsOrigin, setAnalyticsOrigin] = useState(null)

  useEffect(() => {
    if (analyticsConversation) {
      setViewingConvId(analyticsConversation.conversationId)
      setAnalyticsOrigin(analyticsConversation)
      clearAnalyticsConversation()
    }
  }, [analyticsConversation, clearAnalyticsConversation])

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(console.error)
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getConversations(selectedUserId || null)
      setConversations(data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [selectedUserId])

  const handleDelete = async (convId) => {
    if (!window.confirm('确定要清理此对话记录吗？')) return
    try {
      await adminApi.deleteConversation(convId)
      setConversations(conversations.filter(c => c.id !== convId))
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  const filteredConvs = conversations.filter(c => {
    const title = c.title || ''
    const uName = c.user_display_name || c.display_name || ''
    return title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           uName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="conv-list-page">
      <div className="filters-bar">
        <div className="search-box">
          <SearchIcon size={18} />
          <input 
            type="text" 
            placeholder="搜索对话标题或用户名..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="user-filter"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">全部用户</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="conv-grid">
          {filteredConvs.length === 0 ? (
            <div className="empty-state">未找到匹配的对话记录</div>
          ) : (
            filteredConvs.map(conv => {
              const uName = conv.user_display_name || conv.display_name || '未知用户'
              const msgCount = conv.message_count ?? conv.messages_count ?? 0
              const isSoftDeleted = conv.is_deleted === true
              return (
                <div key={conv.id} className={`conv-card ${isSoftDeleted ? 'soft-deleted' : ''}`}>
                  <div className="conv-card-header">
                    <h3 className="title">{conv.title || '新对话'}</h3>
                    <span className="msg-count">{msgCount} 条消息</span>
                  </div>
                  
                  <div className="conv-card-body">
                    <div className="user-info">
                      <div className="avatar-sm">{uName[0] || 'U'}</div>
                      <span>{uName}</span>
                    </div>

                    {isSoftDeleted ? (
                      <div className="deletion-behavior-log" style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: 'var(--error)',
                        fontSize: '12px'
                      }}>
                        用户已于 {formatDateTime(conv.deleted_at)} 执行假删除 (数据留存)
                      </div>
                    ) : (
                      <div className="date-info">
                        <div>创建于: {formatDate(conv.created_at)}</div>
                        <div>更新于: {formatDate(conv.updated_at)}</div>
                      </div>
                    )}
                  </div>

                  <div className="conv-card-footer">
                    <button className="btn-view" onClick={() => setViewingConvId(conv.id)}>
                      <EyeIcon size={16} /> 查看详情与记录
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(conv.id)} title="管理员清理">
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {viewingConvId && (
        <ConvDetail 
          convId={viewingConvId} 
          highlightMessageId={analyticsOrigin?.conversationId === viewingConvId ? analyticsOrigin.messageId : null}
          onReturnToAnalytics={analyticsOrigin?.conversationId === viewingConvId ? () => setCurrentPage('analytics') : undefined}
          onClose={() => { setViewingConvId(null); setAnalyticsOrigin(null) }}
          onDelete={() => {
            handleDelete(viewingConvId)
            setViewingConvId(null)
          }}
        />
      )}
    </div>
  )
}

export default ConvList
