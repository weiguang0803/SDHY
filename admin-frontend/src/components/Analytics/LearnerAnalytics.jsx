import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { analyticsApi } from './analyticsApi'
import useAdminStore from '../../stores/adminStore'
import './LearnerAnalytics.css'

// 现代化轻量内联图标组件 (零外部依赖、无 Emoji)
const Icons = {
  Question: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Brain: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
    </svg>
  ),
  Target: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
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
      <path d="M12 16v-4"></path>
      <path d="M12 8h.01"></path>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
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
  Close: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Globe: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  Layers: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
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
  )
}

const Empty = ({ children = '当前范围暂无数据' }) => (
  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <div style={{ opacity: 0.4, marginBottom: 8 }}><Icons.Info /></div>
    <span style={{ fontSize: '0.88rem' }}>{children}</span>
  </div>
)

// 优化热力颜色阶梯：0 值使用浅底色；有数据则平滑递进到高亮蓝
const getHeatColor = (count, max) => {
  if (!count) return ''
  const ratio = Math.min(1, count / Math.max(max, 1))
  if (ratio <= 0.25) return 'rgba(59, 130, 246, 0.25)'
  if (ratio <= 0.5) return 'rgba(59, 130, 246, 0.5)'
  if (ratio <= 0.75) return 'rgba(59, 130, 246, 0.75)'
  return 'rgba(37, 99, 235, 0.95)'
}

const formatTime = value => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

// ---------------- 居中弹窗组件 (Centered Modal Dialog) ----------------
const MODAL_PAGE_SIZE = 8

function QuestionModal({ filter, window, onClose }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const openAnalyticsConversation = useAdminStore(s => s.openAnalyticsConversation)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError('')
    analyticsApi.questions({ ...window, ...filter.params, page, page_size: MODAL_PAGE_SIZE }, controller.signal)
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message) })
    return () => controller.abort()
  }, [filter, window, page])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE))

  return createPortal(
    <div className="la-modal-overlay" onClick={onClose}>
      <div 
        className="la-modal-dialog" 
        role="dialog" 
        aria-modal="true" 
        aria-label={filter.title} 
        onClick={e => e.stopPropagation()}
      >
        <div className="la-modal-header">
          <div className="la-modal-title">
            <h3>{filter.title}</h3>
            <p>共 {total} 条真实学员提问 · 按上海时间倒序排列</p>
          </div>
          <button ref={closeRef} className="la-btn-close" onClick={onClose} aria-label="关闭详情">
            <Icons.Close />
          </button>
        </div>

        <div className="la-modal-body">
          {error ? (
            <div className="la-error-banner">{error}</div>
          ) : !data ? (
            <Empty>正在加载提问列表…</Empty>
          ) : data.items.length === 0 ? (
            <Empty>当前条件下无原始提问</Empty>
          ) : (
            data.items.map(row => (
              <div 
                key={row.id} 
                className="la-chat-snippet-card"
                onClick={() => openAnalyticsConversation(row.conversation_id, row.id)}
                title="点击跳转审查完整会话记录"
              >
                <div className="la-snippet-user-row">
                  <div className="la-user-badge">
                    <span className="la-user-avatar-mini">{row.name?.[0]?.toUpperCase() || 'U'}</span>
                    <span>{row.name}</span>
                    {row.deleted && <span className="la-soft-deleted-tag">(已删除)</span>}
                  </div>
                  <span className="la-snippet-time">{formatTime(row.created_at)}</span>
                </div>

                <div className="la-snippet-bubble">
                  {row.content}
                </div>

                <div className="la-snippet-footer">
                  <div className="la-snippet-points-wrap">
                    <span className="la-snippet-label">知识点:</span>
                    {row.points?.length ? (
                      row.points.map(p => <span key={p} className="la-snippet-points-tag">{p}</span>)
                    ) : (
                      <span className="la-snippet-unrec">未提取具体点</span>
                    )}
                  </div>
                  <span className="la-view-conv-link">
                    <span>查看会话</span>
                    <Icons.ArrowRight />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="la-modal-footer">
          <div className="la-pagination-info">
            共 <strong>{total}</strong> 条提问 · 每页 {MODAL_PAGE_SIZE} 条
          </div>
          <div className="la-pagination-controls">
            <button 
              className="la-btn-drill" 
              disabled={page <= 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              title={page <= 1 ? '已是第一页' : '上一页'}
            >
              <Icons.ChevronLeft />
              <span>上一页</span>
            </button>
            <span className="la-page-indicator">第 {page} / {totalPages} 页</span>
            <button 
              className="la-btn-drill" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              title={page >= totalPages ? '已是最后一页' : '下一页'}
            >
              <span>下一页</span>
              <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ---------------- 主组件 ----------------
const GAP_PAGE_SIZE = 10

export default function LearnerAnalytics() {
  const { analyticsView, setAnalyticsView } = useAdminStore()
  const [tab, setTab] = useState(analyticsView.tab)
  const [preset, setPreset] = useState(analyticsView.preset)
  const [dates, setDates] = useState(analyticsView.dates)
  const [window, setWindow] = useState(analyticsView.window)
  const [showAuditNote, setShowAuditNote] = useState(false)
  const [gapPage, setGapPage] = useState(1)

  useEffect(() => {
    setAnalyticsView({ tab, preset, dates, window })
  }, [tab, preset, dates, window, setAnalyticsView])

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setExportError('')
    setFilter(null)
    setGapPage(1)

    analyticsApi.overview(window, controller.signal)
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [window, refresh])

  const drill = (title, params) => setFilter({ title, params })

  const download = async format => {
    setExporting(true)
    setExportError('')
    try {
      const blob = await analyticsApi.export({ ...window, format })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `采编需求清单_${data.start}_${data.end}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setExportError(e.message)
    } finally {
      setExporting(false)
    }
  }

  const maxHeat = Math.max(1, ...(data?.matrix?.map(r => r.count) || []))
  const maxCalendar = Math.max(1, ...(data?.calendar?.map(r => r.count) || []))

  // 缺口分页数据切片
  const totalGaps = data?.gaps?.length || 0
  const totalGapPages = Math.max(1, Math.ceil(totalGaps / GAP_PAGE_SIZE))
  const currentGaps = (data?.gaps || []).slice((gapPage - 1) * GAP_PAGE_SIZE, gapPage * GAP_PAGE_SIZE)

  return (
    <section className="learner-analytics">
      {/* 顶部标题区 */}
      <div className="la-heading">
        <div>
          <div className="la-eyebrow-badge">
            <Icons.Sparkles /> LEARNER INSIGHTS
          </div>
          <h2>看见学习 · 也看见需求</h2>
          <p className="la-subtitle">
            全维度学员群体分布、高频偏误疑点与知识供给缺口全景洞察
            <button 
              type="button"
              className="la-audit-popover-trigger"
              onClick={() => setShowAuditNote(!showAuditNote)}
              title="查看统计口径说明"
            >
              <Icons.Info /> 数据口径说明
            </button>
          </p>
        </div>

        {/* 统计范围与控制 */}
        <div className="la-filters-bar">
          <div className="la-filter-item">
            <span>时间范围:</span>
            <select 
              className="la-select"
              value={preset} 
              onChange={e => {
                setPreset(e.target.value)
                if (e.target.value !== 'custom') setWindow({ days: e.target.value })
              }}
            >
              <option value="7">近 7 天</option>
              <option value="30">近 30 天</option>
              <option value="90">近 90 天</option>
              <option value="custom">自定义时间</option>
            </select>
          </div>

          {preset === 'custom' && (
            <form onSubmit={e => { e.preventDefault(); setWindow({ ...dates }) }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input 
                type="date" 
                required 
                className="la-select"
                value={dates.start} 
                onChange={e => setDates({ ...dates, start: e.target.value })} 
              />
              <span style={{ color: 'var(--text-secondary)' }}>至</span>
              <input 
                type="date" 
                required 
                className="la-select"
                value={dates.end} 
                min={dates.start} 
                onChange={e => setDates({ ...dates, end: e.target.value })} 
              />
              <button className="la-btn-drill">确定</button>
            </form>
          )}

          <button className="la-btn-refresh" onClick={() => setRefresh(v => v + 1)} disabled={loading}>
            <Icons.Refresh />
            <span>刷新数据</span>
          </button>
        </div>
      </div>

      {/* 优雅折叠的数据口径说明 */}
      {showAuditNote && data && (
        <div className="la-audit-note-box">
          <div className="la-audit-note-content">
            <span className="la-audit-note-icon"><Icons.Info /></span>
            <div>
              <strong>审计统计口径</strong>：当前统计区间为 {data.start} 至 {data.end} (上海时间)。仅汇总真实学员的有效提问（排除管理员非教学噪音）。知识点由大模型识别，任务标签自动过滤，同名别名合并比对。
            </div>
          </div>
          <button className="la-audit-note-close" onClick={() => setShowAuditNote(false)} aria-label="关闭说明">
            <Icons.Close />
          </button>
        </div>
      )}

      {/* 现代胶囊 Tab 切换 (无 Emoji) */}
      <nav className="la-tabs-capsule" aria-label="学情视图">
        {[
          { label: '群体全景概览', icon: <Icons.Globe /> },
          { label: '学习主题与高频疑点', icon: <Icons.Target /> },
          { label: '知识供给缺口清单', icon: <Icons.Layers /> }
        ].map((item, i) => (
          <button 
            key={item.label}
            className={`la-tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            <span className="la-tab-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="la-card"><Empty>正在为您汇总并分析学员学习记录…</Empty></div>
      ) : error ? (
        <div className="la-card" style={{ borderColor: '#ef4444' }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>加载失败: {error}</p>
          <button className="la-btn-drill" onClick={() => setRefresh(v => v + 1)}>点击重新加载</button>
        </div>
      ) : data && (
        <>
          {/* 4 大核心 KPI 旗舰卡片 */}
          <div className="la-stats-grid">
            <div className="la-stat-card">
              <div className="la-stat-info">
                <span className="la-stat-label">提问互动总量</span>
                <span className="la-stat-value">{data.summary.questions}</span>
                <span className="la-stat-subtext">统计区间内学员真实发起</span>
              </div>
              <div className="la-stat-icon-wrap la-icon-blue">
                <Icons.Question />
              </div>
            </div>

            <div className="la-stat-card">
              <div className="la-stat-info">
                <span className="la-stat-label">活跃学习学员</span>
                <span className="la-stat-value">{data.summary.learners}</span>
                <span className="la-stat-subtext">已去重独立用户</span>
              </div>
              <div className="la-stat-icon-wrap la-icon-emerald">
                <Icons.Users />
              </div>
            </div>

            <div className="la-stat-card">
              <div className="la-stat-info">
                <span className="la-stat-label">已识别知识点提问</span>
                <span className="la-stat-value" style={{ color: '#6366f1' }}>{data.summary.recognized}</span>
                <span className="la-stat-subtext">结构化知识图谱比对提取</span>
              </div>
              <div className="la-stat-icon-wrap la-icon-indigo">
                <Icons.Brain />
              </div>
            </div>

            <div className="la-stat-card">
              <div className="la-stat-info">
                <span className="la-stat-label">待补充知识点 (缺口)</span>
                <span className="la-stat-value" style={{ color: '#f59e0b' }}>{data.summary.gaps}</span>
                <span className="la-stat-subtext">建议知识库采编补全</span>
              </div>
              <div className="la-stat-icon-wrap la-icon-amber">
                <Icons.Target />
              </div>
            </div>
          </div>

          {/* TAB 0: 群体概览 */}
          {tab === 0 && (
            <>
              {/* 母语 × 主题高阶热力矩阵 */}
              <div className="la-card">
                <div className="la-card-header">
                  <div className="la-card-title-group">
                    <h3>母语背景 × 知识主题热力分布</h3>
                    <p>8 类核心母语分布与 6 类教学主题交织矩阵；颜色深度代表提问热度，点击任意热力块可直接下钻查看原始问答。</p>
                  </div>
                  {data.outside_languages > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      另有 {data.outside_languages} 条其他语种已归类计入
                    </span>
                  )}
                </div>

                <div className="la-heatmap-wrap">
                  <div className="la-heatmap-matrix">
                    <span className="la-hm-col-header" style={{ textAlign: 'left' }}>母语 / 主题</span>
                    {data.topics.map(t => (
                      <span key={t} className="la-hm-col-header">{t}</span>
                    ))}

                    {data.languages.map(lang => (
                      <React.Fragment key={lang}>
                        <span className="la-hm-row-header">{lang}</span>
                        {data.topics.map(topic => {
                          const count = data.matrix.find(r => r.language === lang && r.topic === topic)?.count || 0
                          const heatBg = getHeatColor(count, maxHeat)
                          return (
                            <button
                              key={topic}
                              className={`la-hm-cell ${count === 0 ? 'la-hm-zero' : ''}`}
                              style={{ background: heatBg, color: count > 0 ? '#ffffff' : undefined }}
                              title={`${lang} · ${topic}：共 ${count} 次提问，点击下钻`}
                              onClick={() => drill(`${lang} · ${topic} 提问记录`, { language: lang, topic })}
                            >
                              {count}
                            </button>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* 下方双图表分析 */}
              <div className="la-two-col">
                <div className="la-card">
                  <div className="la-card-title-group">
                    <h3>中文自报水平 × 人均提问深度</h3>
                    <p>各层级学员求知意愿（平均提问数 = 提问总数 / 该水平学员数）</p>
                  </div>
                  {data.levels.length ? (
                    <div className="la-chart-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.levels} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="level" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                          <Tooltip 
                            cursor={false}
                            contentStyle={{ 
                              background: 'var(--bg-card)', 
                              borderColor: 'var(--border-light)', 
                              borderRadius: 10, 
                              color: 'var(--text-primary)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                            }}
                          />
                          <Bar 
                            name="人均提问数" 
                            dataKey="average" 
                            fill="#3b82f6" 
                            maxBarSize={40} 
                            radius={[6, 6, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <Empty />}
                </div>

                <div className="la-card">
                  <div className="la-card-title-group">
                    <h3>学员 / 管理员互动活跃走势</h3>
                    <p>按日统计独立提问学员活跃度，观察系统健康与使用黏性</p>
                  </div>
                  <div className="la-chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trend} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tickFormatter={v => v.slice(5)} minTickGap={24} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <Tooltip 
                          cursor={false}
                          contentStyle={{ 
                            background: 'var(--bg-card)', 
                            borderColor: 'var(--border-light)', 
                            borderRadius: 10, 
                            color: 'var(--text-primary)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Line name="学员提问活跃" dataKey="学员" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        <Line name="管理员活跃" dataKey="管理员" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 1: 学习主题与高频疑点 */}
          {tab === 1 && (
            <>
              <div className="la-two-col">
                {/* 六大主题排行榜 */}
                <div className="la-card la-card-chart-full">
                  <div className="la-card-title-group">
                    <h3>六大学习主题热度排行</h3>
                    <p>直观展现学员的核心关注重心；点击条形柱直接下钻查看该主题问答</p>
                  </div>
                  {data.topic_ranking?.length ? (
                    <div className="la-chart-box la-chart-box-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          layout="vertical" 
                          data={data.topic_ranking} 
                          margin={{ left: 10, right: 30, top: 15, bottom: 15 }}
                          barCategoryGap="18%"
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                          <YAxis type="category" dataKey="topic" width={95} tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }} />
                          <Tooltip 
                            cursor={false}
                            content={({ active, payload }) => active && payload?.[0] ? (
                              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '10px 14px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                                <strong style={{ color: 'var(--primary)' }}>{payload[0].payload.topic}</strong>
                                <div style={{ fontSize: '0.82rem', marginTop: 4, color: 'var(--text-secondary)' }}>
                                  共提问 {payload[0].payload.count} 次 · 覆盖 {payload[0].payload.learners} 位学员
                                </div>
                              </div>
                            ) : null}
                          />
                          <Bar 
                            dataKey="count" 
                            name="提问次数" 
                            fill="url(#blueGrad)" 
                            maxBarSize={28}
                            radius={[0, 6, 6, 0]} 
                            cursor="pointer" 
                            onClick={r => drill(`${r.topic} 主题问答`, { topic: r.topic })} 
                          />
                          <defs>
                            <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <Empty />}
                </div>

                {/* L3 高频疑点卡片 */}
                <div className="la-card la-card-chart-full">
                  <div className="la-card-title-group">
                    <h3>高频薄弱知识点警示榜</h3>
                    <p>汇总学员认知画像中的易错薄弱点与混淆语法，供教研制定针对性教案</p>
                  </div>
                  {data.weak_points?.length ? (
                    <div className="la-weak-list">
                      {data.weak_points.map(r => (
                        <div key={r.point} className="la-weak-card">
                          <div className="la-weak-left">
                            <span className="la-weak-title">
                              {r.point}
                              <span className="la-weak-badge">高频薄弱</span>
                            </span>
                            <span className="la-weak-sub">
                              重点学员：{r.names.join('、')}
                            </span>
                          </div>
                          <div className="la-weak-meta">
                            <span className="la-weak-count">{r.count} 次</span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.learners} 位受阻</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <Empty>暂无学员薄弱疑点记录，学员掌握度良好</Empty>}
                </div>
              </div>

              {/* 高频具体知识点热词看板 (可平滑滚动容器) */}
              <div className="la-card">
                <div className="la-card-header">
                  <div className="la-card-title-group">
                    <h3>高频求知知识点热词榜 (Top 知识点)</h3>
                    <p>学员提问最高频词汇与语法点。点击卡片可直接查看包含该知识点的真实学员对话。</p>
                  </div>
                  {data.ranking?.length > 0 && (
                    <span className="la-count-badge">
                      共收录 {data.ranking.length} 项知识点 · 可上下滚动
                    </span>
                  )}
                </div>
                {data.ranking?.length ? (
                  <div className="la-rank-scroll-wrap">
                    <div className="la-rank-grid">
                      {data.ranking.map((r, index) => {
                        const medalClass = index === 0 ? 'medal-gold' : index === 1 ? 'medal-silver' : index === 2 ? 'medal-bronze' : 'medal-normal'
                        return (
                          <div 
                            key={r.point} 
                            className="la-rank-chip"
                            onClick={() => drill(`关于「${r.point}」的学员问答`, { point: r.point })}
                          >
                            <div className="la-rank-chip-left">
                              <span className={`la-rank-medal ${medalClass}`}>{index + 1}</span>
                              <div>
                                <div className="la-rank-chip-title">{r.point}</div>
                                <div className="la-rank-chip-learners">{r.learners} 位学员曾探索</div>
                              </div>
                            </div>
                            <div className="la-rank-chip-right">
                              <span>{r.count}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>次</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : <Empty>暂无具体知识点统计</Empty>}
              </div>

              {/* 最近 90 天学习脉冲墙 */}
              <div className="la-card">
                <div className="la-card-header">
                  <div className="la-card-title-group">
                    <h3>最近 90 天学习活跃度全景</h3>
                    <p>学员日常学习活跃度全景脉络，鼠标悬停可预览当日活跃学员与提问量</p>
                  </div>
                </div>
                <div className="la-calendar-wall">
                  {data.calendar.map(day => {
                    const ratio = day.count / Math.max(maxCalendar, 1)
                    let bg = 'var(--bg-hover)'
                    if (day.count > 0) {
                      if (ratio <= 0.25) bg = 'rgba(59, 130, 246, 0.3)'
                      else if (ratio <= 0.6) bg = 'rgba(59, 130, 246, 0.6)'
                      else bg = '#2563eb'
                    }
                    return (
                      <button
                        key={day.date}
                        className="la-cal-node"
                        style={{ background: bg }}
                        title={`${day.date} · 提问 ${day.count} 次 · 活跃学员 ${day.learners} 人`}
                        onClick={() => drill(`${day.date} 当日学员提问`, { start: day.date, end: day.date })}
                      />
                    )
                  })}
                </div>
                <div className="la-cal-legend">
                  <span>{data.calendar[0]?.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>少</span>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-hover)', display: 'inline-block' }}></span>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(59, 130, 246, 0.3)', display: 'inline-block' }}></span>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(59, 130, 246, 0.6)', display: 'inline-block' }}></span>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#2563eb', display: 'inline-block' }}></span>
                    <span>多</span>
                  </div>
                  <span>{data.calendar[data.calendar.length - 1]?.date}</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: 知识供给缺口清单 */}
          {tab === 2 && (
            <div className="la-card">
              <div className="la-card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div className="la-card-title-group" style={{ flex: 1, minWidth: 280 }}>
                  <h3>知识供给缺口 · 教学采编需求看板</h3>
                  <p>根据学员在真实对话中反复提及、但当前知识库尚未录入或待审核的核心生词生成，支持一键导出教研任务书。</p>
                </div>
                
                {/* 导出按钮移至顶端，随时可点无须滑到底部 */}
                <div className="la-gap-actions">
                  <button className="la-btn-drill" disabled={exporting} onClick={() => download('md')} title="导出为 Markdown 格式任务单">
                    <Icons.Download /> 导出为 Markdown
                  </button>
                  <button className="la-btn-drill" disabled={exporting} onClick={() => download('csv')} title="导出为 Excel CSV 表格">
                    <Icons.Download /> 导出为 Excel (CSV)
                  </button>
                </div>
              </div>

              {exportError && (
                <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, marginTop: 12 }}>
                  {exportError}
                </div>
              )}

              {totalGaps > 0 ? (
                <>
                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <table className="la-gap-table">
                      <thead>
                        <tr>
                          <th>缺口知识点</th>
                          <th>学员提问频次</th>
                          <th>涉及学员数</th>
                          <th>知识库收录状态</th>
                          <th>真实语料依据</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentGaps.map(r => (
                          <tr key={r.point}>
                            <td style={{ fontWeight: 700 }}>{r.point}</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.count} 次</td>
                            <td>{r.learners} 位学员</td>
                            <td>
                              <span className={`la-status-pill ${r.status === '待审核' ? 'pill-pending' : 'pill-missing'}`}>
                                <span className={`la-status-dot ${r.status === '待审核' ? 'dot-pending' : 'dot-missing'}`} />
                                {r.status === '待审核' ? '知识库待审核' : '知识库未收录'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="la-btn-drill"
                                onClick={() => drill(`关于「${r.point}」的提问依据`, { point: r.point })}
                              >
                                <span>查看学员提问</span>
                                <Icons.ArrowRight />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 缺口表格底部专属分页控制器 */}
                  <div className="la-table-pagination">
                    <div className="la-pagination-info">
                      共定位到 <strong>{totalGaps}</strong> 项采编需求 · 显示第 {(gapPage - 1) * GAP_PAGE_SIZE + 1} - {Math.min(gapPage * GAP_PAGE_SIZE, totalGaps)} 项
                    </div>
                    <div className="la-pagination-controls">
                      <button 
                        className="la-btn-drill" 
                        disabled={gapPage <= 1} 
                        onClick={() => setGapPage(p => Math.max(1, p - 1))}
                        title={gapPage <= 1 ? '已是第一页' : '上一页'}
                      >
                        <Icons.ChevronLeft />
                        <span>上一页</span>
                      </button>
                      <span className="la-page-indicator">第 {gapPage} / {totalGapPages} 页</span>
                      <button 
                        className="la-btn-drill" 
                        disabled={gapPage >= totalGapPages} 
                        onClick={() => setGapPage(p => Math.min(totalGapPages, p + 1))}
                        title={gapPage >= totalGapPages ? '已是最后一页' : '下一页'}
                      >
                        <span>下一页</span>
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Empty>
                  {data.summary.recognized ? '当前学员探索的所有知识点在知识库中均已完整收录并审核上线。' : '暂无足够已识别的知识点数据。'}
                </Empty>
              )}
            </div>
          )}
        </>
      )}

      {/* 下钻居中弹窗 */}
      {filter && (
        <QuestionModal 
          key={JSON.stringify(filter)} 
          filter={filter} 
          window={window} 
          onClose={() => setFilter(null)} 
        />
      )}
    </section>
  )
}
