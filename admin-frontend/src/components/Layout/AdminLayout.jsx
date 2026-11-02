import React from 'react'
import useAdminStore from '../../stores/adminStore'
import Dashboard from '../Dashboard/Dashboard'
import UserList from '../Users/UserList'
import ConvList from '../Conversations/ConvList'
import SystemInfo from '../Settings/SystemInfo'
import LearnerAnalytics from '../Analytics/LearnerAnalytics'
import GrowthAnalytics from '../Growth/GrowthAnalytics'
import DiagnosisCenter from '../Diagnosis/DiagnosisCenter'
import AgentObservability from '../Observability/AgentObservability'
import AskDataCenter from '../AskData/AskDataCenter'
import { 
  BrandLogoIcon,
  DashboardIcon, 
  UsersIcon, 
  ChatIcon, 
  SettingsIcon, 
  LogoutIcon,
  LearnerAnalyticsIcon,
  GrowthIcon,
  DiagnosisIcon,
  ObservabilityIcon,
  AskDataIcon
} from '../Common/AdminIcons'
import ThemeToggle from '../Common/ThemeToggle'
import './AdminLayout.css'

const AdminLayout = () => {
  const { admin, currentPage, setCurrentPage, logout } = useAdminStore()

  const navItems = [
    { id: 'dashboard', label: '控制台', icon: <DashboardIcon size={19} /> },
    { id: 'analytics', label: '学情分析中心', icon: <LearnerAnalyticsIcon size={19} />, badge: '首期' },
    { id: 'growth', label: '教学增长分析', icon: <GrowthIcon size={19} />, badge: '首期' },
    { id: 'diagnosis', label: 'AI 学情研判中心', icon: <DiagnosisIcon size={19} />, badge: '首期' },
    { id: 'observability', label: '智能体观测中心', icon: <ObservabilityIcon size={19} />, badge: '首期' },
    { id: 'ask-data', label: 'AI 智能问数台', icon: <AskDataIcon size={19} />, badge: '二期' },
    { id: 'users', label: '用户管理', icon: <UsersIcon size={19} /> },
    { id: 'conversations', label: '对话记录', icon: <ChatIcon size={19} /> },
    { id: 'settings', label: '系统设置', icon: <SettingsIcon size={19} /> },
  ]

  const renderContent = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />
      case 'analytics': return <LearnerAnalytics />
      case 'growth': return <GrowthAnalytics />
      case 'diagnosis': return <DiagnosisCenter />
      case 'observability': return <AgentObservability />
      case 'ask-data': return <AskDataCenter />
      case 'users': return <UserList />
      case 'conversations': return <ConvList />
      case 'settings': return <SystemInfo />
      default: return <Dashboard />
    }
  }

  const getPageTitle = () => {
    const item = navItems.find(i => i.id === currentPage)
    return item ? item.label : '控制台'
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-wrap">
            <BrandLogoIcon size={38} />
          </div>
          <div className="brand-text-col">
            <span className="brand-title">师道汉韵</span>
            <span className="brand-badge">教学管理中心</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              {currentPage === item.id && <div className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="avatar">{admin?.username?.[0]?.toUpperCase()}</div>
            <div className="info">
              <span className="name">{admin?.username}</span>
              <span className="role">超级管理员</span>
            </div>
          </div>
          <div className="admin-actions-row">
            <ThemeToggle />
            <button className="logout-btn" onClick={logout} title="退出登录">
              <LogoutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="hint">当前位置：</span>
            <h1>{getPageTitle()}</h1>
          </div>
        </header>
        
        <div 
          className={`page-container animate-fade-in ${['dashboard', 'analytics', 'growth', 'diagnosis', 'observability', 'ask-data'].includes(currentPage) ? 'is-dashboard' : ''}`} 
          key={currentPage}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
