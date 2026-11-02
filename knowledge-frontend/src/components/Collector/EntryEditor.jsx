import React, { useState, useEffect } from 'react'
import { knowledgeApi } from '../../services/knowledgeApi'
import { 
  SparklesIcon, 
  ImageIcon, 
  VideoIcon, 
  UploadIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  BookOpenIcon,
  FileTextIcon
} from '../Common/Icons'
import './EntryEditor.css'

const DEFAULT_IMAGE_PROMPT = "生成一张适合成人留学生对外汉语教学的黑白线稿简笔画，画面内容为{subject}，纯线条勾勒、无阴影，线条简洁流畅、干净利落，造型简化准确、写实不夸张，主体清晰突出，纯白色背景，无多余装饰，仅用线条勾勒轮廓，可添加简单斜线阴影增强立体感，画面干净整洁、易识别，适合汉语初学者学习使用的教学插图。"

export default function EntryEditor({ entry, onSave, onCancel, userRole = 'collector' }) {
  const [activeTab, setActiveTab] = useState('text') // 'text', 'image', 'video'
  
  // 基本信息
  const [word, setWord] = useState(entry?.word || '')
  const [pinyin, setPinyin] = useState(entry?.pinyin || '')
  const [category, setCategory] = useState(entry?.category || '词汇')
  const [hskLevel, setHskLevel] = useState(entry?.hsk_level || '初学者')
  const [tagInput, setTagInput] = useState((entry?.tags || []).join(', '))

  // 1. 文本模块
  const [explanation, setExplanation] = useState(entry?.text_content?.explanation || '')
  const [translation, setTranslation] = useState(entry?.text_content?.translation || '')
  const [textbookExamples, setTextbookExamples] = useState(
    entry?.text_content?.textbook_examples || [{ chinese: '', pinyin: '', translation: '' }]
  )
  const [dailyExamples, setDailyExamples] = useState(
    entry?.text_content?.daily_examples || [{ chinese: '', pinyin: '', translation: '' }]
  )
  const [topicReading, setTopicReading] = useState(entry?.text_content?.topic_reading || '')

  // 2. 图片模块
  const [imageUrl, setImageUrl] = useState(entry?.image_content?.url || '')
  const [imagePrompt, setImagePrompt] = useState(entry?.image_content?.prompt || DEFAULT_IMAGE_PROMPT)
  const [imageSource, setImageSource] = useState(entry?.image_content?.source_type || 'ai_generated')

  // 3. 视频模块
  const [videoUrl, setVideoUrl] = useState(entry?.video_content?.url || '')
  const [videoScript, setVideoScript] = useState(entry?.video_content?.script || '')
  const [videoSource, setVideoSource] = useState(entry?.video_content?.source_type || 'ai_generated')

  // 加载状态
  const [generatingText, setGeneratingText] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 更新图片提示词中的 subject
  useEffect(() => {
    if (word && !entry?.image_content?.prompt) {
      setImagePrompt(DEFAULT_IMAGE_PROMPT.replace('{subject}', word))
    }
  }, [word, entry])

  // AI 文本生成
  const handleAIGenerateText = async () => {
    if (!word.trim()) {
      setErrorMsg('请先填写词条名称')
      return
    }
    setGeneratingText(true)
    setErrorMsg('')
    try {
      const data = await knowledgeApi.aiGenerateText({
        word: word.trim(),
        category,
        hsk_level: hskLevel
      })
      if (data.pinyin && !pinyin) setPinyin(data.pinyin)
      if (data.translation) setTranslation(data.translation)
      if (data.explanation) setExplanation(data.explanation)
      if (data.textbook_examples?.length) setTextbookExamples(data.textbook_examples)
      if (data.daily_examples?.length) setDailyExamples(data.daily_examples)
      if (data.topic_reading) setTopicReading(data.topic_reading)
    } catch (err) {
      setErrorMsg('AI 文本生成失败: ' + err.message)
    } finally {
      setGeneratingText(false)
    }
  }

  // AI 图片生成
  const handleAIGenerateImage = async () => {
    if (!word.trim()) {
      setErrorMsg('请先填写词条名称')
      return
    }
    setGeneratingImage(true)
    setErrorMsg('')
    try {
      const res = await knowledgeApi.aiGenerateImage({
        word: word.trim(),
        custom_prompt: imagePrompt
      })
      if (res.success && res.url) {
        setImageUrl(res.url)
        setImageSource('ai_generated')
      } else {
        setErrorMsg(res.error || '图片生成异常')
      }
    } catch (err) {
      setErrorMsg('AI 图片生成失败: ' + err.message)
    } finally {
      setGeneratingImage(false)
    }
  }

  // AI 视频生成 (提交 + 轮询)
  const handleAIGenerateVideo = async () => {
    if (!word.trim()) {
      setErrorMsg('请先填写词条名称')
      return
    }
    setGeneratingVideo(true)
    setVideoProgress('正在提交师道汉韵微课短视频生成任务...')
    setErrorMsg('')
    try {
      const res = await knowledgeApi.aiGenerateVideo({
        word: word.trim(),
        custom_script: videoScript || undefined
      })
      if (!res.success || !res.task_id) {
        throw new Error(res.error || '任务提交失败')
      }

      const taskId = res.task_id
      setVideoProgress('任务提交成功，师道汉韵 AI 正在生成 15 秒短视频（大约需要 30-60 秒）...')

      // 轮询状态
      const timer = setInterval(async () => {
        try {
          const statusRes = await knowledgeApi.aiVideoStatus(taskId)
          if (statusRes.status === 'succeeded' && statusRes.url) {
            clearInterval(timer)
            setVideoUrl(statusRes.url)
            setVideoSource('ai_generated')
            setGeneratingVideo(false)
            setVideoProgress('')
          } else if (statusRes.status === 'failed') {
            clearInterval(timer)
            setErrorMsg('视频生成失败: ' + (statusRes.error || '未知原因'))
            setGeneratingVideo(false)
            setVideoProgress('')
          } else {
            setVideoProgress(`视频渲染中 (${statusRes.status || 'processing'})... 正在合成画面与配音`)
          }
        } catch (e) {
          clearInterval(timer)
          setErrorMsg('轮询视频状态出错: ' + e.message)
          setGeneratingVideo(false)
          setVideoProgress('')
        }
      }, 10000)
    } catch (err) {
      setErrorMsg('视频任务发起失败: ' + err.message)
      setGeneratingVideo(false)
      setVideoProgress('')
    }
  }

  // 文件上传通用处理
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setErrorMsg('')
    try {
      const res = await knowledgeApi.uploadFile(file, type)
      if (type === 'image') {
        setImageUrl(res.url)
        setImageSource('upload')
      } else {
        setVideoUrl(res.url)
        setVideoSource('upload')
      }
    } catch (err) {
      setErrorMsg('文件上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // 组装并保存
  const handleSubmit = async (targetStatus) => {
    if (!word.trim()) {
      setErrorMsg('词条名称不能为空')
      return
    }

    setSaving(true)
    setErrorMsg('')

    // 构建文本内容结构
    const hasText = Boolean(explanation || translation || textbookExamples.some(e => e.chinese) || dailyExamples.some(e => e.chinese) || topicReading)
    const textContentData = hasText ? {
      explanation,
      translation,
      textbook_examples: textbookExamples.filter(e => e.chinese.trim()),
      daily_examples: dailyExamples.filter(e => e.chinese.trim()),
      topic_reading: topicReading
    } : null

    // 构建图片内容结构
    const imageContentData = imageUrl ? {
      url: imageUrl,
      prompt: imagePrompt,
      source_type: imageSource
    } : null

    // 构建视频内容结构
    const videoContentData = videoUrl ? {
      url: videoUrl,
      script: videoScript,
      source_type: videoSource,
      duration: 15
    } : null

    const payload = {
      word: word.trim(),
      pinyin: pinyin.trim(),
      category,
      hsk_level: hskLevel,
      tags: tagInput.split(/[,， ]+/).filter(Boolean),
      text_content: textContentData,
      image_content: imageContentData,
      video_content: videoContentData,
      status: targetStatus
    }

    try {
      if (entry?.id) {
        await knowledgeApi.updateEntry(entry.id, payload)
      } else {
        await knowledgeApi.createEntry(payload)
      }
      onSave()
    } catch (err) {
      setErrorMsg('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="entry-editor-container animate-fade-in">
      <div className="editor-header">
        <h2>{entry ? '编辑词条信息' : '新建对外汉语词条'}</h2>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      {errorMsg && <div className="editor-error-alert animate-fade-in">{errorMsg}</div>}

      {/* 基础信息行 */}
      <div className="editor-section glass-card">
        <h3 className="section-title">
          <BookOpenIcon size={18} color="var(--primary)" /> 词条核心基础属性
        </h3>
        <div className="form-grid">
          <div className="form-item">
            <label>词条名称 *</label>
            <input 
              type="text" 
              placeholder="如：小面 / 把字句 / 走马观花" 
              value={word} 
              onChange={e => setWord(e.target.value)} 
            />
          </div>

          <div className="form-item">
            <label>标准拼音</label>
            <input 
              type="text" 
              placeholder="如：xiǎo miàn" 
              value={pinyin} 
              onChange={e => setPinyin(e.target.value)} 
            />
          </div>

          <div className="form-item">
            <label>知识分类</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="词汇">词汇 (Vocabulary)</option>
              <option value="语法">语法 (Grammar)</option>
              <option value="发音">发音与拼音 (Phonetics)</option>
              <option value="汉字">汉字与笔顺 (Hanzi)</option>
              <option value="对话">情境交际对话 (Dialogue)</option>
              <option value="文化">中华文化常识 (Culture)</option>
              <option value="HSK">HSK专项应试 (HSK)</option>
            </select>
          </div>

          <div className="form-item">
            <label>适用汉语等级</label>
            <select value={hskLevel} onChange={e => setHskLevel(e.target.value)}>
              <option value="初学者">零基础 / 初学者</option>
              <option value="HSK1">HSK 1 级</option>
              <option value="HSK2">HSK 2 级</option>
              <option value="HSK3">HSK 3 级</option>
              <option value="HSK4">HSK 4 级</option>
              <option value="HSK5">HSK 5 级</option>
              <option value="HSK6">HSK 6 级</option>
            </select>
          </div>

          <div className="form-item full-width">
            <label>检索标签 (以逗号分隔)</label>
            <input 
              type="text" 
              placeholder="如：食物, 重庆, 名词" 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* 三大独立模态选项卡 */}
      <div className="modal-tabs">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FileTextIcon size={16} /> 文本释义与例句 {explanation && <span className="dot-badge">✓</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <ImageIcon size={16} /> 教学简笔画 {imageUrl && <span className="dot-badge">✓</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <VideoIcon size={16} /> 教学短视频 {videoUrl && <span className="dot-badge">✓</span>}
        </button>
      </div>

      {/* 模块 1: 文本内容 */}
      {activeTab === 'text' && (
        <div className="tab-content-panel glass-card animate-fade-in">
          <div className="panel-toolbar">
            <span className="panel-desc">包含面向第二语言学习者的词义说明、中英双语教材例句与口语交比例句。</span>
            <button 
              className="btn-primary" 
              onClick={handleAIGenerateText} 
              disabled={generatingText}
            >
              <SparklesIcon size={16} />
              {generatingText ? '大模型生成中...' : 'AI 一键智能填充文本'}
            </button>
          </div>

          {/* 文本生成动态等待动效 */}
          {generatingText && (
            <div className="ai-generating-card animate-fade-in">
              <div className="generating-header">
                <div className="generating-icon-pulse text-pulse">
                  <SparklesIcon size={22} color="#38bdf8" />
                </div>
                <div className="generating-text-info">
                  <h4>师道汉韵 · 语言大模型深度生成中...</h4>
                  <p>正在为词条【{word || '当前词条'}】智能构建标准拼音、多语种释义、规范教材例句与拓展阅读</p>
                </div>
              </div>
              <div className="progress-bar-tech">
                <div className="progress-bar-glow"></div>
              </div>
            </div>
          )}

          <div className="form-group-block">
            <label>英文精准释义与翻译</label>
            <input 
              type="text" 
              placeholder="如：Chongqing-style spicy small noodles"
              value={translation}
              onChange={e => setTranslation(e.target.value)}
            />
          </div>

          <div className="form-group-block">
            <label>词条教学解释 (面向留学生)</label>
            <textarea 
              rows="3" 
              placeholder="详细解释该词条的含义、词性及使用语境..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
            />
          </div>

          <div className="form-group-block">
            <label>规范教材例句</label>
            {textbookExamples.map((ex, idx) => (
              <div key={idx} className="example-row">
                <input 
                  type="text" 
                  placeholder="中文句子" 
                  value={ex.chinese} 
                  onChange={e => {
                    const next = [...textbookExamples]
                    next[idx].chinese = e.target.value
                    setTextbookExamples(next)
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="英文翻译" 
                  value={ex.translation} 
                  onChange={e => {
                    const next = [...textbookExamples]
                    next[idx].translation = e.target.value
                    setTextbookExamples(next)
                  }} 
                />
              </div>
            ))}
          </div>

          <div className="form-group-block">
            <label>日常口语例句</label>
            {dailyExamples.map((ex, idx) => (
              <div key={idx} className="example-row">
                <input 
                  type="text" 
                  placeholder="口语真实语境句子" 
                  value={ex.chinese} 
                  onChange={e => {
                    const next = [...dailyExamples]
                    next[idx].chinese = e.target.value
                    setDailyExamples(next)
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="口语英文翻译" 
                  value={ex.translation} 
                  onChange={e => {
                    const next = [...dailyExamples]
                    next[idx].translation = e.target.value
                    setDailyExamples(next)
                  }} 
                />
              </div>
            ))}
          </div>

          <div className="form-group-block">
            <label>主题阅读拓展 / 文化点拨</label>
            <textarea 
              rows="3" 
              placeholder="简述文化背景或阅读故事..."
              value={topicReading}
              onChange={e => setTopicReading(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 模块 2: 简笔画图片 */}
      {activeTab === 'image' && (
        <div className="tab-content-panel glass-card animate-fade-in">
          <div className="panel-toolbar">
            <span className="panel-desc">黑白线稿简笔画，适合第二语言学习者直观识物与记忆。</span>
            <div className="action-buttons">
              <label className="btn-secondary upload-label">
                <UploadIcon size={16} /> 本地上传图片
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} style={{ display: 'none' }} />
              </label>
              <button 
                className="btn-primary" 
                onClick={handleAIGenerateImage} 
                disabled={generatingImage}
              >
                <SparklesIcon size={16} />
                {generatingImage ? 'AI绘图中...' : 'AI 生成黑白简笔画'}
              </button>
            </div>
          </div>

          <div className="form-group-block">
            <label>生图提示词</label>
            <textarea 
              rows="3" 
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
            />
          </div>

          {/* 图片生成动态等待动效 */}
          {generatingImage ? (
            <div className="media-generating-box image-gen-card animate-fade-in">
              <div className="generating-icon-pulse image-pulse">
                <ImageIcon size={32} color="#0ea5e9" />
              </div>
              <h4>师道汉韵 · 黑白简笔画绘制中...</h4>
              <p>正在依据对外汉语教学黑白线稿提示词生成教学插图，请稍候（约需 5-10 秒）</p>
              <div className="progress-bar-tech">
                <div className="progress-bar-glow image"></div>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="media-preview-box">
              <img src={imageUrl} alt={word} className="preview-image" />
              <div className="preview-meta">
                <span>来源: {imageSource === 'upload' ? '本地手动上传' : '师道汉韵 AI生成'}</span>
                <button className="btn-danger-sm" onClick={() => setImageUrl('')}>删除此图片</button>
              </div>
            </div>
          ) : (
            <div className="media-empty-placeholder">
              <ImageIcon size={40} color="var(--text-muted)" />
              <p>暂无图片素材（可点击上方按钮一键 AI 生成或本地上传）</p>
            </div>
          )}
        </div>
      )}

      {/* 模块 3: 教学短视频 */}
      {activeTab === 'video' && (
        <div className="tab-content-panel glass-card animate-fade-in">
          <div className="panel-toolbar">
            <span className="panel-desc">10-15 秒真实生活语境教学短视频。</span>
            <div className="action-buttons">
              <label className="btn-secondary upload-label">
                <UploadIcon size={16} /> 本地上传视频
                <input type="file" accept="video/*" onChange={e => handleFileUpload(e, 'video')} style={{ display: 'none' }} />
              </label>
              <button 
                className="btn-primary" 
                onClick={handleAIGenerateVideo} 
                disabled={generatingVideo}
              >
                <SparklesIcon size={16} />
                {generatingVideo ? '任务执行中...' : 'AI 生成 15s 微课短视频'}
              </button>
            </div>
          </div>

          <div className="form-group-block">
            <label>视频口语教学 Prompt 脚本</label>
            <textarea 
              rows="3" 
              placeholder="不填则根据词条自动构建 15 秒情境脚本..."
              value={videoScript}
              onChange={e => setVideoScript(e.target.value)}
            />
          </div>

          {/* 视频生成动态等待动效 */}
          {generatingVideo ? (
            <div className="media-generating-box video-gen-card animate-fade-in">
              <div className="generating-icon-pulse video-pulse">
                <VideoIcon size={32} color="#ec4899" />
              </div>
              <h4>师道汉韵 · 教学微课视频渲染中...</h4>
              <p>{videoProgress || '正在调度 GPU 算力渲染 15 秒情境微课视频（约需 30-60 秒）...'}</p>
              <div className="progress-bar-tech">
                <div className="progress-bar-glow video"></div>
              </div>
              <div className="tech-steps-bar">
                <span className="step-badge active">1. 教学Prompt解析</span>
                <span className="step-badge active">2. 画面与动作渲染</span>
                <span className="step-badge">3. 音视频合成与转存</span>
              </div>
            </div>
          ) : videoUrl ? (
            <div className="media-preview-box">
              <video src={videoUrl} controls className="preview-video" />
              <div className="preview-meta">
                <span>来源: {videoSource === 'upload' ? '本地手动上传' : '师道汉韵 AI生成 (15s)'}</span>
                <button className="btn-danger-sm" onClick={() => setVideoUrl('')}>删除此视频</button>
              </div>
            </div>
          ) : (
            <div className="media-empty-placeholder">
              <VideoIcon size={40} color="var(--text-muted)" />
              <p>暂无视频素材（可提交 AI 视频生成任务或手动上传 MP4）</p>
            </div>
          )}
        </div>
      )}

      {/* 底部保存与提交按钮 */}
      <div className="editor-footer">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>
          取消
        </button>

        <button className="btn-secondary" onClick={() => handleSubmit('draft')} disabled={saving}>
          <FileTextIcon size={16} /> 存为草稿 (Draft)
        </button>

        <button className="btn-primary" onClick={() => handleSubmit('pending_review')} disabled={saving}>
          <CheckCircleIcon size={16} />
          {saving ? '正在提交...' : '提交入库审核 (Submit Review)'}
        </button>

        {userRole === 'admin' && (
          <button className="btn-success" onClick={() => handleSubmit('approved')} disabled={saving}>
            <CheckCircleIcon size={16} /> 管理员直接发布入库
          </button>
        )}
      </div>
    </div>
  )
}
