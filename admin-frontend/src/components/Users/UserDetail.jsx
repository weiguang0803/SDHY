import React, { useState, useEffect } from 'react'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts'
import { adminApi } from '../../services/adminApi'
import { 
  CloseIcon, ChatIcon, LockIcon, UnlockIcon, ArrowLeftIcon, 
  MessageIcon, CalendarIcon, BookOpenIcon, GraduationCapIcon, BrainIcon 
} from '../Common/AdminIcons'
import './UserDetail.css'

const UserDetail = ({ userId, onClose, onStatusChange }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'learning_record' | 'conversations' | 'actions'
  const [actionLoading, setActionLoading] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('sdhy_theme') || 'dark'
  })

  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail?.theme || document.documentElement.getAttribute('data-theme') || 'dark'
      setCurrentTheme(newTheme)
    }
    window.addEventListener('sdhy_theme_change', handleThemeChange)
    return () => window.removeEventListener('sdhy_theme_change', handleThemeChange)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setChartReady(false)
        const data = await adminApi.getUserDetail(userId)
        setUser(data)
        // 延时等待弹窗展开与DOM尺寸计算稳定，确保首次弹出时触发平滑入场动效
        setTimeout(() => {
          setChartReady(true)
        }, 150)
      } catch (err) {
        console.error('Failed to load user details', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
  }

  const handleToggleStatus = async () => {
    if (!user) return
    const isCurrentlyActive = user.is_active !== false
    const nextStatus = !isCurrentlyActive
    const actionName = nextStatus ? '恢复' : '暂停'
    const confirmMsg = nextStatus 
      ? `确定要恢复用户 [${user.display_name || user.username}] 的登录权限吗？`
      : `确定要暂停用户 [${user.display_name || user.username}] 的登录权限吗？\n该用户的历史对话与学习认知画像将完整保留。`

    if (!window.confirm(confirmMsg)) return

    setActionLoading(true)
    try {
      await adminApi.updateUserStatus(user.id, nextStatus)
      const updated = { ...user, is_active: nextStatus }
      setUser(updated)
      if (onStatusChange) onStatusChange(nextStatus)
    } catch (err) {
      alert(`${actionName}失败: ` + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const isActive = user?.is_active !== false
  const stats = user?.stats || {}
  const cogProfile = user?.learning_profile || {}
  const radarScores = cogProfile.radar_scores || {
    listening: 70,
    speaking: 65,
    reading: 75,
    vocab: 68,
    grammar: 60
  }

  // 格式化雷达图数据（严格匹配参考图的五维属性）
  const radarData = [
    { subject: '听力', score: radarScores.listening ?? 70, fullMark: 100 },
    { subject: '口语', score: radarScores.speaking ?? 65, fullMark: 100 },
    { subject: '阅读', score: radarScores.reading ?? 75, fullMark: 100 },
    { subject: '词汇', score: radarScores.vocab ?? 68, fullMark: 100 },
    { subject: '语法', score: radarScores.grammar ?? 60, fullMark: 100 },
  ]

  const isLight = currentTheme === 'light'
  const pieBorder = isLight ? '#ffffff' : '#1e293b'
  const radarGridColor = isLight ? '#cbd5e1' : '#334155'
  const radarTextColor = isLight ? '#475569' : '#94A3B8'
  const tooltipStyle = isLight ? {
    background: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#0F172A',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
  } : {
    background: '#0F172A',
    borderColor: '#334155',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#F1F5F9',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)'
  }
  const tooltipItemStyle = { color: isLight ? '#0F172A' : '#F1F5F9', fontSize: '12px', fontWeight: 500 }
  const tooltipLabelStyle = { color: isLight ? '#64748B' : '#94A3B8', fontSize: '12px' }

  // 环形图数据
  const topicData = (user?.topic_distribution && user.topic_distribution.length > 0) 
    ? user.topic_distribution 
    : [
        { name: '日常交流', value: 32, color: '#3B82F6' },
        { name: '语法讲解', value: 24, color: '#06B6D4' },
        { name: '词汇学习', value: 18, color: '#F59E0B' },
        { name: '文化知识', value: 14, color: '#EC4899' },
        { name: '其他', value: 12, color: '#8B5CF6' }
      ]

  // 最近学习记录
  const recentRecords = (user?.recent_learning_records && user.recent_learning_records.length > 0)
    ? user.recent_learning_records
    : [
        { topic: '餐馆点餐用语', type: 'chat', time: '04-20 16:30' },
        { topic: '现在进行时的用法', type: 'grammar', time: '04-20 14:12' },
        { topic: '中国春节的文化内涵', type: 'culture', time: '04-19 18:45' },
        { topic: '日常问候表达', type: 'chat', time: '04-19 10:22' }
      ]

  // 渲染动态趋势徽章（区分正向增长与负向波动，杜绝千篇一律）
  const renderTrendBadge = (trend) => {
    if (!trend) return null
    const text = String(trend).trim()
    const isDown = text.includes('-')
    const cleanNum = text.replace(/^[+↑↓\s-]+/, '')
    return (
      <span className={`metric-badge ${isDown ? 'down' : 'up'}`}>
        {isDown ? '↓ -' : '↑ +'}{cleanNum}
      </span>
    )
  }

  // 渲染记录图标
  const renderRecordIcon = (type) => {
    switch(type) {
      case 'grammar':
        return <div className="timeline-icon-box grammar"><BookOpenIcon size={14} /></div>
      case 'culture':
        return <div className="timeline-icon-box culture"><GraduationCapIcon size={14} /></div>
      default:
        return <div className="timeline-icon-box chat"><ChatIcon size={14} /></div>
    }
  }

  return (
    <div className="user-detail-overlay" onClick={onClose}>
      <div className="user-detail-modal animate-slide-in-up" onClick={e => e.stopPropagation()}>
        {/* 顶部导航控制条 */}
        <div className="modal-top-bar">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeftIcon size={18} />
            <span>学员详情</span>
          </button>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <div className="loading-spinner"></div>
            <span>正在加载学员高精画像...</span>
          </div>
        ) : user ? (
          <div className="modal-body-content">
            {/* ================= 1. 学员基础卡片（对齐参考图顶区） ================= */}
            <div className="student-profile-header-card">
              <div className="student-left-info">
                <div className="student-avatar-large">
                  <div className="avatar-inner">
                    {user.display_name?.[0] || user.username?.[0] || '学'}
                  </div>
                </div>
                <div className="student-meta-col">
                  <div className="student-name-row">
                    <span className="student-name">{user.display_name || user.username}</span>
                    <span className={`status-pill ${isActive ? 'active' : 'suspended'}`}>
                      ● {isActive ? '正常' : '已暂停'}
                    </span>
                  </div>
                  <div className="student-attr-row">
                    <span className="attr-item">
                      <span className="attr-label">母语：</span>
                      <span className="attr-val">{user.native_language || '英语'}</span>
                    </span>
                    <span className="attr-item">
                      <span className="attr-label">学习水平：</span>
                      <span className="attr-val">{user.chinese_level || '中级'}</span>
                    </span>
                    <span className="attr-item">
                      <span className="attr-label">账号注册时间：</span>
                      <span className="attr-val">{formatDate(user.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="student-right-kpi">
                <div className="kpi-bullet-item">
                  <div className="kpi-bullet-left">
                    <span className="bullet-icon info">ℹ</span>
                    <span className="bullet-label">最近学习：</span>
                  </div>
                  <span className="bullet-val">{stats.last_learning_time || '2小时前'}</span>
                </div>
                <div className="kpi-bullet-item">
                  <div className="kpi-bullet-left">
                    <span className="bullet-icon lightning">•</span>
                    <span className="bullet-label">累计学习：</span>
                  </div>
                  <span className="bullet-val">{stats.total_learning_days ? `${stats.total_learning_days}天` : '48天'}</span>
                </div>
              </div>
            </div>

            {/* ================= 2. 4个核心Tab导航栏 ================= */}
            <div className="student-nav-tabs">
              <button 
                className={`student-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                学习概览
              </button>
              <button 
                className={`student-tab-btn ${activeTab === 'learning_record' ? 'active' : ''}`}
                onClick={() => setActiveTab('learning_record')}
              >
                学习记录
              </button>
              <button 
                className={`student-tab-btn ${activeTab === 'conversations' ? 'active' : ''}`}
                onClick={() => setActiveTab('conversations')}
              >
                对话历史
              </button>
              <button 
                className={`student-tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                管理操作
              </button>
            </div>

            {/* ================= 3. Tab 内容展示区 ================= */}
            {activeTab === 'overview' && (
              <div className="overview-tab-container">
                {/* 第一排：3 张核心指标卡 (严格等宽 1fr:1fr:1fr) */}
                <div className="kpi-cards-trio">
                  <div className="kpi-metric-card">
                    <div className="kpi-card-header">
                      <div className="metric-icon-wrap blue">
                        <ChatIcon size={24} />
                      </div>
                      <div className="metric-meta">
                        <span className="metric-label">对话次数</span>
                        <div className="metric-num-box">
                          <span className="metric-num">{stats.conversation_count ?? 0}</span>
                          {renderTrendBadge(stats.conversation_trend)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="kpi-metric-card">
                    <div className="kpi-card-header">
                      <div className="metric-icon-wrap cyan">
                        <MessageIcon size={24} />
                      </div>
                      <div className="metric-meta">
                        <span className="metric-label">消息数量</span>
                        <div className="metric-num-box">
                          <span className="metric-num">{stats.message_count ?? 0}</span>
                          {renderTrendBadge(stats.message_trend)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="kpi-metric-card">
                    <div className="kpi-card-header">
                      <div className="metric-icon-wrap indigo">
                        <CalendarIcon size={24} />
                      </div>
                      <div className="metric-meta">
                        <span className="metric-label">学习频率</span>
                        <div className="metric-num-box">
                          <span className="metric-num">
                            {stats.frequency_num ?? 5}
                            <span className="metric-unit"> {stats.frequency_unit || '次/周'}</span>
                          </span>
                          {renderTrendBadge(stats.frequency_trend)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 第二排：3 列并排图表与记录列表 (严格对齐上排 1fr:1fr:1fr) */}
                <div className="overview-charts-grid">
                  {/* 1. 学习内容分布 (环形图) */}
                  <div className="chart-panel-card topic-card">
                    <div className="panel-title">学习内容分布</div>
                    <div className="donut-chart-flex">
                      <div className="donut-canvas-wrap">
                        <ResponsiveContainer width={130} height={130}>
                          <PieChart key={`donut-${currentTheme}-${chartReady ? 'ready' : 'init'}`}>
                            <Pie
                              data={topicData}
                              cx="50%"
                              cy="50%"
                              innerRadius={38}
                              outerRadius={56}
                              paddingAngle={3}
                              dataKey="value"
                              stroke={pieBorder}
                              strokeWidth={2}
                              isAnimationActive={true}
                              animationBegin={100}
                              animationDuration={900}
                              animationEasing="ease-out"
                            >
                              {topicData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke={pieBorder} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value, name) => [`${value}%`, name]}
                              contentStyle={tooltipStyle}
                              itemStyle={tooltipItemStyle}
                              labelStyle={tooltipLabelStyle}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-label">
                          <span>学习主题</span>
                        </div>
                      </div>

                      <div className="donut-legend-col">
                        {topicData.map((item, idx) => (
                          <div key={idx} className="legend-row">
                            <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                            <span className="legend-text">{item.name}</span>
                            <span className="legend-pct">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. 最近学习记录 (时间轴) */}
                  <div className="chart-panel-card timeline-card">
                    <div className="panel-title">最近学习记录</div>
                    <div className="recent-records-list">
                      {recentRecords.map((rec, idx) => (
                        <div key={idx} className="record-item-row">
                          <div className="record-left">
                            {renderRecordIcon(rec.type)}
                            <span className="record-title" title={rec.topic}>{rec.topic}</span>
                          </div>
                          <span className="record-time">{rec.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. 学习画像 (五维能力雷达图) */}
                  <div className="chart-panel-card radar-card">
                    <div className="panel-title">学习画像</div>
                    <div className="radar-canvas-wrap">
                      <ResponsiveContainer width="100%" height={175}>
                        <RadarChart key={`radar-${currentTheme}-${chartReady ? 'ready' : 'init'}`} data={radarData} outerRadius="70%">
                          <PolarGrid stroke={radarGridColor} strokeOpacity={isLight ? 0.9 : 0.8} />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: radarTextColor, fontSize: 12, fontWeight: 500 }} 
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="能力指数"
                            dataKey="score"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={isLight ? 0.35 : 0.4}
                            strokeWidth={2}
                            isAnimationActive={true}
                            animationBegin={100}
                            animationDuration={900}
                            animationEasing="ease-out"
                          />
                          <RechartsTooltip 
                            formatter={(value) => [`${value}分`, '得分']}
                            contentStyle={tooltipStyle}
                            itemStyle={tooltipItemStyle}
                            labelStyle={tooltipLabelStyle}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= Tab 2: 学习记录 (L3 认知档案详情) ================= */}
            {activeTab === 'learning_record' && (
              <div className="sub-tab-panel">
                <div className="profile-section-block">
                  <div className="section-subtitle">
                    <span className="pill-indicator warning"></span>
                    <span>薄弱语法点与高频纠错（L3 智能演进沉淀）</span>
                  </div>
                  {cogProfile.weak_points && cogProfile.weak_points.length > 0 ? (
                    <div className="weak-points-grid">
                      {cogProfile.weak_points.map((wp, idx) => (
                        <div key={idx} className="weak-point-card">
                          <div className="wp-header">
                            <span className="wp-title">{wp.point}</span>
                            <span className="wp-badge">易错 {wp.error_count || 1} 次</span>
                          </div>
                          {wp.last_wrong_at && (
                            <span className="wp-time">最近纠错：{wp.last_wrong_at}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-sub-block">当前尚未记录到明显薄弱语法点，学员基础掌握良好。</div>
                  )}
                </div>

                <div className="profile-section-block" style={{ marginTop: '24px' }}>
                  <div className="section-subtitle">
                    <span className="pill-indicator success"></span>
                    <span>已掌握知识点与主题词库</span>
                  </div>
                  <div className="mastered-tags-wrap">
                    {(cogProfile.mastered_points && cogProfile.mastered_points.length > 0) ? (
                      cogProfile.mastered_points.map((mp, idx) => (
                        <span key={idx} className="mastered-tag">✓ {mp}</span>
                      ))
                    ) : (
                      <div className="empty-sub-block">暂未沉淀已掌握知识点。</div>
                    )}
                  </div>
                </div>

                <div className="profile-section-block" style={{ marginTop: '24px' }}>
                  <div className="section-subtitle">
                    <span className="pill-indicator primary"></span>
                    <span>自适应教学策略偏好</span>
                  </div>
                  <div className="strategy-card">
                    <BrainIcon size={20} />
                    <span>系统画像判定策略：<strong>{cogProfile.preference_style || '情境交际法与对比示范'}</strong>（在对话中将优先使用情境模拟与对比纠错）</span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= Tab 3: 对话历史 ================= */}
            {activeTab === 'conversations' && (
              <div className="sub-tab-panel">
                <div className="section-subtitle">
                  <span className="pill-indicator primary"></span>
                  <span>历史学习会话记录（共 {user.conversation_count ?? 0} 个）</span>
                </div>
                {user.recent_conversations && user.recent_conversations.length > 0 ? (
                  <div className="conversations-history-list">
                    {user.recent_conversations.map(conv => (
                      <div key={conv.id} className="history-conv-card">
                        <div className="conv-card-left">
                          <ChatIcon size={18} />
                          <span className="conv-card-title">{conv.title || '新对话'}</span>
                        </div>
                        <span className="conv-card-time">{formatDate(conv.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-sub-block">暂无会话记录。</div>
                )}
              </div>
            )}

            {/* ================= Tab 4: 管理操作 ================= */}
            {activeTab === 'actions' && (
              <div className="sub-tab-panel">
                <div className="section-subtitle">
                  <span className="pill-indicator danger"></span>
                  <span>学员权限与状态管控</span>
                </div>
                <div className="action-control-card">
                  <div className="action-info">
                    <h4>账号登录状态控制</h4>
                    <p>暂停后该学员将无法登录学习端，但学员在知识库中的交互、L3记忆档案和会话将得到完好保留。</p>
                  </div>
                  <button 
                    className={`btn-toggle-status ${isActive ? 'pause' : 'resume'}`}
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                  >
                    {isActive ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
                    {isActive ? '暂停该学员登录权限' : '恢复该学员登录权限'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-error-box">未找到该学员信息</div>
        )}
      </div>
    </div>
  )
}

export default UserDetail
