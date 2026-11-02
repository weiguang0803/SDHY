import React, { useState } from 'react'
import useAuthStore from '../../stores/authStore'
import { knowledgeApi } from '../../services/knowledgeApi'
import ThemeToggle from '../Common/ThemeToggle'
import './KnowledgeAuth.css'

// 专属 SVG 矢量图标
const KnowledgeMatrixLogo = () => (
  <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="kMatrixGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0ea5e9"/>
        <stop offset="50%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#kMatrixGrad)" fillOpacity="0.15"/>
    <rect x="2" y="2" width="60" height="60" rx="14" stroke="url(#kMatrixGrad)" strokeWidth="2" strokeOpacity="0.5"/>
    <path d="M18 22H46M18 32H46M18 42H36" stroke="url(#kMatrixGrad)" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="44" cy="42" r="4" fill="#0ea5e9"/>
    <path d="M44 42L48 46" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round"/>
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

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

export default function KnowledgeAuth() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    display_name: '',
    role: 'collector',
    secret_key: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore(state => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const res = await knowledgeApi.login({
          username: formData.username,
          password: formData.password
        })
        login(res.user, res.access_token)
      } else {
        const res = await knowledgeApi.register({
          username: formData.username,
          password: formData.password,
          display_name: formData.display_name,
          role: formData.role,
          secret_key: formData.secret_key
        })
        login(res.user, res.access_token)
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
    <div className="auth-container">
      {/* 顶部右侧主题切换 */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
        <ThemeToggle />
      </div>

      {/* 动态深空背景光效 */}
      <div className="auth-bg-ambient-1"></div>
      <div className="auth-bg-ambient-2"></div>
      <div className="auth-bg-grid"></div>
      
      <div className="auth-card glass-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <KnowledgeMatrixLogo />
          </div>
          <h1>师道汉韵</h1>
          <p className="auth-subtitle">国际中文教育 · 知识管理与多模态治理中心</p>
          <div className="auth-role-tags">
            <span className="role-chip collector">
              <EditIcon /> 采集员采编
            </span>
            <span className="role-chip reviewer">
              <CheckCircleIcon /> 审核员核验
            </span>
            <span className="role-chip admin">
              <ShieldIcon /> 管理员统筹
            </span>
          </div>
        </div>

        {/* 模式切换选项卡 */}
        <div className="knowledge-mode-tabs">
          <button 
            type="button"
            className={`mode-tab-item ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            工作账号登录
          </button>
          <button 
            type="button"
            className={`mode-tab-item ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            新成员秘钥注册
          </button>
        </div>

        {error && (
          <div className="auth-alert error animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="knowledge-input-wrapper">
            <span className="input-icon-adornment"><UserIcon /></span>
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="请输入工作账号用户名"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="knowledge-input-wrapper">
            <span className="input-icon-adornment"><LockIcon /></span>
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
            <div className="knowledge-register-fields animate-slide-up">
              <div className="knowledge-input-wrapper">
                <span className="input-icon-adornment"><SparklesIcon /></span>
                <input 
                  type="text" 
                  name="display_name" 
                  required 
                  placeholder="真实姓名 / 教师称谓 (如：张老师)"
                  value={formData.display_name}
                  onChange={handleChange}
                />
              </div>

              <div className="role-select-section">
                <label className="role-section-label">分配工作角色 (Select Role)</label>
                <div className="role-radio-group">
                  <label className={`role-radio-card ${formData.role === 'collector' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="collector" 
                      checked={formData.role === 'collector'}
                      onChange={handleChange}
                    />
                    <div className="role-card-header">
                      <EditIcon />
                      <span className="role-card-title">采集员</span>
                    </div>
                    <span className="role-card-desc">多模态采编 / AI辅助生成</span>
                  </label>
                  
                  <label className={`role-radio-card ${formData.role === 'reviewer' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="reviewer" 
                      checked={formData.role === 'reviewer'}
                      onChange={handleChange}
                    />
                    <div className="role-card-header">
                      <CheckCircleIcon />
                      <span className="role-card-title">审核员</span>
                    </div>
                    <span className="role-card-desc">教学严谨性审核 / 批注驳回</span>
                  </label>

                  <label className={`role-radio-card ${formData.role === 'admin' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin" 
                      checked={formData.role === 'admin'}
                      onChange={handleChange}
                    />
                    <div className="role-card-header">
                      <ShieldIcon />
                      <span className="role-card-title">管理员</span>
                    </div>
                    <span className="role-card-desc">全景大屏 / 词条发布与调度</span>
                  </label>
                </div>
              </div>

              <div className="knowledge-input-wrapper">
                <span className="input-icon-adornment"><KeyIcon /></span>
                <input 
                  type="password" 
                  name="secret_key" 
                  required 
                  placeholder="请输入平台授权注册秘钥"
                  value={formData.secret_key}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="knowledge-spinner"></span>
            ) : (
              <>
                <span>{isLogin ? '进入知识管理工作台' : '提交授权并开通账号'}</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? '新教师或工作人员？输入秘钥申请注册 ➔' : '已有工作账号？直接登录 ➔'}
          </button>
        </div>
      </div>
    </div>
  )
}
