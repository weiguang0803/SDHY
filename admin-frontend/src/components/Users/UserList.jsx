import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/adminApi'
import { 
  SearchIcon, 
  EyeIcon, 
  ChatIcon, 
  TrashIcon, 
  LockIcon, 
  UnlockIcon,
  GraduationCapIcon,
  BookOpenIcon
} from '../Common/AdminIcons'
import UserDetail from './UserDetail'
import useAdminStore from '../../stores/adminStore'
import './UserList.css'

const UserList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeTab, setActiveTab] = useState('learners') // 'learners' (学员), 'knowledge_staff' (知识平台成员)

  const [allowRegistration, setAllowRegistration] = useState(true)
  const [configLoading, setConfigLoading] = useState(false)
  
  const setCurrentPage = useAdminStore(state => state.setCurrentPage)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getUsers()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    adminApi.getSystemConfig()
      .then(res => {
        if (res && typeof res.allow_registration === 'boolean') {
          setAllowRegistration(res.allow_registration)
        }
      })
      .catch(console.error)
  }, [])

  const handleToggleRegConfig = async () => {
    const nextVal = !allowRegistration
    const actionText = nextVal ? '开放' : '关闭'
    if (!window.confirm(`确定要${actionText}新学员注册功能吗？\n${nextVal ? '开启后，学员端登录页面将恢复显示“注册”选项卡。' : '关闭后，学员端登录页面将隐藏“注册”选项卡，拒绝任何新账号注册。'}`)) return

    setConfigLoading(true)
    try {
      await adminApi.updateSystemConfig({ allow_registration: nextVal })
      setAllowRegistration(nextVal)
    } catch (err) {
      alert('更新失败: ' + err.message)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`确定要彻底删除用户 [${userName}] 吗？`)) return
    
    try {
      await adminApi.deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.is_active !== false
    const nextStatus = !isCurrentlyActive
    const actionName = nextStatus ? '恢复' : '暂停'
    const confirmMsg = nextStatus 
      ? `确定要恢复用户 [${user.display_name || user.username}] 的登录权限吗？`
      : `确定要暂停用户 [${user.display_name || user.username}] 的登录权限吗？\n该用户的历史数据将完整保留，仅限制登录。`

    if (!window.confirm(confirmMsg)) return

    try {
      await adminApi.updateUserStatus(user.id, nextStatus)
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: nextStatus } : u))
    } catch (err) {
      alert(`${actionName}失败: ` + err.message)
    }
  }

  const handleViewConversations = (userId) => {
    setCurrentPage('conversations')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
  }

  // 区分学员用户与知识平台工作成员
  const learnerUsers = users.filter(u => !u.role || u.role === 'user')
  const knowledgeStaffUsers = users.filter(u => ['collector', 'reviewer', 'admin'].includes(u.role))

  const activeUserList = (activeTab === 'learners' ? learnerUsers : knowledgeStaffUsers).filter(u => 
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="staff-role-badge admin">管理员</span>
      case 'reviewer':
        return <span className="staff-role-badge reviewer">审核员</span>
      case 'collector':
        return <span className="staff-role-badge collector">采集员</span>
      default:
        return <span className="staff-role-badge user">学员</span>
    }
  }

  return (
    <div className="user-list-page">
      {/* 顶部标签切换与控制栏 */}
      <div className="user-category-tabs">
        <button 
          className={`user-cat-tab ${activeTab === 'learners' ? 'active' : ''}`}
          onClick={() => setActiveTab('learners')}
        >
          <span className="tab-icon"><GraduationCapIcon size={18} /></span>
          <span className="tab-text">学习端学员用户</span>
          <span className="tab-count-badge">{learnerUsers.length}</span>
        </button>
        <button 
          className={`user-cat-tab ${activeTab === 'knowledge_staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge_staff')}
        >
          <span className="tab-icon"><BookOpenIcon size={18} /></span>
          <span className="tab-text">知识管理平台成员</span>
          <span className="tab-count-badge">{knowledgeStaffUsers.length}</span>
        </button>
      </div>

      <div className="page-header">
        <div className="search-box">
          <SearchIcon size={18} />
          <input 
            type="text" 
            placeholder="搜索用户名、姓名或邮箱..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'learners' && (
          <div className="reg-toggle-card">
            <span className="reg-label">学员注册开放：</span>
            <button 
              className={`reg-toggle-btn ${allowRegistration ? 'enabled' : 'disabled'}`}
              onClick={handleToggleRegConfig}
              disabled={configLoading}
              title={allowRegistration ? '点击关闭新用户注册' : '点击开放新用户注册'}
            >
              {allowRegistration ? '● 已开放注册' : '● 已禁止注册'}
            </button>
          </div>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'learners' ? (
          /* ================= 学员用户表格 ================= */
          <table className="data-table">
            <thead>
              <tr>
                <th>学员</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th className="col-center">母语背景</th>
                <th className="col-center">中文等级</th>
                <th className="col-center">状态</th>
                <th className="col-center">学习对话数</th>
                <th className="col-center">互动消息数</th>
                <th className="col-center">注册时间</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {activeUserList.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-state">暂无学员用户数据</td>
                </tr>
              ) : (
                activeUserList.map(user => {
                  const convCount = user.conversation_count ?? user.conversations_count ?? 0
                  const msgCount = user.message_count ?? user.messages_count ?? 0
                  const userEmail = user.email || `${user.username}@gmail.com`
                  const isActive = user.is_active !== false
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar">{user.display_name?.[0] || user.username?.[0] || 'U'}</div>
                          <span>{user.display_name || '-'}</span>
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td><span className="email-text">{userEmail}</span></td>
                      <td className="col-center"><span className="badge">{user.native_language || '未知'}</span></td>
                      <td className="col-center">{user.chinese_level || '-'}</td>
                      <td className="col-center">
                        <span className={`status-badge ${isActive ? 'active' : 'suspended'}`}>
                          {isActive ? '● 正常' : '● 已暂停'}
                        </span>
                      </td>
                      <td className="col-center"><strong>{convCount}</strong></td>
                      <td className="col-center"><strong>{msgCount}</strong></td>
                      <td className="col-center">{formatDate(user.created_at)}</td>
                      <td className="col-actions">
                        <div className="actions">
                          <button className="action-btn view" onClick={() => setSelectedUser(user)} title="查看学习画像">
                            <EyeIcon size={16} />
                          </button>
                          <button 
                            className={`action-btn ${isActive ? 'pause' : 'resume'}`} 
                            onClick={() => handleToggleStatus(user)} 
                            title={isActive ? '暂停登录' : '恢复登录'}
                          >
                            {isActive ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
                          </button>
                          <button className="action-btn chat" onClick={() => handleViewConversations(user.id)} title="查看对话记录">
                            <ChatIcon size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(user.id, user.display_name || user.username)} title="永久删除">
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        ) : (
          /* ================= 知识平台成员表格 ================= */
          <table className="data-table">
            <thead>
              <tr>
                <th>成员姓名</th>
                <th>用户名</th>
                <th className="col-center">平台工作身份</th>
                <th className="col-center">账号状态</th>
                <th className="col-center">已录入词条数</th>
                <th className="col-center">已审核处理数</th>
                <th className="col-center">入职/注册时间</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {activeUserList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">暂无知识平台工作人员数据</td>
                </tr>
              ) : (
                activeUserList.map(user => {
                  const isActive = user.is_active !== false
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className={`avatar staff-avatar ${user.role}`}>{user.display_name?.[0] || user.username?.[0] || 'S'}</div>
                          <span>{user.display_name || user.username}</span>
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td className="col-center">{getRoleBadge(user.role)}</td>
                      <td className="col-center">
                        <span className={`status-badge ${isActive ? 'active' : 'suspended'}`}>
                          {isActive ? '● 正常' : '● 已暂停'}
                        </span>
                      </td>
                      <td className="col-center"><strong>{user.entry_count || 0}</strong> 条</td>
                      <td className="col-center"><strong>{user.review_count || 0}</strong> 次</td>
                      <td className="col-center">{formatDate(user.created_at)}</td>
                      <td className="col-actions">
                        <div className="actions">
                          <button 
                            className={`action-btn ${isActive ? 'pause' : 'resume'}`} 
                            onClick={() => handleToggleStatus(user)} 
                            title={isActive ? '暂停登录' : '恢复登录'}
                          >
                            {isActive ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
                          </button>
                          {user.role !== 'admin' && (
                            <button className="action-btn delete" onClick={() => handleDelete(user.id, user.display_name || user.username)} title="永久删除">
                              <TrashIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <UserDetail 
          userId={selectedUser.id} 
          onClose={() => setSelectedUser(null)} 
          onStatusChange={(newStatus) => {
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, is_active: newStatus } : u))
          }}
        />
      )}
    </div>
  )
}

export default UserList
