import { useState, useEffect } from 'react';
import { ImageIcon } from '../Common/Icons';

export default function VocabImage({ keyword, word, localImageUrl = null }) {
  const [imageUrl, setImageUrl] = useState(localImageUrl || null);
  const [loading, setLoading] = useState(!localImageUrl);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (localImageUrl) {
      setImageUrl(localImageUrl);
      setError(false);
      setLoading(false);
      return;
    }

    if (!keyword) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    const fetchImage = async () => {
      try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();

        if (data?.query?.pages && isMounted) {
          const pages = Object.values(data.query.pages);
          const imagePage = pages.find(p => {
            const mime = p.imageinfo?.[0]?.mime || '';
            return mime.startsWith('image/') && !mime.includes('svg');
          });
          if (imagePage?.imageinfo?.[0]) {
            setImageUrl(imagePage.imageinfo[0].thumburl || imagePage.imageinfo[0].url);
          } else {
            setError(true);
          }
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Wikimedia image fetch failed:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();
    return () => { isMounted = false; };
  }, [keyword, localImageUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    if (isZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  if (loading) {
    return (
      <div className="vocab-image-card loading">
        <div className="vocab-image-skeleton"></div>
        <span className="vocab-image-label">{word}</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="vocab-image-card fallback">
        <div className="vocab-image-placeholder">
          <ImageIcon size={28} color="var(--text-muted)" />
        </div>
        <span className="vocab-image-label">{word}</span>
      </div>
    );
  }

  const isLocal = Boolean(localImageUrl || (imageUrl && imageUrl.startsWith('/uploads')));

  return (
    <>
      <div className="vocab-image-card clickable" onClick={() => setIsZoomed(true)} title="点击放大查看">
        <div className="vocab-image-thumb-wrapper">
          <img 
            src={imageUrl} 
            alt={word} 
            loading="lazy" 
            referrerPolicy="no-referrer"
            className={`vocab-image-img ${isLocal ? 'is-local-sketch' : ''}`}
            style={isLocal ? { backgroundColor: '#ffffff', objectFit: 'contain', padding: '6px' } : {}}
            onError={() => setError(true)}
          />
          <div className="vocab-image-zoom-badge">🔍 点击放大</div>
        </div>
        <span className="vocab-image-label">{word} {isLocal && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>[官方简笔画]</span>}</span>
      </div>

      {isZoomed && (
        <div 
          className="vocab-image-lightbox-overlay fade-in" 
          onClick={() => setIsZoomed(false)}
          title="点击任意位置缩小关闭"
        >
          <div className="vocab-image-lightbox-content slide-in-up">
            <button 
              className="lightbox-close-btn" 
              onClick={() => setIsZoomed(false)} 
              title="缩小关闭"
            >
              ×
            </button>
            <img 
              src={imageUrl} 
              alt={word} 
              referrerPolicy="no-referrer"
              className="lightbox-img" 
              style={isLocal ? { backgroundColor: '#ffffff', padding: '12px' } : {}}
              onClick={() => setIsZoomed(false)}
              title="点击图片缩小关闭" 
            />
            <div className="lightbox-caption">
              {word} {isLocal ? '（师道汉韵知识库 · 教学黑白线稿简笔画）' : ''}（点击缩小关闭）
            </div>
          </div>
        </div>
      )}
    </>
  );
}
