import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

  const [stats, setStats] = useState({ totalDocs: 0, totalChats: 0, lastActivity: null });

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
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
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    setError('');
    setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 5000);
    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload = isSignUp ? form : { email: form.email, password: form.password };
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      const respError = err.response?.data?.message || err.response?.data?.error;
      const netError = err.message === 'Network Error' ? 'Cannot connect to server. Please try again.' : err.message;
      setError(respError || netError || (isSignUp ? 'Registration failed.' : 'Login failed.'));
    } finally {
      clearTimeout(slowTimer.current);
      setSlowHint(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-brand-50">
      {/* ── LEFT: Form Panel ── */}
      <div className="flex-[0_0_46%] flex items-center justify-center p-12 bg-white max-md:flex-1 max-md:p-12 max-md:min-h-screen max-sm:p-9">
        <div className="w-full max-w-[400px] max-md:max-w-[440px]">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <span className="flex items-center justify-center w-[34px] h-[34px] bg-gradient-to-br from-brand-700 to-accent rounded-lg shadow-lg shadow-brand-700/35">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              </svg>
            </span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-brand-700 to-accent bg-clip-text text-transparent">
              DocuChat
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[34px] font-extrabold text-gray-900 leading-tight tracking-tight animate-fade-in-up max-sm:text-[28px]" key={isSignUp ? 's' : 'l'}>
              {isSignUp ? <>Create<br />Account</> : <>Hello,<br />Welcome Back</>}
            </h1>
            <p className="text-sm text-gray-400 mt-2 animate-fade-in-up" key={isSignUp ? 'ss' : 'sl'}>
              {isSignUp ? 'Start chatting with your AI-powered documents' : 'Access your AI-powered documents'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-3.5 py-2.5 mb-5 animate-shake">
              <span>⚠</span> {error}
            </div>
          )}
          {slowHint && (
            <div className="text-gray-400 text-xs text-center mb-3.5">⏳ Server waking up… please wait.</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Name field — animated toggle */}
            <div className={`overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isSignUp ? 'field-visible' : 'field-hidden'}`}>
              <label htmlFor="login-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                id="login-name" type="text" name="name" placeholder="John Doe"
                value={form.name} onChange={handleChange} autoComplete="name"
                tabIndex={isSignUp ? 0 : -1}
                className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-brand-700 focus:bg-white focus:ring-4 focus:ring-brand-700/10"
              />
              {fieldErrors.name && <span className="block mt-1 text-xs text-red-500 font-medium">{fieldErrors.name}</span>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                id="login-email" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} autoComplete="email"
                className={`w-full px-4 py-3 border-[1.5px] rounded-xl text-sm text-gray-900 bg-gray-50 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-brand-700 focus:bg-white focus:ring-4 focus:ring-brand-700/10 ${fieldErrors.email ? 'border-red-400 ring-4 ring-red-400/12' : 'border-gray-200'}`}
              />
              {fieldErrors.email && <span className="block mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="login-password" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                {isSignUp ? 'Set Password' : 'Password'}
              </label>
              <input
                id="login-password" type="password" name="password"
                placeholder={isSignUp ? 'Min. 6 characters' : '••••••••••••'}
                value={form.password} onChange={handleChange}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className={`w-full px-4 py-3 border-[1.5px] rounded-xl text-sm text-gray-900 bg-gray-50 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-brand-700 focus:bg-white focus:ring-4 focus:ring-brand-700/10 ${fieldErrors.password ? 'border-red-400 ring-4 ring-red-400/12' : 'border-gray-200'}`}
              />
              {fieldErrors.password && <span className="block mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</span>}
            </div>

            {/* Remember + Forgot */}
            <div className={`overflow-hidden transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isSignUp ? 'options-hidden' : 'options-visible'}`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} tabIndex={isSignUp ? -1 : 0}
                    className="w-4 h-4 rounded border-brand-300 text-brand-700 focus:ring-brand-700/20 accent-brand-700" />
                  Remember me
                </label>
                <a href="#" className="text-[13px] text-brand-700 font-medium hover:text-accent transition-colors duration-200 hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-brand-700 to-accent text-white text-[15px] font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-700/35 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-700/45 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <><span className="inline-block w-4 h-4 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" /> {isSignUp ? 'Creating…' : 'Signing in…'}</>
              ) : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Footer toggle */}
          <p className="text-center text-[13.5px] text-gray-400 mt-7">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={toggleMode}
              className="ml-1 bg-transparent border-none text-brand-700 font-bold text-[13.5px] cursor-pointer relative transition-colors duration-200 hover:text-accent group">
              {isSignUp ? 'Sign In' : 'Sign Up'}
              <span className="absolute bottom-[-1px] left-0 w-0 h-0.5 bg-gradient-to-r from-brand-700 to-accent rounded-full transition-all duration-300 group-hover:w-full" />
            </button>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Illustration Panel ── */}
      <div className="flex-1 relative overflow-hidden bg-[length:200%_200%] bg-gradient-to-br from-brand-700 via-purple-600 to-accent flex items-center justify-center animate-gradient max-md:hidden">
        {/* Blobs */}
        <div className="absolute w-[380px] h-[380px] rounded-full bg-white/35 blur-[60px] -top-20 -right-20 animate-blob-1 pointer-events-none" />
        <div className="absolute w-[260px] h-[260px] rounded-full bg-purple-900/35 blur-[60px] -bottom-[60px] -left-10 animate-blob-2 pointer-events-none" />

        {/* Floating card 1 */}
        <div className="absolute z-10 top-[14%] left-[6%] flex items-center gap-2.5 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl px-4 py-2.5 text-white shadow-xl shadow-black/15 animate-float-card-1">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-lg shrink-0">🤖</div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">{stats.totalChats} AI Chats</span>
            <small className="text-[11px] text-white/65 mt-px">and counting</small>
          </div>
        </div>

        {/* Floating card 2 */}
        <div className="absolute z-10 bottom-[22%] right-[5%] flex items-center gap-2.5 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl px-4 py-2.5 text-white shadow-xl shadow-black/15 animate-float-card-2">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">📄</div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">{stats.totalDocs} documents analyzed</span>
            <small className="text-[11px] text-white/65 mt-px">{timeAgo(stats.lastActivity)}</small>
          </div>
        </div>

        {/* Central illustration */}
        <div className="relative z-[2] flex items-center justify-center">
          <div className="absolute w-[220px] h-[220px] bg-white/12 rounded-full blur-[30px]" />
          <svg className="w-[260px] h-[260px] drop-shadow-2xl animate-float" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="62" y="58" width="136" height="170" rx="14" fill="white" fillOpacity="0.15"/>
            <rect x="54" y="50" width="136" height="170" rx="14" fill="white" fillOpacity="0.25"/>
            <rect x="46" y="42" width="136" height="170" rx="14" fill="white" fillOpacity="0.9"/>
            <rect x="66" y="74" width="76" height="7" rx="3.5" fill="#C4B5FD"/>
            <rect x="66" y="91" width="96" height="5" rx="2.5" fill="#DDD6FE"/>
            <rect x="66" y="104" width="86" height="5" rx="2.5" fill="#DDD6FE"/>
            <rect x="66" y="117" width="60" height="5" rx="2.5" fill="#EDE9FE"/>
            <rect x="66" y="138" width="96" height="36" rx="10" fill="#7F00FF"/>
            <text x="80" y="152" fill="white" fontSize="8" fontFamily="Inter,sans-serif">✨ Summarize this doc</text>
            <text x="80" y="165" fill="#DDD6FE" fontSize="7" fontFamily="Inter,sans-serif">DocuChat AI</text>
            <rect x="148" y="160" width="52" height="44" rx="10" fill="white" fillOpacity="0.95"/>
            <circle cx="162" cy="178" r="6" fill="#7F00FF"/>
            <circle cx="186" cy="178" r="6" fill="#7F00FF"/>
            <rect x="158" y="192" width="28" height="4" rx="2" fill="#C4B5FD"/>
            <rect x="168" y="154" width="12" height="8" rx="3" fill="white" fillOpacity="0.9"/>
            <circle cx="208" cy="80" r="22" fill="white" fillOpacity="0.2"/>
            <rect x="198" y="80" width="20" height="16" rx="4" fill="white" fillOpacity="0.9"/>
            <path d="M202 80v-5a6 6 0 0112 0v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="208" cy="88" r="2.5" fill="#7F00FF"/>
          </svg>
        </div>

        {/* Stats pill */}
        <div className="absolute z-10 bottom-[10%] left-[8%] flex items-center gap-2 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl px-4 py-2.5 text-white shadow-xl shadow-black/15 animate-float-card-1">
          <span className="text-xl">⚡</span>
          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold">{stats.totalDocs + stats.totalChats}</span>
            <small className="text-[11px] text-white/70">total interactions</small>
          </div>
        </div>

        {/* Tagline */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/55 whitespace-nowrap tracking-wide z-10">
          Made with ❤️ in INDIA
        </p>
      </div>
    </div>
  );
}
