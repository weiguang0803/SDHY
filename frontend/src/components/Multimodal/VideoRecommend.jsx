import { useState, useEffect, useRef } from 'react';
import './VideoRecommend.css';

export default function VideoRecommend({ videos = [] }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isVertical, setIsVertical] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPlayingVideo(null);
      }
    };
    if (playingVideo) {
      window.addEventListener('keydown', handleKeyDown);
      const isLocal = playingVideo.is_local || playingVideo.source_type === 'knowledge_base' || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads'));
      setIsVertical(Boolean(isLocal));
      setPlaybackSpeed(1.0);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingVideo]);

  if (!videos || videos.length === 0) return null;

  const formatPlayCount = (count) => {
    if (!count) return '';
    if (count >= 10000) return (count / 10000).toFixed(1) + '万';
    return String(count);
  };

  const handleVideoLoadedMetadata = (e) => {
    const { videoWidth, videoHeight } = e.target;
    if (videoWidth && videoHeight) {
      setIsVertical(videoHeight > videoWidth);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return (
    <>
      <div className="video-recommend-grid">
        {videos.map((video, i) => {
          const isLocalVideo = video.is_local || video.source_type === 'knowledge_base' || (video.video_url && video.video_url.startsWith('/uploads'));
          
          return (
            <div 
              key={i}
              className={`video-card ${isLocalVideo ? 'local-kb-card' : ''}`}
              onClick={() => setPlayingVideo(video)}
              title={`点击播放：${video.title}`}
            >
              <div className="video-card-thumb">
                <div className="video-card-cover-wrapper">
                  {video.cover ? (
                    <img 
                      src={video.cover} 
                      alt={video.title} 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="video-card-cover"
                      style={isLocalVideo ? { objectFit: 'contain', backgroundColor: '#ffffff', padding: '6px' } : {}}
                      onError={(e) => { 
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="video-card-cover-fallback" style={{ display: video.cover ? 'none' : 'flex' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="2" />
                      <polygon points="10 8 16 12 10 16" fill="var(--text-muted)" />
                    </svg>
                    <span>{isLocalVideo ? '官方微课视频' : '名校教学视频'}</span>
                  </div>
                </div>

                {isLocalVideo ? (
                  <span className="kb-badge-tag">
                    ✨ 官方教学微课
                  </span>
                ) : video.topic ? (
                  <span className="topic-badge-tag">
                    {video.topic}公开课
                  </span>
                ) : null}

                <div className="video-card-play-overlay">
                  <div className="play-icon-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  </div>
                </div>

                {video.duration && (
                  <span className="video-card-duration">{video.duration}</span>
                )}
              </div>

              <div className="video-card-info">
                <div className="video-card-title">{video.title}</div>
                <div className="video-card-meta">
                  <span className="video-card-author">{video.author}</span>
                  {video.page_url && (
                    <a
                      href={video.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-direct-link"
                      onClick={(e) => e.stopPropagation()}
                      title="在 B 站原站 1080P 观看"
                    >
                      B站 ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playingVideo && (
        <div 
          className="video-lightbox-overlay fade-in"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className={`video-lightbox-content slide-in-up ${isVertical ? 'is-vertical-aspect' : 'is-horizontal-aspect'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* 顶栏防盗链提示与快捷直达 */}
            {!(playingVideo.is_local || playingVideo.source_type === 'knowledge_base' || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads'))) && (
              <div className="video-lightbox-topbar">
                <div className="topbar-tip">
                  <span className="topbar-dot"></span>
                  <span>若内嵌播放器提示加载受限或卡顿，推荐前往原站享受 1080P 完整画质</span>
                </div>
                {playingVideo.page_url && (
                  <a 
                    href={playingVideo.page_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="topbar-action-btn"
                  >
                    在 B 站原站观看 ↗
                  </a>
                )}
              </div>
            )}

            <button 
              className="video-lightbox-close"
              onClick={() => setPlayingVideo(null)}
              title="关闭播放器 (Esc)"
            >
              ×
            </button>
            
            <div className={`video-lightbox-player ${isVertical ? 'player-vertical' : 'player-horizontal'}`}>
              {playingVideo.is_local || playingVideo.source_type === 'knowledge_base' || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads')) ? (
                <video
                  ref={videoRef}
                  src={playingVideo.video_url}
                  controls
                  autoPlay
                  playsInline
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  className="native-html5-video"
                />
              ) : (
                <iframe
                  src={playingVideo.embed_url}
                  title={playingVideo.title}
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  sandbox="allow-top-navigation-by-user-activation allow-same-origin allow-forms allow-scripts allow-popups allow-presentation"
                />
              )}
            </div>

            <div className="video-lightbox-bottom">
              <div className="video-lightbox-title-row">
                <div className="video-lightbox-title">{playingVideo.title}</div>
                {isVertical && (
                  <span className="vertical-ratio-indicator">精选微课</span>
                )}
              </div>

              {/* 原生微课专属倍速播放控制栏（方便留学生慢速听辨） */}
              {(playingVideo.is_local || playingVideo.source_type === 'knowledge_base' || (playingVideo.video_url && playingVideo.video_url.startsWith('/uploads'))) && (
                <div className="video-speed-toolbar">
                  <span className="speed-label">播放语速：</span>
                  {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      className={`speed-chip ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed === 0.75 ? '0.75x 慢速跟读' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}

              <div className="video-lightbox-meta">
                <span>
                  {playingVideo.is_local || playingVideo.source_type === 'knowledge_base' 
                    ? '师道汉韵 · 权威情境微课' 
                    : `${playingVideo.author} · 精选教学公开课`}
                </span>
                {playingVideo.page_url && (
                  <a 
                    href={playingVideo.page_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="video-lightbox-link"
                    onClick={e => e.stopPropagation()}
                  >
                    前往 B 站 1080P 高清原站播放 ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
