import React, { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { knowledgeApi } from '../../services/knowledgeApi'
import { 
  BookOpenIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  ShieldIcon, 
  SparklesIcon,
  TrendUpIcon,
  TagIcon,
  AwardIcon
} from '../Common/Icons'
import './AdminKnowledgeDashboard.css'

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export default function AdminKnowledgeDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
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
    const loadStats = async () => {
      try {
        setLoading(true)
        setChartReady(false)
        const data = await knowledgeApi.getDashboardStats()
        setStats(data)
        // 延时等待DOM与大屏布局完全渲染稳定后挂载图表，确保触发优雅进场动效
        setTimeout(() => {
          setChartReady(true)
        }, 120)
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="loading-state">正在计算知识库全景大屏指标...</div>
  }

  const kpis = [
    { title: '知识词条总数', value: stats?.total_entries || 0, icon: <BookOpenIcon size={28} color="#0ea5e9" />, color: 'blue' },
    { title: '正式已入库', value: stats?.approved_entries || 0, icon: <CheckCircleIcon size={28} color="#10b981" />, color: 'green' },
    { title: '待审核申请', value: stats?.pending_entries || 0, icon: <ClockIcon size={28} color="#f59e0b" />, color: 'yellow' },
    { title: '已驳回重改', value: stats?.rejected_entries || 0, icon: <AlertCircleIcon size={28} color="#ef4444" />, color: 'red' },
    { title: '审核入库率', value: `${stats?.pass_rate || 0}%`, icon: <ShieldIcon size={28} color="#8b5cf6" />, color: 'purple' },
    { title: '模态覆盖 (文/图/视)', value: `${stats?.modal_stats?.text || 0} / ${stats?.modal_stats?.image || 0} / ${stats?.modal_stats?.video || 0}`, icon: <SparklesIcon size={28} color="#06b6d4" />, color: 'cyan' }
  ]

  const isLight = currentTheme === 'light'
  const gridStroke = isLight ? '#cbd5e1' : '#1e293b'
  const axisStroke = isLight ? '#94a3b8' : '#64748b'
  const axisTickColor = isLight ? '#475569' : '#94a3b8'
  const pieBorder = isLight ? '#ffffff' : '#1e293b'
  const tooltipStyle = isLight ? {
    background: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#0f172a',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
  } : {
    background: '#0f172a',
    borderColor: '#334155',
    borderRadius: 8,
    color: '#f8fafc',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
  }
  const tooltipItemStyle = { color: isLight ? '#0f172a' : '#f1f5f9', fontSize: 13, fontWeight: 500 }
  const tooltipLabelStyle = { color: isLight ? '#64748b' : '#94a3b8', fontSize: 12 }

  return (
    <div className="admin-dashboard-container animate-fade-in">
      {/* 6 大核心 KPI 指标卡片 */}
      <div className="kpi-grid">
        {kpis.map((k, idx) => (
          <div key={idx} className={`kpi-card glass-card ${k.color}`}>
            <div className="kpi-icon-wrapper">{k.icon}</div>
            <div className="kpi-info">
              <span className="kpi-title">{k.title}</span>
              <span className="kpi-value">{k.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 可视化图表区 */}
      <div className="charts-grid">
        {/* 近 7 天提审与审核通过趋势 */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <div className="chart-title-box">
              <TrendUpIcon size={20} color="var(--primary)" />
              <h3>近 7 天知识采编与审核流转趋势</h3>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart key={`k-trend-${currentTheme}-${chartReady ? 'ready' : 'init'}`} data={stats?.seven_days_trend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} tickFormatter={d => d.slice(5)} tick={{ fontSize: 13, fill: axisTickColor }} />
                <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 13, fill: axisTickColor }} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13, color: axisTickColor }} />
                <Area 
                  type="monotone" 
                  dataKey="submitted" 
                  name="新提交审核" 
                  stroke="#0ea5e9" 
                  strokeWidth={2.5} 
                  fill="url(#colorSubmitted)" 
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="approved" 
                  name="审核通过入库" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fill="url(#colorApproved)" 
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 知识类别分布 */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <div className="chart-title-box">
              <TagIcon size={20} color="var(--secondary)" />
              <h3>知识库类别分类分布</h3>
            </div>
          </div>
          <div className="chart-body" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart key={`k-pie-${currentTheme}-${chartReady ? 'ready' : 'init'}`}>
                <Pie
                  data={stats?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={118}
                  paddingAngle={4}
                  dataKey="value"
                  stroke={pieBorder}
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(stats?.category_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={pieBorder} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: isLight ? '#0f172a' : '#f1f5f9', lineHeight: 1.2 }}>
                {stats?.total_entries || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                词条总量
              </div>
            </div>
          </div>
        </div>

        {/* 采集员贡献排行 */}
        <div className="chart-card glass-card full-width-chart">
          <div className="chart-header">
            <div className="chart-title-box">
              <AwardIcon size={20} color="#f59e0b" />
              <h3>核心采集员录入词条量贡献榜</h3>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <BarChart key={`k-bar-${currentTheme}-${chartReady ? 'ready' : 'init'}`} data={stats?.collectors_ranking || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 13, fill: axisTickColor }} />
                <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 13, fill: axisTickColor }} />
                <Tooltip 
                  cursor={false}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar 
                  dataKey="count" 
                  name="录入词条数" 
                  fill="url(#colorBar)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={56} 
                  isAnimationActive={true}
                  animationBegin={100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
