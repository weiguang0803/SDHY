import React, { useState, useEffect, useRef } from 'react'
import {
  MultimodalIcon,
  PlayIcon,
  ImageIcon,
  CloseIcon,
  ChevronIcon
} from '../Common/AdminIcons'
import './MultimodalPreview.css'

/**
 * 智能生词图文卡片组件
 * 支持本地官方简笔画即时加载 + 网络生词自动异步检索 Wikimedia 权威高清图
 */
function VocabImageCard({ item, onPreview }) {
  const isLocal = Boolean(
    item.local_image_url || (item.image_url && item.image_url.startsWith('/uploads'))
  )
  const initialUrl = item.local_image_url || (item.image_url?.startsWith('/uploads') ? item.image_url : null)

  const [imageUrl, setImageUrl] = useState(initialUrl)
  const [loading, setLoading] = useState(!initialUrl)
  const [error, setError] = useState(false)

  const keyword = item.image_keyword || item.word

  useEffect(() => {
    if (isLocal) {
      setImageUrl(initialUrl)
      setLoading(false)
      setError(false)
      return
    }

    if (!keyword) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(false)

    const fetchImage = async () => {
      try {
        // 1. 尝试以指定关键词（通常为 "汉字 英文"，如 "熊猫 panda"）检索 Wikimedia Commons
        const fetchWikimedia = async (queryTerm) => {
          const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json&origin=*`
          const res = await fetch(apiUrl)
          const data = await res.json()
          if (!data?.query?.pages) return null

          const pages = Object.values(data.query.pages)
          const imagePage = pages.find((p) => {
            const mime = p.imageinfo?.[0]?.mime || ''
            return mime.startsWith('image/') && !mime.includes('svg')
          })
          if (imagePage?.imageinfo?.[0]) {
            return imagePage.imageinfo[0].thumburl || imagePage.imageinfo[0].url
          }
          return null
        }

        let foundUrl = await fetchWikimedia(keyword)

        // 2. 若复合词未搜到，且 keyword 包含空格，尝试以纯单生词（中文）或英文单词 fallback 检索
        if (!foundUrl && keyword.includes(' ')) {
          const parts = keyword.split(' ').filter(Boolean)
          for (const part of parts) {
            foundUrl = await fetchWikimedia(part)
            if (foundUrl) break
          }
        }

        // 3. 最终兜底：以 item.word（纯中文词）单搜
        if (!foundUrl && item.word && item.word !== keyword) {
          foundUrl = await fetchWikimedia(item.word)
        }

        if (isMounted) {
          if (foundUrl) {
            setImageUrl(foundUrl)
            setError(false)
          } else {
            setError(true)
          }
        }
      } catch (err) {
        console.warn('Wikimedia image fetch failed for:', keyword, err)
        if (isMounted) setError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchImage()
    return () => {
      isMounted = false
    }
  }, [keyword, isLocal, initialUrl, item.word])

  const hasValidImage = Boolean(imageUrl && !error)

  return (
    <div 
      className={`image-card ${hasValidImage ? 'clickable' : ''}`} 
      onClick={() => {
        if (hasValidImage) {
          onPreview({ url: imageUrl, word: item.word, isLocal })
        }
      }}
      title={hasValidImage ? '点击放大灯箱审查' : (loading ? '正在检索权威图文...' : '未检索到相关图片')}
    >
      <div className="image-thumb-box">
        {loading ? (
          <div className="thumb-loading-skeleton">
            <div className="thumb-spinner" />
            <span className="thumb-loading-text">检索中...</span>
          </div>
        ) : hasValidImage ? (
          <>
            <img 
              src={imageUrl} 
              alt={item.word} 
              className={`thumb-img ${isLocal ? 'is-local-sketch' : ''}`} 
              referrerPolicy="no-referrer"
              loading="lazy" 
              onError={() => setError(true)}
            />
            <span className="zoom-hint">点击放大</span>
          </>
        ) : (
          <div className="thumb-placeholder">
            <ImageIcon size={22} color="var(--text-muted)" />
            <span className="thumb-placeholder-text">暂无图片</span>
          </div>
        )}
      </div>

      <div className="image-info">
        <span className="word-text">{item.word}</span>
        {isLocal ? (
          <span className="local-tag">官方简笔画</span>
        ) : (
          <span className="online-tag">网络检索图</span>
        )}
      </div>
    </div>
  )
}

export default function MultimodalPreview({ multimodal = {} }) {
  const [expanded, setExpanded] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)
  const [playingVideo, setPlayingVideo] = useState(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const videoRef = useRef(null)

  // 快捷 ESC 键退出模态弹窗
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewImage(null)
        setPlayingVideo(null)
      }
    }
    if (previewImage || playingVideo) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImage, playingVideo])

  if (!multimodal || typeof multimodal !== 'object') return null

  const items = Array.isArray(multimodal.multimodal_items) ? multimodal.multimodal_items : []
  const videos = Array.isArray(multimodal.videos) ? multimodal.videos : []

  if (items.length === 0 && videos.length === 0) {
    return null
  }

  // 提取各模态数据
  const imageItems = items.filter(
    (item) => item.type?.includes('image') && (item.local_image_url || item.image_keyword || item.word)
  )

  const strokeItems = []
  items.forEach((item) => {
    if (item.type?.includes('stroke_order') && Array.isArray(item.characters_for_stroke)) {
      item.characters_for_stroke.forEach((c) => {
        if (!strokeItems.includes(c)) strokeItems.push(c)
      })
    }
  })

  const hasImages = imageItems.length > 0
  const hasStrokes = strokeItems.length > 0
  const hasVideos = videos.length > 0

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  return (
    <div className="multimodal-preview-card">
      {/* 头部折叠栏 */}
      <div 
        className="preview-header" 
        onClick={() => setExpanded(!expanded)} 
        title={expanded ? '收起多模态资源审查' : '展开多模态资源审查'}
      >
        <div className="preview-header-left">
          <div className="preview-header-icon">
            <MultimodalIcon size={16} />
          </div>
          <span className="preview-header-title">多模态教学教具与微课资源</span>

          <div className="preview-badges">
            {hasImages && (
              <span className="badge-item image">
                <ImageIcon size={11} /> {imageItems.length} 张图文/简笔画
              </span>
            )}
            {hasStrokes && (
              <span className="badge-item stroke">
                {strokeItems.length} 个笔顺汉字
              </span>
            )}
            {hasVideos && (
              <span className="badge-item video">
                <PlayIcon size={11} /> {videos.length} 门微课/视频
              </span>
            )}
          </div>
        </div>

        <div className="preview-header-right">
          <span className="toggle-text">{expanded ? '收起' : '展开'}</span>
          <span className={`toggle-arrow ${expanded ? 'open' : ''}`}>
            <ChevronIcon size={16} direction={expanded ? 'up' : 'down'} />
          </span>
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="preview-content">
          {/* 1. 图文与黑白简笔画 */}
          {hasImages && (
            <div className="resource-section">
              <div className="section-label">
                <ImageIcon size={14} color="#f59e0b" /> 生词图文与教学简笔画
              </div>
              <div className="image-grid">
                {imageItems.map((item, idx) => (
                  <VocabImageCard 
                    key={idx} 
                    item={item} 
                    onPreview={setPreviewImage} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. 笔顺拆解单字 */}
          {hasStrokes && (
            <div className="resource-section">
              <div className="section-label">
                笔顺单字解构教具
              </div>
              <div className="stroke-chips-wrapper">
                {strokeItems.map((char, idx) => (
                  <div key={idx} className="stroke-char-card">
                    <span className="char-display">{char}</span>
                    <span className="char-badge">笔顺示范</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 微课与示范视频 */}
          {hasVideos && (
            <div className="resource-section">
              <div className="section-label">
                <PlayIcon size={14} color="#ef4444" /> 关联教学微课与高校视频
              </div>
              <div className="video-grid">
                {videos.map((vid, idx) => {
                  const isLocal = vid.is_local || vid.source_type === 'knowledge_base' || (vid.video_url && vid.video_url.startsWith('/uploads'))

                  return (
                    <div 
                      key={idx} 
                      className={`video-card ${isLocal ? 'local-course' : ''}`}
                      onClick={() => setPlayingVideo(vid)}
                      title={`点击审查视频：${vid.title}`}
                    >
                      <div className="video-thumb-wrapper">
                        {vid.cover ? (
                          <img 
                            src={vid.cover} 
                            alt={vid.title} 
                            className="video-cover-img" 
                            referrerPolicy="no-referrer"
                            loading="lazy" 
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="video-fallback-cover" 
                          style={{ display: vid.cover ? 'none' : 'flex' }}
                        >
                          <PlayIcon size={24} color="#ffffff" />
                        </div>
                        <div className="video-overlay">
                          <div className="play-button-icon">
                            <PlayIcon size={18} color="#ffffff" />
                          </div>
                        </div>
                        {vid.duration && (
                          <span className="video-duration">{vid.duration}</span>
                        )}
                        <span className="video-source-pill">
                          {isLocal ? '官方微课' : '名校公开课'}
                        </span>
                      </div>

                      <div className="video-info-box">
                        <div className="video-title" title={vid.title}>
                          {vid.title}
                        </div>
                        <div className="video-meta-row">
                          <span className="video-author">{vid.author || '权威名师'}</span>
                          {vid.page_url && (
                            <a 
                              href={vid.page_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="video-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              B站 ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 图片放大灯箱 */}
      {previewImage && (
        <div 
          className="admin-lightbox-overlay animate-fade-in" 
          onClick={() => setPreviewImage(null)}
          title="点击关闭灯箱"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lightbox-close-btn" 
              onClick={() => setPreviewImage(null)}
              title="关闭 (Esc)"
            >
              <CloseIcon size={20} />
            </button>
            <div className="lightbox-img-box">
              <img 
                src={previewImage.url} 
                alt={previewImage.word} 
                className="lightbox-image" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="lightbox-footer">
              <span className="lightbox-word">{previewImage.word}</span>
              <span className="lightbox-tag">
                {previewImage.isLocal 
                  ? '师道汉韵知识库 · 教学黑白线稿简笔画' 
                  : '网络检索教学图文 (Wikimedia Commons 权威收录)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 视频在线播放审查模态 */}
      {playingVideo && (
        <div 
          className="admin-video-player-overlay animate-fade-in" 
          onClick={() => setPlayingVideo(null)}
        >
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <div className="header-title-box">
                <span className="video-modal-title">{playingVideo.title}</span>
                <span className="video-modal-tag">
                  {playingVideo.is_local || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads')) 
                    ? '师道汉韵权威教学微课' 
                    : `${playingVideo.author || '高校名师'} · 精品公开课`}
                </span>
              </div>
              <button 
                className="video-modal-close" 
                onClick={() => setPlayingVideo(null)}
                title="关闭播放器 (Esc)"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="video-player-viewport">
              {playingVideo.is_local || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads')) ? (
                <video
                  ref={videoRef}
                  src={playingVideo.video_url}
                  controls
                  autoPlay
                  playsInline
                  className="native-admin-video"
                />
              ) : playingVideo.embed_url ? (
                <iframe
                  src={playingVideo.embed_url}
                  title={playingVideo.title}
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  className="embed-admin-iframe"
                />
              ) : (
                <div className="video-no-stream">
                  <p>该视频暂无内嵌播放流，支持直达 B 站原站审查：</p>
                  {playingVideo.page_url && (
                    <a 
                      href={playingVideo.page_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="external-link-btn"
                    >
                      前往原站播放 ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 本地微课倍速控制器 */}
            {(playingVideo.is_local || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads'))) && (
              <div className="video-player-controls">
                <span className="control-label">语速控制：</span>
                {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed === 0.75 ? '0.75x 慢速' : `${speed}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
