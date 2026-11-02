import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/adminApi'
import { SettingsIcon, GlobeIcon, BrainIcon } from '../Common/AdminIcons'
import './SystemInfo.css'

const SystemInfo = () => {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await adminApi.getSystemInfo()
        setInfo(data)
      } catch (err) {
        // Mock data fallback for dev
        console.error(err)
        setInfo({
          llm_model: 'gpt-4o-mini',
          api_base_url: 'https://api.openai.com/v1',
          api_key: 'sk-proj-********************************',
          db_path: 'sqlite:///./sdhy.db',
          db_size: '15 MB',
          version: '1.0.0',
          environment: 'production'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchInfo()
  }, [])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="system-info-page">
      <div className="info-header">
        <div className="version-badge">
          v{info?.version || '1.0.0'}
        </div>
        <p className="env-tag">
          <GlobeIcon size={14} /> {info?.environment === 'development' ? '开发环境' : '生产环境'}
        </p>
      </div>

      <div className="info-cards-container">
        <div className="sys-card">
          <div className="sys-card-icon brain">
            <BrainIcon size={24} />
          </div>
          <div className="sys-card-content">
            <h4>LLM 模型</h4>
            <div className="sys-value model-name">{info?.llm_model || '-'}</div>
          </div>
        </div>

        <div className="sys-card">
          <div className="sys-card-icon">
            <GlobeIcon size={24} />
          </div>
          <div className="sys-card-content">
            <h4>API 基础地址</h4>
            <div className="sys-value url">{info?.api_base_url || '-'}</div>
          </div>
        </div>

        <div className="sys-card">
          <div className="sys-card-icon">
            <SettingsIcon size={24} />
          </div>
          <div className="sys-card-content">
            <h4>API Key</h4>
            <div className="sys-value masked">{info?.api_key || '****************'}</div>
          </div>
        </div>

        <div className="sys-card">
          <div className="sys-card-icon">
            <SettingsIcon size={24} />
          </div>
          <div className="sys-card-content">
            <h4>数据库路径</h4>
            <div className="sys-value code">{info?.db_path || '-'}</div>
          </div>
        </div>

        <div className="sys-card">
          <div className="sys-card-icon">
            <SettingsIcon size={24} />
          </div>
          <div className="sys-card-content">
            <h4>数据库大小</h4>
            <div className="sys-value">{info?.db_size || '未知'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemInfo
