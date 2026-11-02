import React from 'react'
import useAuthStore from '../../stores/authStore'
import CollectorWorkbench from '../Collector/CollectorWorkbench'
import ReviewerCenter from '../Reviewer/ReviewerCenter'
import AdminKnowledgeDashboard from '../Admin/AdminKnowledgeDashboard'
import AuditTrail from '../Admin/AuditTrail'
import { 
  LogoIcon,
  BookOpenIcon, 
  CheckCircleIcon, 
  DashboardIcon, 
  HistoryIcon, 
  LogoutIcon,
  ShieldIcon
} from '../Common/Icons'
import ThemeToggle from '../Common/ThemeToggle'
import './KnowledgeLayout.css'

export default function KnowledgeLayout() {
  const { user, currentPage, setCurrentPage, logout } = useAuthStore()

  // 根据角色过滤导航
  const allNavItems = [
    { id: 'dashboard', label: '知识全景大屏', icon: <DashboardIcon size={19} />, roles: ['admin'] },
    { id: 'entries', label: user?.role === 'collector' ? '词条采编工作台' : '知识词条库', icon: <BookOpenIcon size={19} />, roles: ['admin', 'reviewer', 'collector'] },
    { id: 'reviewer', label: '词条审核中心', icon: <CheckCircleIcon size={19} />, roles: ['admin', 'reviewer'] },
    { id: 'audit', label: '采审交互追溯', icon: <HistoryIcon size={19} />, roles: ['admin'] },
  ]

  const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'collector'))

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminKnowledgeDashboard />
      case 'entries':
        return <CollectorWorkbench user={user} />
      case 'reviewer':
        return <ReviewerCenter user={user} />
      case 'audit':
        return <AuditTrail />
      default:
        return <CollectorWorkbench user={user} />
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return '超级管理员'
      case 'reviewer': return '知识审核员'
      case 'collector': return '知识采集员'
      default: return '用户'
    }
  }

  const getPageTitle = () => {
    const item = navItems.find(i => i.id === currentPage)
    return item ? item.label : '知识管理'
  }

  return (
    <div className="knowledge-layout">
      {/* 侧边栏 */}
      <aside className="k-sidebar">
        <div className="k-sidebar-header">
          <div className="k-logo">
            <LogoIcon size={38} />
          </div>
          <div className="k-brand">
            <span className="k-brand-title">师道汉韵</span>
            <span className="k-brand-badge">知识中台管理系统</span>
          </div>
        </div>

        <nav className="k-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`k-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="k-nav-icon">{item.icon}</span>
              <span className="k-nav-label">{item.label}</span>
              {currentPage === item.id && <div className="k-nav-indicator" />}
            </button>
          ))}
        </nav>

        {/* 底部用户信息 */}
        <div className="k-sidebar-footer">
          <div className="k-user-box">
            <div className={`k-avatar ${user?.role}`}>
              {user?.display_name?.[0] || user?.username?.[0] || '用'}
            </div>
            <div className="k-user-info">
              <span className="k-user-name">{user?.display_name || user?.username}</span>
              <span className={`role-badge ${user?.role}`}>{getRoleName(user?.role)}</span>
            </div>
          </div>
          <div className="k-user-actions-row">
            <ThemeToggle />
            <button className="k-logout-btn" onClick={logout} title="退出登录">
              <LogoutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 主工作区 */}
      <main className="k-main-content">
        <header className="k-topbar">
          <div className="k-breadcrumb">
            <span className="k-breadcrumb-hint">当前工作空间：</span>
            <h1>{getPageTitle()}</h1>
          </div>

          <div className="k-topbar-actions">
            <span className={`role-badge ${user?.role}`}>当前身份: {getRoleName(user?.role)}</span>
          </div>
        </header>

        <div className={`k-page-container ${currentPage === 'dashboard' ? 'is-dashboard' : ''}`} key={currentPage}>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
