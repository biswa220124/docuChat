import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const slowTimer = useRef(null);

  // Real stats from backend
  const [stats, setStats] = useState({ totalDocs: 0, totalChats: 0, lastActivity: null });

  useEffect(() => {
    api.get('/stats')
      .then((res) => setStats(res.data))
      .catch(() => {}); // silently fail
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setError('');
    setFieldErrors({});
    setForm({ name: '', email: '', password: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (isSignUp && !form.name.trim()) errors.name = 'Name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    else if (isSignUp && form.password.length < 6) errors.password = 'Min. 6 characters required.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError('');
    setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 5000);
    try {
      if (isSignUp) {
        const res = await api.post('/auth/register', form);
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isSignUp ? 'Registration failed. Please try again.' : 'Login failed. Please try again.')
      );
    } finally {
      clearTimeout(slowTimer.current);
      setSlowHint(false);
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── LEFT: Form Panel ── */}
      <div className="login-left">
        <div className="login-form-container">
          {/* Logo */}
          <div className="login-logo">
            <span className="login-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#7F00FF">
                <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              </svg>
            </span>
            <span className="login-logo-text">DocuChat</span>
          </div>

          {/* Heading — animated */}
          <div className="login-heading-wrapper">
            <h1 className="login-heading" key={isSignUp ? 'signup' : 'login'}>
              {isSignUp ? (
                <>Create<br />Account</>
              ) : (
                <>Hello,<br />Welcome Back</>
              )}
            </h1>
            <p className="login-subtext" key={isSignUp ? 'sub-signup' : 'sub-login'}>
              {isSignUp
                ? 'Start chatting with your AI-powered documents'
                : 'Access your AI-powered documents'}
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div className="login-alert">
              <span>⚠</span> {error}
            </div>
          )}
          {slowHint && (
            <div className="login-hint">⏳ Server waking up… please wait.</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Name — slides in for signup */}
            <div className={`login-field login-field-animated ${isSignUp ? 'field-visible' : 'field-hidden'}`}>
              <label htmlFor="login-name">Full Name</label>
              <input
                id="login-name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                tabIndex={isSignUp ? 0 : -1}
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>

            {/* Email */}
            <div className={`login-field ${fieldErrors.email ? 'has-error' : ''}`}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className={`login-field ${fieldErrors.password ? 'has-error' : ''}`}>
              <label htmlFor="login-password">
                {isSignUp ? 'Set Password' : 'Password'}
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder={isSignUp ? 'Min. 6 characters' : '••••••••••••'}
                value={form.password}
                onChange={handleChange}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            {/* Remember + Forgot — only for login */}
            <div className={`login-options-wrapper ${isSignUp ? 'options-hidden' : 'options-visible'}`}>
              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    tabIndex={isSignUp ? -1 : 0}
                  />
                  <span className="custom-checkbox"></span>
                  Remember me
                </label>
                <a href="#" className="login-forgot">Forgot Password?</a>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span> {isSignUp ? 'Creating…' : 'Signing in…'}</>
              ) : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Footer toggle */}
          <p className="login-footer">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="login-toggle-link"
                  onClick={toggleMode}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="login-toggle-link"
                  onClick={toggleMode}
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Illustration Panel ── */}
      <div className="login-right">
        {/* Floating blobs */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        {/* Floating chat bubbles — real data */}
        <div className="float-card chat-card-1">
          <div className="float-avatar">🤖</div>
          <div className="float-msg">
            <span>{stats.totalChats} AI Chats</span>
            <small>and counting</small>
          </div>
        </div>

        <div className="float-card chat-card-2">
          <div className="float-avatar doc">📄</div>
          <div className="float-msg">
            <span>{stats.totalDocs} documents analyzed</span>
            <small>{timeAgo(stats.lastActivity)}</small>
          </div>
        </div>

        {/* Central illustration */}
        <div className="illustration-center">
          <div className="ill-glow"></div>
          <svg className="ill-svg" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Document stack */}
            <rect x="62" y="58" width="136" height="170" rx="14" fill="white" fillOpacity="0.15"/>
            <rect x="54" y="50" width="136" height="170" rx="14" fill="white" fillOpacity="0.25"/>
            <rect x="46" y="42" width="136" height="170" rx="14" fill="white" fillOpacity="0.9"/>
            {/* Lines on doc */}
            <rect x="66" y="74" width="76" height="7" rx="3.5" fill="#C4B5FD"/>
            <rect x="66" y="91" width="96" height="5" rx="2.5" fill="#DDD6FE"/>
            <rect x="66" y="104" width="86" height="5" rx="2.5" fill="#DDD6FE"/>
            <rect x="66" y="117" width="60" height="5" rx="2.5" fill="#EDE9FE"/>
            {/* Chat bubble */}
            <rect x="66" y="138" width="96" height="36" rx="10" fill="#7F00FF"/>
            <text x="80" y="152" fill="white" fontSize="8" fontFamily="Inter,sans-serif">✨ Summarize this doc</text>
            <text x="80" y="165" fill="#DDD6FE" fontSize="7" fontFamily="Inter,sans-serif">DocuChat AI</text>
            {/* Robot head */}
            <rect x="148" y="160" width="52" height="44" rx="10" fill="white" fillOpacity="0.95"/>
            <circle cx="162" cy="178" r="6" fill="#7F00FF"/>
            <circle cx="186" cy="178" r="6" fill="#7F00FF"/>
            <rect x="158" y="192" width="28" height="4" rx="2" fill="#C4B5FD"/>
            <rect x="168" y="154" width="12" height="8" rx="3" fill="white" fillOpacity="0.9"/>
            {/* Lock icon */}
            <circle cx="208" cy="80" r="22" fill="white" fillOpacity="0.2"/>
            <rect x="198" y="80" width="20" height="16" rx="4" fill="white" fillOpacity="0.9"/>
            <path d="M202 80v-5a6 6 0 0112 0v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="208" cy="88" r="2.5" fill="#7F00FF"/>
          </svg>
        </div>

        {/* Stats pill — real data */}
        <div className="float-card stats-card">
          <span className="stats-icon">⚡</span>
          <div>
            <span className="stats-num">{stats.totalDocs + stats.totalChats}</span>
            <small>total interactions</small>
          </div>
        </div>

        {/* Tagline */}
        <p className="ill-tagline">Made with ❤️ in INDIA</p>
      </div>
    </div>
  );
}
