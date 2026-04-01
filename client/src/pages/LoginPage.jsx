import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const slowTimer = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
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
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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

          {/* Heading */}
          <h1 className="login-heading">Hello,<br />Welcome Back</h1>
          <p className="login-subtext">Access your AI-powered documents</p>

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
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            {/* Remember + Forgot */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span className="custom-checkbox"></span>
                Remember me
              </label>
              <Link to="#" className="login-forgot">Forgot Password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-signup-link">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Illustration Panel ── */}
      <div className="login-right">
        {/* Floating blobs */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        {/* Floating chat bubbles */}
        <div className="float-card chat-card-1">
          <div className="float-avatar">🤖</div>
          <div className="float-msg">
            <span>AI Summary Ready</span>
            <small>Just now</small>
          </div>
        </div>

        <div className="float-card chat-card-2">
          <div className="float-avatar doc">📄</div>
          <div className="float-msg">
            <span>3 documents analyzed</span>
            <small>2 min ago</small>
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

        {/* Stats pill */}
        <div className="float-card stats-card">
          <span className="stats-icon">⚡</span>
          <div>
            <span className="stats-num">10k+</span>
            <small>docs processed</small>
          </div>
        </div>

        {/* Tagline */}
        <p className="ill-tagline">Powered by AI · Secured by design</p>
      </div>
    </div>
  );
}
