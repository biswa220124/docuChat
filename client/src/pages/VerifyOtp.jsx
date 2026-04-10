import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

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
  const inputRefs = useRef([]);

  // Redirect if no pending user
  useEffect(() => {
    if (!pendingUser) {
      navigate('/login', { replace: true });
    }
  }, [pendingUser, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    const next = [...otp];
    next[index] = value.slice(-1); // Take last digit
    setOtp(next);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: go back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Right arrow
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        email: pendingUser.email,
        otp: code,
        name: pendingUser.name,
        hashedPassword: pendingUser.hashedPassword,
      });
      localStorage.setItem('token', res.data.token);
      setSuccess('Email verified successfully!');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setError(msg);
      // Shake animation
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', {
        email: pendingUser.email,
        name: pendingUser.name,
      });
      setSuccess('New OTP sent! Check your email.');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every((d) => d !== '') && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!pendingUser) return null;

  const maskedEmail = pendingUser.email.replace(
    /^(.{2})(.*)(@.*)$/,
    (_, a, b, c) => a + '•'.repeat(b.length) + c
  );

  return (
    <div className="flex min-h-screen font-sans bg-brand-50">
      {/* ── LEFT: OTP Panel ── */}
      <div className="flex-[0_0_46%] flex items-center justify-center p-12 bg-white max-md:flex-1 max-md:p-8 max-md:min-h-screen max-sm:p-6">
        <div className="w-full max-w-[420px]">
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

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[34px] font-extrabold text-gray-900 leading-tight tracking-tight animate-fade-in-up max-sm:text-[26px]">
              Verify Your<br />Email
            </h1>
            <p className="text-sm text-gray-400 mt-2 animate-fade-in-up">
              We've sent a 6-digit code to <span className="text-gray-600 font-medium">{maskedEmail}</span>
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] rounded-xl px-3.5 py-2.5 mb-5 animate-fade-in-up">
              <span>✅</span> {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-3.5 py-2.5 mb-5 animate-shake">
              <span>⚠</span> {error}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="flex gap-3 mb-6 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`
                  w-[54px] h-[62px] text-center text-2xl font-bold rounded-xl border-[2px] outline-none
                  transition-all duration-200 bg-gray-50
                  ${digit ? 'border-brand-700 bg-brand-50/50 text-brand-700 shadow-md shadow-brand-700/10' : 'border-gray-200 text-gray-900'}
                  focus:border-brand-700 focus:bg-white focus:ring-4 focus:ring-brand-700/10 focus:shadow-lg focus:shadow-brand-700/15
                  ${error ? 'border-red-300 animate-shake' : ''}
                `}
                disabled={loading || !!success}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || otp.some((d) => d === '') || !!success}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-brand-700 to-accent text-white text-[15px] font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-700/35 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-700/45 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg mb-5"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" />
                Verifying…
              </>
            ) : success ? (
              <>✅ Verified!</>
            ) : (
              <>Verify Email</>
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-[13px] text-gray-400 mb-1">Didn't receive the code?</p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="bg-transparent border-none text-brand-700 font-bold text-[13.5px] cursor-pointer relative transition-colors duration-200 hover:text-accent group disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
                <span className="absolute bottom-[-1px] left-0 w-0 h-0.5 bg-gradient-to-r from-brand-700 to-accent rounded-full transition-all duration-300 group-hover:w-full" />
              </button>
            ) : (
              <span className="text-[13px] text-gray-400">
                Resend in <span className="text-brand-700 font-bold tabular-nums">{countdown}s</span>
              </span>
            )}
          </div>

          {/* Back to login */}
          <p className="text-center text-[13px] text-gray-400 mt-8">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="bg-transparent border-none text-brand-700 font-bold text-[13px] cursor-pointer hover:text-accent transition-colors"
            >
              Go back
            </button>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Illustration Panel ── */}
      <div className="flex-1 relative overflow-hidden bg-[length:200%_200%] bg-gradient-to-br from-brand-700 via-purple-600 to-accent flex items-center justify-center animate-gradient max-md:hidden">
        {/* Blobs */}
        <div className="absolute w-[380px] h-[380px] rounded-full bg-white/35 blur-[60px] -top-20 -right-20 animate-blob-1 pointer-events-none" />
        <div className="absolute w-[260px] h-[260px] rounded-full bg-purple-900/35 blur-[60px] -bottom-[60px] -left-10 animate-blob-2 pointer-events-none" />

        {/* Email Verification Illustration */}
        <div className="relative z-[2] flex items-center justify-center">
          <div className="absolute w-[220px] h-[220px] bg-white/12 rounded-full blur-[30px]" />
          <svg className="w-[260px] h-[260px] drop-shadow-2xl animate-float" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Envelope body */}
            <rect x="42" y="80" width="176" height="120" rx="16" fill="white" fillOpacity="0.9"/>
            {/* Envelope flap */}
            <path d="M42 96L130 156L218 96" stroke="#7F00FF" strokeWidth="3" strokeLinecap="round" fill="white" fillOpacity="0.3"/>
            {/* Shield with check */}
            <circle cx="130" cy="120" r="32" fill="#7F00FF" fillOpacity="0.15"/>
            <path d="M130 95C130 95 155 105 155 125C155 145 130 155 130 155C130 155 105 145 105 125C105 105 130 95 130 95Z" fill="#7F00FF" fillOpacity="0.9"/>
            <path d="M118 125L126 133L142 117" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Stars */}
            <circle cx="60" cy="65" r="4" fill="white" fillOpacity="0.6"/>
            <circle cx="200" cy="70" r="3" fill="white" fillOpacity="0.5"/>
            <circle cx="185" cy="210" r="5" fill="white" fillOpacity="0.4"/>
            <circle cx="75" cy="205" r="3" fill="white" fillOpacity="0.5"/>
          </svg>
        </div>

        {/* Centered message */}
        <div className="absolute z-10 bottom-[18%] left-0 right-0 text-center px-8">
          <p className="text-white/90 text-xl font-bold tracking-tight leading-snug">
            Verify your email<br />to proceed further
          </p>
          <p className="text-white/50 text-sm mt-2">Check your inbox for the 6-digit code</p>
        </div>

        {/* Tagline */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/55 whitespace-nowrap tracking-wide z-10">
          Made with ❤️ in INDIA
        </p>
      </div>
    </div>
  );
}
