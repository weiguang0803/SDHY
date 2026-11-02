import React, { useState } from 'react'
import useAdminStore from '../../stores/adminStore'
import { adminApi } from '../../services/adminApi'
import ThemeToggle from '../Common/ThemeToggle'
import './AdminLogin.css'

// 高清 SVG 科技盾徽与图标组件
const AdminShieldLogo = () => (
  <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="adminShieldGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="50%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#adminShieldGrad)" fillOpacity="0.15"/>
    <rect x="2" y="2" width="60" height="60" rx="14" stroke="url(#adminShieldGrad)" strokeWidth="2" strokeOpacity="0.5"/>
    <path d="M32 14L48 20V32C48 42.5 41.2 52.2 32 55C22.8 52.2 16 42.5 16 32V20L32 14Z" fill="url(#adminShieldGrad)" fillOpacity="0.3" stroke="url(#adminShieldGrad)" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M26 32L30 36L38 27" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  </svg>
)

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    display_name: '',
    secret_key: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAdminStore(state => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const res = await adminApi.adminLogin({
          username: formData.username,
          password: formData.password
        })
        login({ username: formData.username }, res.access_token)
      } else {
        await adminApi.adminRegister(formData)
        // Auto switch to login
        setIsLogin(true)
        setError('注册成功，请使用新账号登录')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="login-container">
      {/* 顶部右侧主题切换 */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
        <ThemeToggle />
      </div>

      {/* 科技感矩阵与光环背景 */}
      <div className="admin-ambient-orb orb-admin-1"></div>
      <div className="admin-ambient-orb orb-admin-2"></div>
      <div className="admin-cyber-grid"></div>
      
      <div className="login-card glass-card animate-slide-up">
        <div className="login-header">
          <div className="admin-logo-badge">
            <AdminShieldLogo />
          </div>
          <h1>师道汉韵</h1>
          <p className="admin-subtitle">系统综合运营与智慧管理中枢</p>
          <div className="admin-auth-badge">
            <ShieldCheckIcon /> 管理员专属特权通道 · 安全防护已就绪
          </div>
        </div>

        {/* 登录/注册模式切换 */}
        <div className="admin-mode-tabs">
          <button 
            type="button"
            className={`mode-tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            管理员登录
          </button>
          <button 
            type="button"
            className={`mode-tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            秘钥授权注册
          </button>
        </div>

        {error && (
          <div className={`alert ${error.includes('成功') ? 'success' : 'error'} animate-fade-in`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="admin-input-wrapper">
            <span className="input-adornment"><UserIcon /></span>
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="请输入管理员账号"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="admin-input-wrapper">
            <span className="input-adornment"><LockIcon /></span>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="请输入登录密码"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <div className="admin-register-fields animate-slide-up">
              <div className="admin-input-wrapper">
                <span className="input-adornment"><SparklesIcon /></span>
                <input 
                  type="text" 
                  name="display_name" 
                  required 
                  placeholder="管理员称谓 / 姓名 (如: 超级管理员)"
                  value={formData.display_name}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-input-wrapper">
                <span className="input-adornment"><KeyIcon /></span>
                <input 
                  type="password" 
                  name="secret_key" 
                  required 
                  placeholder="请输入系统授权注册秘钥"
                  value={formData.secret_key}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="admin-loading-spinner"></span>
            ) : (
              <>
                <span>{isLogin ? '进入管理控制台' : '提交授权并完成注册'}</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        <div className="toggle-mode">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? '需要开通管理账号？凭秘钥申请注册 ➔' : '已有管理员账号？返回登录 ➔'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
