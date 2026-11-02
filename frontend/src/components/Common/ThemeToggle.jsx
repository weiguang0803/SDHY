import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from './Icons';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('sdhy_theme') || 
           'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sdhy_theme', theme);
    window.dispatchEvent(new CustomEvent('sdhy_theme_change', { detail: { theme } }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isLight = theme === 'light';

  return (
    <button 
      className={`theme-toggle-btn ${isLight ? 'is-light' : 'is-dark'} ${className}`}
      onClick={toggleTheme}
      title={isLight ? '切换至深色模式' : '切换至浅色模式'}
      aria-label="Toggle Color Theme"
    >
      <div className="theme-toggle-icon-wrap">
        {isLight ? (
          <MoonIcon size={18} color="var(--primary)" />
        ) : (
          <SunIcon size={18} color="#f59e0b" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isLight ? '深色模式' : '浅色模式'}
        </span>
      )}
    </button>
  );
}
