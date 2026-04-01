import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../auth-responsive.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-wrapper">
      <div className="auth-header-text">
        <h1>Register Page</h1>
        <p>Designed with adobe XD</p>
      </div>

      <div className="auth-modern-card">
        <div className="auth-modern-left">
          <div className="auth-modern-logo">Logo</div>
          <div className="auth-modern-illustration">
            <img src="https://placehold.co/400x320/e2e8f0/1e293b?text=Security+Illustration" alt="Register Illustration" />
          </div>
        </div>

        <div className="auth-modern-right">
          <h2 className="auth-modern-title">Create Account</h2>
          <p className="auth-modern-subtitle">Start chatting with your documents</p>

          {error && <div style={{color:'#dc2626', fontSize:'13px', marginBottom:'16px'}}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-modern-group">
              <span className="auth-modern-icon">👤</span>
              <input
                id="register-name"
                type="text"
                name="name"
                className="auth-modern-input"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="auth-modern-group">
              <span className="auth-modern-icon">✉️</span>
              <input
                id="register-email"
                type="email"
                name="email"
                className="auth-modern-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-modern-group">
              <span className="auth-modern-icon">🔒</span>
              <input
                id="register-password"
                type="password"
                name="password"
                className="auth-modern-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="auth-modern-btn" disabled={loading}>
              {loading ? 'Wait...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-modern-register">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

          <div className="auth-modern-footer">
            <div>Copyright Reserved @2021</div>
            <div className="auth-modern-footer-links">
              <span>Terms and Conditions</span> | <span>Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
