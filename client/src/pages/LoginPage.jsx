import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const slowTimer = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSlowHint(false);

    // If request takes >5s, likely a Render cold start — warn the user
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
    <div className="auth-page">
      <ThemeToggle />

      <div className="auth-card">
        {/* Left gradient hero */}
        <div className="auth-card__hero">
          <div className="hero__content">
            <div className="hero__logo">DocuChat</div>
            <p className="hero__tagline">
              Chat with your documents using AI.<br />
              Upload, ask, and get instant answers.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-card__form">
          <div className="form__header">
            <h2 className="form__title">Welcome back</h2>
            <p className="form__subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div className="form-error">
              <span>⚠</span> {error}
            </div>
          )}

          {slowHint && (
            <div className="form-hint" style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted, #888)', textAlign: 'center' }}>
              ⏳ Server is waking up (free tier cold start)… please wait a moment.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="form__footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
