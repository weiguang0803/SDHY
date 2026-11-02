import { useEffect, useRef, useCallback, useState } from 'react';
import HanziWriter from 'hanzi-writer';

export default function HanziStroke({ character, size = 150 }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('sdhy_theme') || 'dark';
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      const next = e.detail?.theme || document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(next);
    };
    window.addEventListener('sdhy_theme_change', handleThemeChange);
    return () => window.removeEventListener('sdhy_theme_change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !character) return;
    containerRef.current.innerHTML = '';

    const isLight = theme === 'light';

    try {
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 250,
        strokeColor: isLight ? '#1e293b' : '#e4e4e7',
        radicalColor: '#6366f1',
        showOutline: true,
        outlineColor: isLight ? '#cbd5e1' : '#3f3f5a',
        drawingColor: '#6366f1',
        charDataLoader: (char) => {
          return fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${char}.json`)
            .then(res => {
              if (!res.ok) throw new Error('Not found');
              return res.json();
            });
        }
      });

      // Auto-play stroke animation
      writerRef.current.animateCharacter();
    } catch (e) {
      console.error('HanziWriter init error:', e);
    }

    return () => {
      writerRef.current = null;
    };
  }, [character, size, theme]);

  const handleReplay = useCallback(() => {
    if (writerRef.current) {
      writerRef.current.animateCharacter();
    }
  }, []);

  return (
    <div className="hanzi-stroke-card">
      <div className="hanzi-stroke-char-label">{character}</div>
      <div 
        ref={containerRef} 
        className="hanzi-stroke-canvas"
        style={{ width: size, height: size }}
      />
      <button className="hanzi-stroke-replay-btn" onClick={handleReplay}>
        ▶ 重播笔顺
      </button>
    </div>
  );
}
