import React, { useEffect, useState } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { adminApi } from '../../services/adminApi'
import './GrowthAnalytics.css'

// 现代化内联轻量图标 (零外部依赖、严禁 Emoji)
const Icons = {
  Growth: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  UserPlus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="20" y1="8" x2="20" y2="14"></line>
      <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
  ),
  Retention: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
    </svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  MessageDepth: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <path d="M8 9h8"></path>
      <path d="M8 13h6"></path>
    </svg>
  ),
  Bookmark: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6"></path>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
      <path d="M3 22v-6h6"></path>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Sparkles: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#64748b']
const number = value => value == null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
const percent = value => value == null ? '—' : `${number(value)}%`
const shortDate = value => value.slice(5)

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 12,
  padding: '12px 16px',
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
}

function Panel({ title, description, children, className = '', rightContent = null }) {
  return (
    <section className={`growth-panel ${className}`}>
      <div className="growth-panel-header">
        <div className="growth-panel-title-group">
          <h3>{title}</h3>
          {description && <p className="growth-caption">{description}</p>}
        </div>
        {rightContent && <div className="growth-panel-right">{rightContent}</div>}
      </div>
      {children}
    </section>
  )
}

function LevelTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={tooltipStyle}>
      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{row.name}</strong>
      <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        学员人数：<strong style={{ color: 'var(--text-primary)' }}>{number(row.value)} 人</strong>
      </div>
      <div style={{ marginTop: 2, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        占全体比重：<strong style={{ color: 'var(--text-primary)' }}>{percent(total ? row.value / total * 100 : 0)}</strong>
      </div>
    </div>
  )
}

function shanghaiToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = type => parts.find(part => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function currentMonday() { return mondayOf(shanghaiToday()) }

function mondayOf(value) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  return date.toISOString().slice(0, 10)
}

function shiftWeek(value, offset) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset * 7)
  return date.toISOString().slice(0, 10)
}

// ---------------- 周活跃热力图组件 ----------------
function WeeklyHeatmap() {
  const [week, setWeek] = useState(currentMonday)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setData(null)
    adminApi.getGrowthWeeklyHeatmap(week, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || '周活跃数据加载失败') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [week, refresh])

  const maxHeat = data ? Math.max(1, ...data.rows.flatMap(row => row.values)) : 1

  return (
    <Panel 
      title="周活跃时段热力矩阵" 
      description="按上海时间分析周一至周日学员提问高峰分布，辅助教研安排答疑排班与辅导黄金时段" 
      className="growth-week-panel"
      rightContent={
        data && (
          <div className="growth-week-badge">
            区间总提问：<strong>{number(data.total_questions)}</strong> 条
          </div>
        )
      }
    >
      <div className="growth-week-control-bar">
        <div className="growth-week-selector">
          <label htmlFor="growth-week">选择基准日</label>
          <div className="growth-input-date-wrap">
            <Icons.Calendar />
            <input 
              id="growth-week" 
              type="date" 
              value={week} 
              max={shanghaiToday()} 
              onChange={e => { if (e.target.value) setWeek(mondayOf(e.target.value)) }} 
            />
          </div>
        </div>

        <div className="growth-week-btn-group">
          <button className="growth-btn" onClick={() => setWeek(v => shiftWeek(v, -1))}>
            <Icons.ChevronLeft />
            <span>上一周</span>
          </button>
          <button className="growth-btn" onClick={() => { setWeek(currentMonday()); setRefresh(v => v + 1) }}>
            本周
          </button>
          <button 
            className="growth-btn" 
            disabled={week >= currentMonday()} 
            onClick={() => setWeek(v => shiftWeek(v, 1))}
          >
            <span>下一周</span>
            <Icons.ChevronRight />
          </button>
          <button className="growth-btn growth-btn-refresh" disabled={loading} onClick={() => setRefresh(v => v + 1)}>
            <Icons.Refresh />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {loading && <div className="growth-state" role="status">正在加载所选周活跃热力…</div>}
      {error && (
        <div className="growth-state growth-error" role="alert">
          <p>{error}</p>
          <button className="growth-btn" onClick={() => setRefresh(v => v + 1)}>重试</button>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="growth-week-subline">
            <span>统计区间：<strong>{data.week_start}</strong> 至 <strong>{data.week_end}</strong>（周一至周日）</span>
            {!data.total_questions && <span className="growth-notice-inline">当前所选周暂无学员发起提问</span>}
          </div>

          <div className="growth-heat-scroll">
            <table className="growth-heatmap">
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', width: 100 }}>日期 / 时段</th>
                  {data.periods.map(period => (
                    <th scope="col" key={period.name}>
                      <span className="growth-period-name">{period.name}</span>
                      <small className="growth-period-hours">{period.hours}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map(row => (
                  <tr key={row.date}>
                    <th scope="row">
                      <span className="growth-row-day">{row.day}</span>
                      <small className="growth-row-date">{row.date.slice(5)}</small>
                    </th>
                    {row.values.map((value, index) => {
                      const ratio = value / maxHeat
                      let bg = 'var(--bg-hover)'
                      let textColor = 'var(--text-secondary)'
                      if (value > 0) {
                        if (ratio <= 0.3) bg = 'rgba(59, 130, 246, 0.35)'
                        else if (ratio <= 0.65) bg = 'rgba(59, 130, 246, 0.65)'
                        else bg = '#2563eb'
                        textColor = '#ffffff'
                      }
                      return (
                        <td key={index}>
                          <div 
                            tabIndex={0} 
                            className={`growth-heat-cell ${row.is_future ? 'cell-future' : ''} ${value > 0 ? 'has-value' : ''}`}
                            style={{ background: row.is_future ? undefined : bg, color: row.is_future ? undefined : textColor }}
                            title={`${row.date} (${row.day}) ${data.periods[index].name} · ${row.is_future ? '尚未到来' : `${value} 次学员提问`}`}
                          >
                            {row.is_future ? '—' : number(value)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="growth-heat-legend">
            <span className="growth-legend-label">提问热度：</span>
            <span>0 次</span>
            <div className="growth-legend-ramp" />
            <span>{number(maxHeat)} 次（峰值）</span>
            <span className="growth-legend-divider">|</span>
            <span style={{ color: 'var(--text-muted)' }}>— 尚未到来</span>
          </div>
        </>
      )}
    </Panel>
  )
}

// ---------------- 主页面组件 ----------------
export default function GrowthAnalytics() {
  const [days, setDays] = useState(30)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setData(null)
    adminApi.getGrowthOverview(days, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || '暂时无法获取增长数据') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [days, refresh])

  const metrics = data?.metrics
  const cards = metrics ? [
    {
      title: '累计注册学员',
      value: number(metrics.total_students),
      icon: <Icons.Users />,
      themeClass: 'growth-icon-blue'
    },
    {
      title: '本月新增学员',
      value: number(metrics.new_this_month),
      icon: <Icons.UserPlus />,
      themeClass: 'growth-icon-emerald'
    },
    {
      title: '30 日留存率',
      value: percent(metrics.retention_30d),
      icon: <Icons.Retention />,
      themeClass: 'growth-icon-purple'
    },
    {
      title: `近 ${days} 日活跃率`,
      value: percent(metrics.active_rate),
      icon: <Icons.Activity />,
      themeClass: 'growth-icon-indigo'
    },
    {
      title: '人均会话深度',
      value: number(metrics.conversation_depth),
      icon: <Icons.MessageDepth />,
      themeClass: 'growth-icon-amber'
    },
    {
      title: '会话收藏收敛率',
      value: percent(metrics.favorite_rate),
      icon: <Icons.Bookmark />,
      themeClass: 'growth-icon-rose'
    },
  ] : []

  const axis = { 
    tick: { fill: 'var(--text-secondary)', fontSize: 12 }, 
    axisLine: false, 
    tickLine: false 
  }

  // 计算增长区间新增总量
  const periodNewTotal = data?.growth?.reduce((sum, r) => sum + (r.new_students || 0), 0) || 0

  return (
    <div className="growth-page" aria-busy={loading}>
      {/* 头部标题与控制栏 */}
      <header className="growth-header">
        <div>
          <div className="growth-eyebrow-badge">
            <Icons.Sparkles /> GROWTH ANALYTICS
          </div>
          <h2>教学增长分析</h2>
          <p className="growth-subtitle">观察学员规模演进、学习回访留存与全周活跃矩阵。</p>
        </div>

        <div className="growth-actions">
          <div className="growth-filter-item">
            <span>统计窗口:</span>
            <select 
              id="growth-days" 
              className="growth-select"
              value={days} 
              onChange={e => setDays(Number(e.target.value))}
            >
              {[7, 30, 90].map(v => <option key={v} value={v}>近 {v} 日</option>)}
            </select>
          </div>
          <button 
            className="growth-btn-refresh" 
            disabled={loading} 
            onClick={() => setRefresh(v => v + 1)}
          >
            <Icons.Refresh />
            <span>刷新数据</span>
          </button>
        </div>
      </header>

      {loading && <div className="growth-state" role="status">正在汇总真实学员增长数据…</div>}
      {error && (
        <div className="growth-state growth-error" role="alert">
          <p>增长数据加载失败：{error}</p>
          <button className="growth-btn" onClick={() => setRefresh(v => v + 1)}>重新加载</button>
        </div>
      )}

      {!loading && data && (
        <>
          {/* 时间区间说明条 */}
          <div className="growth-range-bar">
            <span>
              统计区间：<strong>{data.range.start_date}</strong> 至 <strong>{data.range.end_date}</strong> · 上海时间 (UTC+8)
            </span>
            <span className="growth-updated-time">
              数据更新于 {new Date(data.generated_at).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}
            </span>
          </div>

          {metrics.total_students === 0 && (
            <div className="growth-notice" role="status">
              暂无学员数据。学员注册并开始提问后，这里将实时展示增长与活跃全景。
            </div>
          )}

          {/* 6 大核心 KPI 旗舰卡片 */}
          <div className="growth-kpis">
            {cards.map(card => (
              <div className="growth-kpi-card" key={card.title}>
                <div className="growth-kpi-top">
                  <span className="growth-kpi-label">{card.title}</span>
                  <div className={`growth-kpi-icon-wrap ${card.themeClass}`}>
                    {card.icon}
                  </div>
                </div>
                <div className="growth-kpi-body">
                  <span className="growth-kpi-value">{card.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 图表主网格 */}
          <div className="growth-grid">
            {/* 学员增长曲线旗舰大图 (全宽) */}
            <Panel 
              title="学员增长与每日新增走势" 
              description="左轴为累计学员总规模（面积折线），右轴为每日新增学员数（柱状图）；透出用户吸纳健康度。" 
              className="growth-wide"
              rightContent={
                <div className="growth-chart-summary">
                  <span>总规模：<strong>{metrics.total_students}</strong> 人</span>
                  <span className="growth-summary-sep">/</span>
                  <span>期间新增：<strong style={{ color: '#06b6d4' }}>{periodNewTotal}</strong> 人</span>
                </div>
              }
            >
              <div className="growth-chart growth-chart-main">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.growth} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="newBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-light)" strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axis} />
                    <YAxis yAxisId="total" allowDecimals={false} {...axis} />
                    <YAxis yAxisId="new" orientation="right" allowDecimals={false} {...axis} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      contentStyle={tooltipStyle}
                      formatter={(val, name) => [number(val), name]}
                      labelFormatter={label => `日期：${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar 
                      yAxisId="new" 
                      dataKey="new_students" 
                      name="每日新增（右轴）" 
                      fill="url(#newBarGrad)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={18} 
                    />
                    <Area 
                      yAxisId="total" 
                      type="monotone" 
                      dataKey="total_students" 
                      name="累计学员（左轴）" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      fill="url(#growthAreaGrad)" 
                      activeDot={{ r: 5 }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* 中文自报水平分布 (Donut 卡片) */}
            <Panel 
              title="中文自报水平分布" 
              description="当前全体学员资料快照分布，透视学员整体能力阶段"
            >
              <div className="growth-donut-container">
                <div className="growth-chart growth-level-chart">
                  {metrics.total_students ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={data.levels} 
                          dataKey="value" 
                          nameKey="name" 
                          innerRadius="58%" 
                          outerRadius="78%" 
                          paddingAngle={4}
                          cornerRadius={6}
                          stroke="none"
                          strokeWidth={0}
                          isAnimationActive={true}
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {data.levels.map((row, index) => (
                            <Cell 
                              key={row.name} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke="none"
                              strokeWidth={0}
                              style={{ outline: 'none' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<LevelTooltip total={metrics.total_students} />} />
                        {/* 环形图中心数据指标 */}
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="26" fontWeight="800">
                          {metrics.total_students}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-secondary)" fontSize="12">
                          全体学员
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="growth-empty-donut" role="img" aria-label="暂无学员，所有水平人数均为零">
                      <span>暂无数据</span>
                    </div>
                  )}
                </div>

                {/* 环形图专属右侧/底部指标列表 */}
                <ul className="growth-level-legend" aria-label="中文水平图例">
                  {data.levels.map((row, index) => {
                    const pct = metrics.total_students ? (row.value / metrics.total_students * 100).toFixed(1) : '0'
                    return (
                      <li key={row.name} className="growth-legend-item">
                        <div className="growth-legend-left">
                          <i style={{ background: COLORS[index % COLORS.length] }} aria-hidden="true" />
                          <span className="growth-legend-name">{row.name}</span>
                        </div>
                        <div className="growth-legend-right">
                          <strong className="growth-legend-count">{number(row.value)} 人</strong>
                          <span className="growth-legend-pct">({pct}%)</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </Panel>

            {/* 母语覆盖水平条形图 */}
            <Panel 
              title="学员母语覆盖矩阵" 
              description={`当前已动态覆盖 ${data.languages.filter(row => !['未填写', '其他'].includes(row.name)).length} 种母语语系 · 按学员规模排序`}
              rightContent={
                <div className="growth-week-badge">
                  共收录 <strong>{data.languages.length}</strong> 种母语
                </div>
              }
            >
              {!data.languages.length ? (
                <div className="growth-empty">暂无母语数据</div>
              ) : (
                <div className="growth-lang-matrix">
                  <div className="growth-lang-list">
                    {data.languages.map((row, index) => {
                      const maxVal = Math.max(1, ...data.languages.map(l => l.value || 0))
                      const pctOfMax = Math.max(8, ((row.value || 0) / maxVal) * 100)
                      const pctOfTotal = metrics.total_students ? (((row.value || 0) / metrics.total_students) * 100).toFixed(1) : '0'
                      return (
                        <div 
                          className="growth-lang-row" 
                          key={row.name}
                          style={{ '--row-delay': `${index * 80}ms` }}
                        >
                          <div className="growth-lang-header">
                            <div className="growth-lang-label-group">
                              <span className="growth-lang-rank">0{index + 1}</span>
                              <span className="growth-lang-name">{row.name}</span>
                            </div>
                            <div className="growth-lang-badge">
                              <strong className="growth-lang-val">{number(row.value)} 位学员</strong>
                              <span className="growth-lang-pct">({pctOfTotal}%)</span>
                            </div>
                          </div>
                          <div className="growth-lang-track" title={`${row.name}: ${number(row.value)} 位学员 (${pctOfTotal}%)`}>
                            <div 
                              className="growth-lang-bar-fill" 
                              style={{ 
                                width: `${pctOfMax}%`,
                                animationDelay: `${index * 80}ms`
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* 底部刻度基准指示 */}
                  <div className="growth-lang-axis">
                    <span>0</span>
                    <span>{Math.round(Math.max(1, ...data.languages.map(l => l.value || 0)) / 2)} 位</span>
                    <span>{Math.max(1, ...data.languages.map(l => l.value || 0))} 位 (峰值)</span>
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {/* 周活跃时段热力面板 */}
          <WeeklyHeatmap />
        </>
      )}
    </div>
  )
}
