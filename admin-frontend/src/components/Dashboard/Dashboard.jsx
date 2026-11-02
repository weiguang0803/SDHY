import React, { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { UsersIcon, ChatIcon, MessageIcon, BrainIcon, TrendUpIcon, GlobeIcon } from '../Common/AdminIcons'
import { adminApi } from '../../services/adminApi'
import './Dashboard.css'

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)
  const [stats, setStats] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [langData, setLangData] = useState([])
  const [intentData, setIntentData] = useState([])
  const [currentTheme, setCurrentTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark')

  useEffect(() => {
    const handleThemeChange = (e) => {
      setCurrentTheme(e.detail?.theme || document.documentElement.getAttribute('data-theme') || 'dark')
    }
    window.addEventListener('sdhy_theme_change', handleThemeChange)
    return () => window.removeEventListener('sdhy_theme_change', handleThemeChange)
  }, [])

  const isLight = currentTheme === 'light'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setChartReady(false)
        const [statsRes, trendRes, langRes, intentRes] = await Promise.all([
          adminApi.getDashboardStats().catch(() => null),
          adminApi.getMessageTrend().catch(() => []),
          adminApi.getLanguageDistribution().catch(() => []),
          adminApi.getIntentDistribution().catch(() => [])
        ])
        
        setStats(statsRes)
        setTrendData(trendRes && trendRes.length ? trendRes : mockTrendData)
        
        const formattedLang = (langRes || []).map(item => ({
          name: item.language || '未知',
          value: item.count || 0
        }))
        setLangData(formattedLang.length ? formattedLang : mockLangData)

        const intentLabelMap = {
          question: '问答求助',
          practice: '互动练习',
          correction: '偏误纠错',
          assessment: '水平评估',
          resource: '学习资源',
          conversation: '日常会话',
          chat: '自由交流',
          error_correction: '偏误纠错',
          grammar: '语法问答',
          vocabulary: '词汇学习',
          pronunciation: '语音发音',
          stroke: '汉字笔画'
        }
        const formattedIntent = (intentRes || []).map(item => {
          const rawKey = String(item.intent || '').toLowerCase().trim()
          return {
            name: intentLabelMap[rawKey] || item.intent || '其它',
            value: item.count || 0
          }
        })
        setIntentData(formattedIntent.length ? formattedIntent : mockIntentData)

        // 延时等待DOM与布局渲染稳定，确保图表进场生长动效顺利触发
        setTimeout(() => {
          setChartReady(true)
        }, 120)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const gridStroke = isLight ? '#e2e8f0' : '#1e293b'
  const axisTickColor = isLight ? '#475569' : '#94a3b8'
  const axisStroke = isLight ? '#cbd5e1' : '#64748b'
  const tooltipStyle = {
    backgroundColor: isLight ? '#ffffff' : '#0f172a',
    borderColor: isLight ? '#e2e8f0' : '#334155',
    color: isLight ? '#0f172a' : '#f1f5f9',
    borderRadius: '8px',
    boxShadow: isLight ? '0 8px 24px rgba(0, 0, 0, 0.08)' : '0 8px 24px rgba(0, 0, 0, 0.6)'
  }
  const pieBorder = isLight ? '#ffffff' : '#1e293b'

  if (loading) {
    return <div className="loading-state">加载中...</div>
  }

  const kpiCards = [
    { title: '总用户数', value: stats?.total_users || 0, icon: <UsersIcon size={24} />, color: 'blue' },
    { title: '今日活跃用户', value: stats?.today_active_users || 0, icon: <TrendUpIcon size={24} />, color: 'cyan' },
    { title: '今日新增消息', value: stats?.today_messages || 0, icon: <MessageIcon size={24} />, color: 'green' },
    { title: '总对话数', value: stats?.total_conversations || 0, icon: <ChatIcon size={24} />, color: 'purple' },
    { title: '总消息数', value: stats?.total_messages || 0, icon: <MessageIcon size={24} />, color: 'orange' },
    { title: '平均对话长度', value: stats?.avg_messages_per_conv || 0, icon: <BrainIcon size={24} />, color: 'red' },
  ]

  return (
    <div className="dashboard">
      {/* 顶部 6 大核心 KPI 响应式规整栅格 */}
      <div className="kpi-grid">
        {kpiCards.map((card, idx) => (
          <div key={idx} className={`kpi-card ${card.color}`}>
            <div className="kpi-icon-wrapper">
              {card.icon}
            </div>
            <div className="kpi-info">
              <span className="kpi-title">{card.title}</span>
              <span className="kpi-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 可视化图表区 */}
      <div className="charts-grid">
        {/* 近 7 天消息互动流转趋势 */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-box">
              <TrendUpIcon size={20} color="var(--primary)" />
              <h3>近 7 天消息互动流转趋势</h3>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <AreaChart key={`trend-${chartReady ? 'ready' : 'init'}`} data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} tickFormatter={d => (d && d.length > 5) ? d.slice(5) : d} tick={{ fontSize: 13, fill: axisTickColor }} />
                <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 13, fill: axisTickColor }} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: '#2563eb', fontSize: 13, fontWeight: 500 }}
                  labelStyle={{ color: axisTickColor, fontSize: 12, marginBottom: 4 }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13, color: axisTickColor }} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="学生消息交互量"
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  fill="url(#colorMsgs)" 
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 学员母语语种分布 */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-box">
              <GlobeIcon size={20} color="var(--secondary)" />
              <h3>学员母语语种分布</h3>
            </div>
          </div>
          <div className="chart-body" style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <PieChart key={`lang-${chartReady ? 'ready' : 'init'}-${currentTheme}`}>
                <Pie
                  data={langData}
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
                  {langData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={pieBorder} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isLight ? '#0f172a' : '#f1f5f9', fontSize: 13, fontWeight: 500 }}
                  labelStyle={{ color: axisTickColor, fontSize: 12 }}
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
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {stats?.total_users || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                学员总数
              </div>
            </div>
          </div>
        </div>

        {/* 学员核心交互意图分布与频次榜 (底部满宽柱状图) */}
        <div className="chart-card full-width-chart">
          <div className="chart-header">
            <div className="chart-title-box">
              <BrainIcon size={20} color="#8b5cf6" />
              <h3>学员核心交互意图分布与频次榜</h3>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart key={`intent-${chartReady ? 'ready' : 'init'}-${currentTheme}`} data={intentData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 13, fill: axisTickColor }} />
                <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 13, fill: axisTickColor }} />
                <Tooltip 
                  cursor={false}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: '#8b5cf6', fontSize: 13, fontWeight: 500 }}
                  labelStyle={{ color: axisTickColor, fontSize: 12 }}
                />
                <Bar 
                  dataKey="value" 
                  name="交互频次"
                  radius={[6, 6, 0, 0]} 
                  barSize={36}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {intentData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fallback mock data
const mockTrendData = Array.from({length: 7}).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i));
  return { date: `${d.getMonth()+1}/${d.getDate()}`, count: Math.floor(Math.random() * 50) + 10 }
});
const mockLangData = [{ name: '英语', value: 40 }, { name: '韩语', value: 30 }, { name: '日语', value: 20 }, { name: '法语', value: 10 }];
const mockIntentData = [{ name: '问候', value: 120 }, { name: '闲聊', value: 80 }, { name: '语法', value: 150 }, { name: '词汇', value: 90 }];

export default Dashboard
