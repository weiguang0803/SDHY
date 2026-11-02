import { useState, useEffect } from 'react';
import useChatStore from '../../stores/chatStore';
import { api } from '../../services/api';
import ThemeToggle from '../Common/ThemeToggle';
import './AuthPage.css';

const EMAIL_SUFFIXES = ['@gmail.com', '@163.com', '@qq.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

// 内联高质感 SVG 矢量图标
const LogoStarIcon = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="slogo" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6c63ff"/>
        <stop offset="50%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#00d4aa"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#slogo)" fillOpacity="0.15"/>
    <rect x="2" y="2" width="60" height="60" rx="14" stroke="url(#slogo)" strokeWidth="2" strokeOpacity="0.5"/>
    <path d="M32 14L36 26L48 30L36 34L32 46L28 34L16 30L28 26L32 14Z" fill="url(#slogo)" stroke="url(#slogo)" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="32" cy="30" r="3" fill="#00d4aa"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const GraduationCapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
  </svg>
);

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useChatStore((state) => state.login);
  const register = useChatStore((state) => state.register);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    display_name: '',
    native_language: 'English',
    chinese_level: '初学者'
  });

  useEffect(() => {
    api.getPublicConfig()
      .then(res => {
        if (res && typeof res.allow_registration === 'boolean') {
          setAllowRegistration(res.allow_registration);
          if (!res.allow_registration) {
            setIsLogin(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuffixClick = (suffix) => {
    const currentEmail = formData.email.trim();
    if (!currentEmail) {
      const prefix = formData.username.trim() || 'user';
      setFormData({ ...formData, email: prefix + suffix });
    } else if (currentEmail.includes('@')) {
      const prefix = currentEmail.split('@')[0];
      setFormData({ ...formData, email: prefix + suffix });
    } else {
      setFormData({ ...formData, email: currentEmail + suffix });
    }
  };

  const validateEmail = (emailStr) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin) {
      if (!allowRegistration) {
        setError('系统目前已关闭新用户注册，请联系管理员');
        setLoading(false);
        return;
      }
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        setError('请输入格式有效的电子邮箱（如 user@gmail.com）');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      setError(err.message || (isLogin ? '登录失败，请检查账号密码' : '注册失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* 顶部右侧主题切换 */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 50 }}>
        <ThemeToggle />
      </div>

      {/* 沉浸式动态背景 */}
      <div className="auth-ambient-orb orb-primary"></div>
      <div className="auth-ambient-orb orb-secondary"></div>
      <div className="auth-ambient-grid"></div>

      <div className="auth-card glass-panel animate-slide-up">
        {/* 顶部品牌 */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <LogoStarIcon />
          </div>
          <h1 className="auth-title">师道汉韵</h1>
          <p className="auth-subtitle">AI 驱动 · 国际中文教育智慧学习平台</p>
          <div className="auth-feature-pill">
            <SparklesIcon /> 多智能体协同 · 个性化自适应导学
          </div>
        </div>

        {/* 登录/注册切换 */}
        <div className="auth-tabs-wrapper">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
              type="button"
            >
              登录学员账号
            </button>
            {allowRegistration && (
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(false); setError(''); }}
                type="button"
              >
                注册新学员
              </button>
            )}
          </div>
        </div>

        {error && <div className="auth-error animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-with-icon">
            <span className="input-icon"><UserIcon /></span>
            <input 
              type="text" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              required 
              placeholder="请输入用户名 (Username)"
            />
          </div>

          <div className="form-group-with-icon">
            <span className="input-icon"><LockIcon /></span>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required 
              placeholder="请输入密码 (Password)"
            />
          </div>

          {!isLogin && allowRegistration && (
            <div className="register-fields-group animate-slide-up">
              <div className="form-group-with-icon">
                <span className="input-icon"><MailIcon /></span>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  placeholder="电子邮箱 (用于学习报告与通知)"
                />
              </div>

              <div className="email-suffix-chips">
                <span className="chips-label">快速后缀:</span>
                {EMAIL_SUFFIXES.map(suf => (
                  <button 
                    key={suf} 
                    type="button" 
                    className="chip-btn"
                    onClick={() => handleSuffixClick(suf)}
                  >
                    {suf}
                  </button>
                ))}
              </div>

              <div className="form-group-with-icon">
                <span className="input-icon"><SparklesIcon /></span>
                <input 
                  type="text" 
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required 
                  placeholder="学员中文昵称 / 英文名 (Display Name)"
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group-with-icon">
                  <span className="input-icon"><GlobeIcon /></span>
                  <select name="native_language" value={formData.native_language} onChange={handleChange}>
                    {[
                      'English', 
                      'Japanese', 
                      'Korean', 
                      'Kinyarwanda (卢旺达语)', 
                      'Sinhala (僧伽罗语)', 
                      'French', 
                      'Spanish', 
                      'Arabic', 
                      'Russian', 
                      'Thai', 
                      'Vietnamese', 
                      'Other'
                    ].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-with-icon">
                  <span className="input-icon"><GraduationCapIcon /></span>
                  <select name="chinese_level" value={formData.chinese_level} onChange={handleChange}>
                    {['初学者', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>{isLogin ? '开启中文学习之旅' : '完成注册并进入系统'}</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          <span>师道汉韵 · 懂留学生的 AI 中文智慧导学系统</span>
        </div>
      </div>
    </div>
  );
}
