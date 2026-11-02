import React from 'react'
import './ModulePlaceholder.css'

const ModulePlaceholder = ({
  icon,
  title,
  englishTitle,
  phaseTag = "Phase 1 首期新增",
  statusText = "地基已就绪 · 即将上线",
  description,
  problemStatement,
  featureCards = []
}) => {
  return (
    <div className="module-placeholder-container animate-fade-in">
      <div className="module-placeholder-hero">
        <div className="placeholder-badge-row">
          <span className="placeholder-phase-badge">{phaseTag}</span>
          <span className="placeholder-status-badge">{statusText}</span>
        </div>
        
        <div className="placeholder-title-row">
          <div className="placeholder-icon-wrap">
            {icon}
          </div>
          <div className="placeholder-title-col">
            <h2>{title}</h2>
            <span className="placeholder-en-subtitle">{englishTitle}</span>
          </div>
        </div>

        {problemStatement && (
          <div className="placeholder-problem-box">
            <span className="problem-label">核心回答：</span>
            <span className="problem-text">{problemStatement}</span>
          </div>
        )}

        <p className="placeholder-description">{description}</p>
      </div>

      <div className="placeholder-features-grid">
        {featureCards.map((feat, index) => (
          <div key={index} className="placeholder-feature-card">
            <div className="feature-card-header">
              <span className="feature-card-badge">{feat.tag}</span>
              <span className="feature-card-index">0{index + 1}</span>
            </div>
            <h4 className="feature-card-title">{feat.title}</h4>
            <p className="feature-card-desc">{feat.desc}</p>
            {feat.metrics && (
              <div className="feature-card-metrics">
                {feat.metrics.map((m, mIdx) => (
                  <span key={mIdx} className="metric-chip">{m}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModulePlaceholder
