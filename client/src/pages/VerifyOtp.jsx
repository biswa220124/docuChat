import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

/* ─── Keyframe injection (runs once) ───────────────────────────── */
const STYLE_ID = 'otp-page-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes otpFadeInUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes otpPulseRing { 0%,100% { transform:scale(1); opacity:0.25; } 50% { transform:scale(1.15); opacity:0.4; } }
    @keyframes otpFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
    @keyframes otpGradient { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
    @keyframes otpShake { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-6px); } 40%,80% { transform:translateX(6px); } }
    @keyframes otpCheckIn { 0% { transform:scale(0) rotate(-45deg); opacity:0; } 60% { transform:scale(1.2) rotate(0); } 100% { transform:scale(1) rotate(0); opacity:1; } }
    @keyframes otpDigitPop { 0% { transform:scale(1); } 40% { transform:scale(1.15); } 100% { transform:scale(1); } }
    .otp-fade-in-up { animation: otpFadeInUp 0.6s ease both; }
    .otp-shake { animation: otpShake 0.4s ease; }
    .otp-digit-pop { animation: otpDigitPop 0.2s ease; }
    .otp-check-in { animation: otpCheckIn 0.5s ease both; }
  `;
  document.head.appendChild(style);
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingUser = location.state?.pendingUser;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRefs = useRef([]);

  // Redirect if no pending user
  useEffect(() => {
    if (!pendingUser) navigate('/login', { replace: true });
  }, [pendingUser, navigate]);

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      setOtp(paste.split(''));
      inputRefs.current[5]?.focus();
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        email: pendingUser.email, otp: code,
        name: pendingUser.name, hashedPassword: pendingUser.hashedPassword,
      });
      localStorage.setItem('token', res.data.token);
      setSuccess('Email verified successfully!');
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
      setOtp(['', '', '', '', '', '']);
      setShakeKey(k => k + 1);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }, [otp, pendingUser, navigate]);

  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;
    setResending(true); setError('');
    try {
      await api.post('/auth/resend-otp', { email: pendingUser.email, name: pendingUser.name });
      setSuccess('New OTP sent! Check your email.');
      setCountdown(60); setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to resend OTP. Try again.'); }
    finally { setResending(false); }
  }, [canResend, resending, pendingUser]);

  // Auto-submit
  useEffect(() => {
    if (otp.every(d => d !== '') && !loading) handleVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!pendingUser) return null;

  const maskedEmail = pendingUser.email.replace(
    /^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '•'.repeat(b.length) + c
  );

  return (
    <div className="relative flex font-body bg-black overflow-hidden" style={{ height: '100dvh' }}>

      {/* ═══════════════════════════════════════════════════
          LEFT — Liquid Hero Panel (matches LoginPage)
          ═══════════════════════════════════════════════════ */}
      <div className="relative flex-shrink-0 overflow-hidden max-md:hidden" style={{ width: '50%' }}>
        {/* Animated liquid background */}
        <div className="absolute inset-0 pointer-events-none z-0 liquid-bg" />
        <div className="absolute inset-0 pointer-events-none z-0 bg-black/45" />

        {/* Header */}
        <header className="relative z-20 flex items-center justify-between px-8 lg:px-14 py-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/login')}>
            <div className="w-9 h-9 bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-white text-[20px]">description</span>
            </div>
            <span className="font-headline font-bold text-xl tracking-tighter text-white">DocuChat</span>
          </div>
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-label tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back
          </button>
        </header>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center" style={{ height: 'calc(100% - 140px)' }}>
          {/* Large floating mail icon */}
          <div className="relative mb-8">
            {/* Pulsing rings */}
            <div className="absolute inset-0 -m-6 rounded-full border-2 border-white/10" style={{ animation: 'otpPulseRing 3s ease-in-out infinite' }} />
            <div className="absolute inset-0 -m-12 rounded-full border border-white/5" style={{ animation: 'otpPulseRing 3s ease-in-out infinite 0.5s' }} />
            <div className="absolute inset-0 -m-20 rounded-full border border-white/[0.03]" style={{ animation: 'otpPulseRing 3s ease-in-out infinite 1s' }} />

            {/* Glow */}
            <div className="absolute inset-0 -m-8 bg-white/10 rounded-full blur-[40px]" />

            {/* Icon container */}
            <div className="relative w-28 h-28 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20"
              style={{ animation: 'otpFloat 5s ease-in-out infinite' }}>
              {success ? (
                <span className="material-symbols-outlined text-emerald-400 text-[52px] otp-check-in">check_circle</span>
              ) : (
                <span className="material-symbols-outlined text-white text-[52px]">mark_email_unread</span>
              )}
            </div>
          </div>

          {/* Text */}
          <h2 className="text-white font-serif text-3xl lg:text-4xl text-center leading-tight mb-3 otp-fade-in-up">
            {success ? 'You\'re Verified!' : 'Check Your Inbox'}
          </h2>
          <p className="text-white/50 font-body text-sm text-center max-w-xs leading-relaxed otp-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {success
              ? 'Redirecting you to your dashboard…'
              : <>We've sent a 6-digit verification code to <span className="text-white/70 font-medium">{maskedEmail}</span></>
            }
          </p>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-8 otp-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i}
                className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  background: otp[i] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                  boxShadow: otp[i] ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                  transform: otp[i] ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/35 whitespace-nowrap tracking-wide z-10">
          Made with ❤️ in INDIA
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT — OTP Entry Panel
          ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-surface px-4 sm:px-6 py-8 sm:py-10 overflow-y-auto max-md:w-full">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Header */}
          <div className="otp-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-[20px]">verified_user</span>
              </div>
              <span className="font-headline font-bold text-xl tracking-tighter text-on-surface">DocuChat</span>
            </div>
            <h2 className="font-serif text-4xl text-on-surface mb-1.5">Verify Your Email</h2>
            <p className="text-on-surface-variant font-body text-sm">
              Enter the 6-digit code sent to <span className="text-on-surface font-semibold">{maskedEmail}</span>
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] rounded-xl px-4 py-3 otp-fade-in-up">
              <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div key={shakeKey} className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-4 py-3 otp-shake">
              <span>⚠</span> {error}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="otp-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1 mb-3">
              Verification Code
            </label>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading || !!success}
                  className={`
                    w-[48px] h-[56px] sm:w-[56px] sm:h-[64px] text-center text-xl sm:text-2xl font-bold rounded-xl border-[2px] outline-none
                    transition-all duration-200 bg-surface-container-low
                    ${digit
                      ? 'border-primary bg-primary/5 text-on-surface shadow-md shadow-primary/10 otp-digit-pop'
                      : 'border-outline-variant/30 text-on-surface'
                    }
                    focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:shadow-lg focus:shadow-primary/15
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <div className="otp-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || otp.some(d => d === '') || !!success}
              className="w-full bg-on-background text-white font-headline font-bold py-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="inline-block w-4 h-4 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</>
              ) : success ? (
                <><span className="material-symbols-outlined text-lg">check_circle</span> Verified!</>
              ) : (
                <>Verify Email</>
              )}
            </button>
          </div>

          {/* Resend + Back */}
          <div className="text-center otp-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <p className="text-on-surface-variant font-body text-[13px] mb-1.5">Didn't receive the code?</p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="bg-transparent border-none text-primary font-bold text-[13.5px] cursor-pointer hover:underline transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            ) : (
              <span className="text-[13px] text-on-surface-variant">
                Resend in <span className="text-primary font-bold tabular-nums">{countdown}s</span>
              </span>
            )}
          </div>

          {/* Wrong email */}
          <div className="text-center otp-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-on-surface-variant font-body text-sm">
              Wrong email?{' '}
              <button type="button" onClick={() => navigate('/login')}
                className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer">
                Go back
              </button>
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 bg-surface-container-low rounded-xl px-4 py-3 otp-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">shield</span>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              This code expires in <strong className="text-on-surface">5 minutes</strong>. Never share your OTP with anyone. DocuChat will never ask for your OTP via phone or email.
            </p>
          </div>

          {/* Footer */}
          <footer className="flex flex-wrap justify-center gap-5 pt-4 border-t border-outline-variant/10 otp-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: 'lock', label: 'Encrypted' },
              { icon: 'speed', label: '< 2s delivery' },
              { icon: 'verified', label: 'Verified' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-outline text-[11px] font-label tracking-wide">
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
                {label}
              </div>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}
