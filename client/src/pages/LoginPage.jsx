import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

/* ─── Static Data ─────────────────────────────────────────────── */
const QUOTES = [
  { text: '"Intelligence is the ability to adapt to change, and documents are the fuel for that change."', author: '— Stephen Hawking' },
  { text: '"An investment in knowledge pays the best interest."', author: '— Benjamin Franklin' },
  { text: '"Data is the new oil. It\'s valuable, but if unrefined it cannot really be used."', author: '— Clive Humby' },
  { text: '"The goal is to turn data into information, and information into insight."', author: '— Carly Fiorina' },
  { text: '"Not everything that can be counted counts, and not everything that counts can be counted."', author: '— Albert Einstein' },
];

const FEATURES = [
  {
    icon: 'psychology',
    title: 'AI-Powered Analysis',
    tagline: 'Instant intelligence, zero effort',
    desc: 'Extract insights, summaries and key data points from any document in seconds using state-of-the-art AI.',
    detail: 'DocuChat\'s AI pipeline runs your document through multiple passes — extracting entities, summarising sections, identifying key themes and flagging actionable insights. What would take a human hours takes the AI seconds.',
    benefits: ['Auto-generates executive summaries', 'Extracts key entities and dates', 'Identifies action items and decisions', 'Supports multi-page documents'],
    highlight: '10× faster than manual review',
  },
  {
    icon: 'chat',
    title: 'Chat with your Docs',
    tagline: 'Ask anything, get cited answers',
    desc: 'Ask natural language questions directly to your uploaded PDFs and get precise, contextual answers instantly.',
    detail: 'Our conversational engine uses semantic embedding to pinpoint the exact passages that answer your question. Every response is grounded in your document — no hallucinations, no guesswork.',
    benefits: ['Natural language questions in plain English', 'Cited answers linked to source pages', 'Follow-up context awareness', 'Multi-turn conversation memory'],
    highlight: '< 2 second response time',
  },
  {
    icon: 'manage_search',
    title: 'Smart Search',
    tagline: 'Find meaning, not just keywords',
    desc: 'Find information across all your documents with semantic search that understands meaning, not just keywords.',
    detail: 'Powered by vector embeddings, Smart Search understands synonyms, context and intent. Search for "budget concerns" and it finds passages about "cost overruns" and "financial risk" — without you writing a single query operator.',
    benefits: ['Semantic similarity matching', 'Cross-document search', 'Instant highlighted results', 'No boolean operators needed'],
    highlight: '94% search accuracy',
  },
  {
    icon: 'bolt',
    title: 'Lightning Fast',
    tagline: 'From upload to insight in seconds',
    desc: 'Optimised end-to-end pipeline. Upload, process and start conversing in under 30 seconds.',
    detail: 'Every step of our pipeline is optimised for speed — parallel PDF parsing, streaming AI responses and edge-cached embeddings mean you are never waiting. Even 200-page documents are ready to chat in under a minute.',
    benefits: ['Streaming AI responses', 'Parallel document processing', 'Edge-optimised delivery', 'No cold-start delays'],
    highlight: 'Avg. 18s to first response',
  },
  {
    icon: 'lock',
    title: 'Secure by Design',
    tagline: 'Your data stays yours, always',
    desc: 'Your documents stay private. Each user\'s data is fully isolated with JWT-protected access.',
    detail: 'Security isn\'t an afterthought — it\'s baked into the architecture. Every user\'s documents are stored in isolated namespaces, API calls require signed JWT tokens, and we never use your documents to train any model.',
    benefits: ['JWT-authenticated API access', 'Per-user data isolation', 'Zero training on your data', 'Encrypted storage at rest'],
    highlight: 'Zero third-party data sharing',
  },
  {
    icon: 'description',
    title: 'Multi-format Ready',
    tagline: 'Any format, any device',
    desc: 'Supports PDF, Word docs and more. Your document, your format — DocuChat handles the rest.',
    detail: 'Whether it\'s a scanned PDF, a dense research paper or a Word doc full of tables, DocuChat\'s parser handles it. We automatically detect and clean noisy text, extract tables and preserve document structure.',
    benefits: ['PDF, DOCX, TXT support', 'Scanned document OCR', 'Table and list extraction', 'Structure-aware parsing'],
    highlight: 'Handles 99% of document types',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload your document', desc: 'Drag and drop any PDF. Our parser extracts text, structure and metadata automatically.' },
  { step: '02', title: 'AI processes it instantly', desc: 'Gemini AI analyses your document, creates embeddings and builds a searchable knowledge base.' },
  { step: '03', title: 'Start the conversation', desc: 'Ask anything. Get cited, accurate answers drawn directly from your document content.' },
];

/* ─── Component ───────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();

  /* --- Layout state ------------------------------------------- */
  const [splitMode, setSplitMode] = useState(null);
  const [isSplit, setIsSplit]     = useState(false);
  const [formMounted, setFormMounted] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null); // tile being hovered (for progress bar)
  const leftPanelRef = useRef(null);
  const hoverTimer   = useRef(null);

  /* --- Form state --------------------------------------------- */
  const [form, setForm]             = useState({ name: '', email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]       = useState(false);
  const [slowHint, setSlowHint]     = useState(false);
  const slowTimer = useRef(null);

  const isSignUp = splitMode === 'signup';

  /* --- Quote rotation ----------------------------------------- */
  const [quoteIndex, setQuoteIndex]   = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => { setQuoteIndex(p => (p + 1) % QUOTES.length); setProgressKey(k => k + 1); setQuoteVisible(true); }, 500);
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const jumpToQuote = (i) => {
    setQuoteVisible(false);
    setTimeout(() => { setQuoteIndex(i); setProgressKey(k => k + 1); setQuoteVisible(true); }, 300);
  };

  /* --- Stats -------------------------------------------------- */
  const [stats, setStats] = useState({ totalDocs: 0, totalChats: 0 });
  useEffect(() => { api.get('/stats').then(r => setStats(r.data)).catch(() => {}); }, []);

  /* --- Scroll detection for header blur ----------------------- */
  useEffect(() => {
    const el = leftPanelRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 20);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* --- Typewriter: DC. ↔ DocuChat (loops forever) ------------- */
  const [twText, setTwText] = useState('');
  const [twCursor, setTwCursor] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const loop = async () => {
      const sequence = [
        { text: 'DC.',      holdMs: 2000 },
        { text: 'DocuChat', holdMs: 2000 },
      ];
      while (!cancelled) {
        for (const { text, holdMs } of sequence) {
          if (cancelled) return;
          // Type forward
          for (let i = 0; i <= text.length; i++) {
            if (cancelled) return;
            setTwText(text.slice(0, i));
            await sleep(i === 0 ? 300 : 75);
          }
          // Hold
          await sleep(holdMs);
          // Erase backward
          for (let i = text.length - 1; i >= 0; i--) {
            if (cancelled) return;
            setTwText(text.slice(0, i));
            await sleep(40);
          }
          await sleep(200);
        }
      }
    };

    // Blinking cursor
    const cursorIv = setInterval(() => setTwCursor(c => !c), 500);
    loop();
    return () => { cancelled = true; clearInterval(cursorIv); };
  }, []);

  // Cursor element shared between hero and form panel
  const TypewriterCursor = () => (
    <span
      style={{
        display: 'inline-block',
        width: '2px',
        height: '0.9em',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
        borderRadius: '2px',
        transition: 'opacity 0.1s',
      }}
      className={`${twCursor ? 'opacity-100' : 'opacity-0'} bg-current`}
    />
  );

  /* --- Open / close split panel ------------------------------- */
  const openPanel = useCallback((mode) => {
    setSplitMode(mode);
    setForm({ name: '', email: '', password: '' });
    setError(''); setFieldErrors({}); setAgreedToTerms(false);
    // stagger: split starts immediately, form mounts 200ms later
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setIsSplit(true);
      setTimeout(() => setFormMounted(true), 250);
    }));
  }, []);

  const closePanel = useCallback(() => {
    setFormMounted(false);
    setIsSplit(false);
    setTimeout(() => setSplitMode(null), 800);
  }, []);

  const switchMode = useCallback((mode) => {
    setFormMounted(false);
    setTimeout(() => {
      setSplitMode(mode);
      setForm({ name: '', email: '', password: '' });
      setError(''); setFieldErrors({}); setAgreedToTerms(false);
      setTimeout(() => setFormMounted(true), 100);
    }, 200);
  }, []);

  /* --- Form logic --------------------------------------------- */
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
    if (fieldErrors[e.target.name]) setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (isSignUp && !form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (isSignUp && form.password.length < 6) errs.password = 'Min. 6 characters required.';
    return errs;
  };

  const performAction = async () => {
    setLoading(true); setError(''); setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 5000);
    try {
      if (isSignUp) {
        const res = await api.post('/auth/register', form);
        navigate('/verify-otp', { state: { pendingUser: res.data.pendingUser } });
      } else {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      setError(msg || (err.message === 'Network Error' ? 'Cannot connect to server.' : err.message) || (isSignUp ? 'Registration failed.' : 'Login failed.'));
    } finally {
      clearTimeout(slowTimer.current); setSlowHint(false); setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); setError('Please fix the errors below.'); return; }
    if (isSignUp && !agreedToTerms) { setShowTermsModal(true); return; }
    performAction();
  };

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div
      className="relative flex font-body bg-black overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ════════════════════════════════════════════════
          LEFT — Liquid Hero Panel (scrollable when landing)
          ════════════════════════════════════════════════ */}
      <div
        ref={leftPanelRef}
        className="relative flex-shrink-0 overflow-y-auto overflow-x-hidden"
        style={{
          width: isSplit ? '50%' : '100%',
          transition: 'width 0.85s cubic-bezier(0.77,0,0.175,1)',
        }}
      >
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0 liquid-bg" style={{ right: isSplit ? '50%' : '0', transition: 'right 0.85s cubic-bezier(0.77,0,0.175,1)' }} />
        <div className="fixed inset-0 pointer-events-none z-0 bg-black/45" style={{ right: isSplit ? '50%' : '0', transition: 'right 0.85s cubic-bezier(0.77,0,0.175,1)' }} />

        {/* ── Sticky Nav (glass on scroll) ── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 lg:px-14 py-4 transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(0,0,0,0.45)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
            boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.18)' : 'none',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-white text-[20px]">description</span>
            </div>
            <span className="font-headline font-bold text-xl tracking-tighter text-white">DocuChat</span>
          </div>

          {isSplit ? (
            <button onClick={closePanel}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-label tracking-wide transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => openPanel('signin')}
                className="text-white/75 hover:text-white text-sm font-label font-medium transition-colors duration-200">
                Sign In
              </button>
              <button onClick={() => openPanel('signup')}
                className="group relative px-5 py-2 bg-white/10 backdrop-blur-md border border-white/25 text-white text-sm font-label font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 overflow-hidden">
                <span className="relative z-10">Get Started →</span>
                <span className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-xl" />
              </button>
            </div>
          )}
        </header>

        {/* ── Scrollable Content ── */}
        <div className="relative z-10">

          {/* ── HERO SECTION ── */}
          <section className="min-h-[calc(100dvh-72px)] flex flex-col justify-between px-8 lg:px-14 py-10">

            {/* Quote */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-px bg-white/40" />
                <span className="text-white/50 font-label tracking-widest text-[9px] uppercase">A wise quote</span>
              </div>
              <div
                style={{
                  opacity: quoteVisible ? 1 : 0,
                  transform: quoteVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}
              >
                <p className={`text-white font-serif italic leading-relaxed opacity-85 transition-all duration-700 ${isSplit ? 'text-base max-w-xs' : 'text-xl lg:text-2xl max-w-lg'}`}>
                  {QUOTES[quoteIndex].text}
                </p>
                <p className="text-white/40 font-label text-xs mt-2 tracking-wide">{QUOTES[quoteIndex].author}</p>
              </div>
              {/* Live progress bar */}
              <div className="mt-4 flex items-center gap-2 max-w-xs">
                <div className="flex-1 h-[2px] bg-white/15 rounded-full overflow-hidden">
                  <div key={progressKey} className="h-full bg-white/65 rounded-full" style={{ transformOrigin: 'left', animation: 'progressFill 15s linear forwards' }} />
                </div>
                <div className="flex gap-1">
                  {QUOTES.map((_, i) => (
                    <button key={i} onClick={() => jumpToQuote(i)}
                      className={`rounded-full transition-all duration-400 ${i === quoteIndex ? 'w-3.5 h-[5px] bg-white/90' : 'w-[5px] h-[5px] bg-white/30 hover:bg-white/60'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <div className="my-6">
              <h1 className={`text-white font-serif leading-[1.05] transition-all duration-700 mb-3 ${isSplit ? 'text-4xl' : 'text-6xl lg:text-8xl'}`}>
                Unlock Your<br />Documents'<br />Potential
              </h1>

              {/* Typewriter brand line — always visible, even in split mode */}
              <div className="mb-4 overflow-hidden">
                <p
                  className="font-headline font-bold text-white/25 tracking-tight transition-all duration-700"
                  style={{
                    fontSize: isSplit ? 'clamp(1rem, 2.5vw, 1.6rem)' : 'clamp(1.4rem, 3.5vw, 2.8rem)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {twText}<TypewriterCursor />
                </p>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ${isSplit ? 'max-h-0 opacity-0' : 'max-h-48 opacity-100'}`}>
                <p className="text-white/65 font-body text-lg lg:text-xl max-w-xl leading-relaxed mb-8">
                  DocuChat transforms static files into living conversations. Upload any PDF and unlock insights using the power of AI.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => openPanel('signup')}
                    className="group relative px-8 py-3.5 bg-white text-on-surface font-headline font-bold text-sm rounded-2xl hover:scale-105 active:scale-100 transition-all duration-200 shadow-2xl shadow-black/30 overflow-hidden">
                    <span className="relative z-10">Get Started — It's Free</span>
                  </button>
                  <button onClick={() => openPanel('signin')}
                    className="group flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-label font-semibold text-sm rounded-2xl hover:bg-white/20 transition-all duration-200">
                    Sign In
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform duration-200">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3">
              {[
                { icon: 'description', val: stats.totalDocs, label: 'Docs analyzed' },
                { icon: 'smart_toy', val: stats.totalChats, label: 'AI chats' },
                { icon: 'bolt', val: stats.totalDocs + stats.totalChats, label: 'Interactions' },
              ].map(s => (
                <div key={s.label} className="flex-1 flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3">
                  <span className="material-symbols-outlined text-white/60 text-[18px]">{s.icon}</span>
                  <div>
                    <div className="text-white font-headline font-bold text-sm leading-none">{s.val}</div>
                    <div className="text-white/50 font-label text-[10px] mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll hint (landing only) */}
            {!isSplit && (
              <div className="flex flex-col items-center gap-2 mt-6 opacity-50 animate-bounce">
                <span className="text-white text-xs font-label tracking-widest uppercase">Explore</span>
                <span className="material-symbols-outlined text-white text-xl">keyboard_arrow_down</span>
              </div>
            )}
          </section>

          {/* ── FEATURES SECTION (landing only) ── */}
          {!isSplit && (
            <section className="px-8 lg:px-14 py-16 bg-black/20 backdrop-blur-sm">
              <div className="mb-10">
                <p className="text-white/40 font-label text-xs uppercase tracking-widest mb-2">Why DocuChat</p>
                <h2 className="text-white font-serif text-4xl lg:text-5xl leading-tight max-w-md">
                  Everything you need to unlock your data
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURES.map(f => (
                  <div
                    key={f.title}
                    onMouseEnter={() => {
                      setHoverTarget(f.title);
                      hoverTimer.current = setTimeout(() => setHoveredFeature(f), 2000);
                    }}
                    onMouseLeave={() => {
                      setHoverTarget(null);
                      clearTimeout(hoverTimer.current);
                    }}
                    className="group relative bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/12 hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                    {/* 2-second progress bar at bottom */}
                    {hoverTarget === f.title && (
                      <div className="absolute bottom-0 left-0 h-[2px] bg-white/60 rounded-full"
                        style={{ animation: 'progressFill 2s linear forwards' }}
                      />
                    )}

                    <span
                      className="material-symbols-outlined text-white/45 group-hover:text-white/75 text-3xl mb-3 block transition-all duration-300 group-hover:scale-110"
                      style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}
                    >{f.icon}</span>
                    <div className="text-white font-headline font-semibold text-sm mb-1.5">{f.title}</div>
                    <div className="text-white/45 font-label text-xs leading-relaxed">{f.desc}</div>

                    {/* Hold hint */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                      <span className="text-white font-label text-[9px] tracking-wide">Hold</span>
                      <span className="material-symbols-outlined text-white text-sm">touch_app</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Feature Full-Screen Preview Overlay ── */}
              {hoveredFeature && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                  style={{ animation: 'fadeIn 0.3s ease both' }}
                  onMouseLeave={() => { setHoveredFeature(null); setHoverTarget(null); clearTimeout(hoverTimer.current); }}
                >
                  {/* Blurred backdrop */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', animation: 'fadeIn 0.3s ease both' }}
                  />

                  {/* Preview card */}
                  <div
                    className="relative z-10 w-full max-w-2xl bg-white/8 border border-white/15 rounded-3xl overflow-hidden"
                    style={{ backdropFilter: 'blur(50px)', WebkitBackdropFilter: 'blur(50px)', animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.4,0.64,1) both' }}
                  >
                    {/* Top colour bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/60 to-white/20" style={{ animation: 'progressFill 0.6s ease both 0.2s' }} />

                    <div className="p-10">
                      {/* Header row */}
                      <div className="flex items-start gap-6 mb-8" style={{ animation: 'fadeInUp 0.4s ease both 0.1s' }}>
                        <div className="w-16 h-16 flex-shrink-0 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                          <span
                            className="material-symbols-outlined text-white text-4xl"
                            style={{ fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 48' }}
                          >{hoveredFeature.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white/40 font-label text-[10px] uppercase tracking-widest mb-1">DocuChat Feature</p>
                          <h3 className="text-white font-serif text-3xl leading-tight mb-1">{hoveredFeature.title}</h3>
                          <p className="text-white/55 font-label text-sm italic">{hoveredFeature.tagline}</p>
                        </div>
                        {/* Highlight pill */}
                        <div className="flex-shrink-0 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-full">
                          <span className="text-white font-headline font-semibold text-xs">{hoveredFeature.highlight}</span>
                        </div>
                      </div>

                      {/* Detail description */}
                      <p
                        className="text-white/70 font-body text-base leading-relaxed mb-8"
                        style={{ animation: 'fadeInUp 0.4s ease both 0.18s' }}
                      >
                        {hoveredFeature.detail}
                      </p>

                      {/* Benefits grid */}
                      <div className="grid grid-cols-2 gap-2.5 mb-10" style={{ animation: 'fadeInUp 0.4s ease both 0.26s' }}>
                        {hoveredFeature.benefits.map((b, i) => (
                          <div
                            key={b}
                            className="flex items-center gap-2.5 bg-white/6 border border-white/10 rounded-xl px-4 py-3"
                            style={{ animation: `fadeInUp 0.35s ease both ${0.3 + i * 0.07}s` }}
                          >
                            <span className="material-symbols-outlined text-white/60 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                            <span className="text-white/80 font-label text-xs leading-snug">{b}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer CTA */}
                      <div
                        className="flex items-center justify-between pt-6 border-t border-white/10"
                        style={{ animation: 'fadeInUp 0.4s ease both 0.38s' }}
                      >
                        <p className="text-white/30 text-xs font-label">Move cursor away to close · Or try it now</p>
                        <button
                          onClick={() => { setHoveredFeature(null); setHoverTarget(null); openPanel('signup'); }}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white text-on-surface font-headline font-bold text-sm rounded-xl hover:scale-105 active:scale-100 transition-all duration-200 shadow-lg shadow-black/20"
                        >
                          Get Started Free
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── HOW IT WORKS (landing only) ── */}
          {!isSplit && (
            <section className="px-8 lg:px-14 py-16">
              <div className="mb-10">
                <p className="text-white/40 font-label text-xs uppercase tracking-widest mb-2">How it works</p>
                <h2 className="text-white font-serif text-4xl lg:text-5xl leading-tight">Three steps to insight</h2>
              </div>
              <div className="flex flex-col gap-6 max-w-2xl">
                {HOW_IT_WORKS.map((h, idx) => (
                  <div key={h.step} className="flex items-start gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all duration-200">
                      <span className="text-white/60 font-headline font-bold text-lg">{h.step}</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-white font-headline font-semibold text-lg mb-1">{h.title}</h3>
                      <p className="text-white/55 font-body text-sm leading-relaxed">{h.desc}</p>
                    </div>
                    {idx < HOW_IT_WORKS.length - 1 && (
                      <div className="absolute ml-[26px] mt-16 w-px h-6 bg-white/15 rounded-full" style={{ position: 'relative', left: '-100%' }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── BOTTOM CTA BANNER (landing only) ── */}
          {!isSplit && (
            <section className="px-8 lg:px-14 py-16">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-10 text-center">
                <h2 className="text-white font-serif text-4xl lg:text-5xl mb-4">Ready to get started?</h2>
                <p className="text-white/60 font-body text-base mb-8 max-w-md mx-auto">Join thousands of users who are already unlocking insights from their documents with AI.</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => openPanel('signup')}
                    className="px-8 py-3.5 bg-white text-on-surface font-headline font-bold text-sm rounded-2xl hover:scale-105 active:scale-100 transition-all duration-200 shadow-2xl shadow-black/30">
                    Create Free Account
                  </button>
                  <button onClick={() => openPanel('signin')}
                    className="px-6 py-3.5 bg-white/10 border border-white/20 text-white font-label font-semibold text-sm rounded-2xl hover:bg-white/20 transition-all duration-200">
                    Sign In
                  </button>
                </div>
                <p className="text-white/25 font-label text-[10px] tracking-wide mt-10">Made with ❤️ in India</p>
              </div>
            </section>
          )}
        </div>

        {/* DC Watermark */}
        <div className="fixed bottom-4 right-6 z-0 opacity-[0.06] pointer-events-none select-none"
          style={{ right: isSplit ? 'calc(50% + 24px)' : '24px', transition: 'right 0.85s cubic-bezier(0.77,0,0.175,1)' }}>
          <span className="text-white font-headline font-bold tracking-tighter"
            style={{ fontSize: isSplit ? '4rem' : '7rem', transition: 'font-size 0.7s ease' }}>DC.</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT — Auth Form Panel
          ════════════════════════════════════════════════ */}
      <div
        className="relative flex-shrink-0 bg-surface-container-lowest overflow-y-auto"
        style={{
          width: isSplit ? '50%' : '0%',
          opacity: isSplit ? 1 : 0,
          transform: isSplit ? 'translateX(0)' : 'translateX(60px)',
          transition: 'width 0.85s cubic-bezier(0.77,0,0.175,1), opacity 0.5s ease 0.2s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
        }}
      >
        {formMounted && splitMode && (
          <div className="w-full flex flex-col items-center min-h-full justify-center px-8 lg:px-16 py-12">
            <div className="w-full max-w-md flex flex-col gap-6">

              {/* Header */}
              <div style={{ animation: 'fadeInUp 0.5s ease both 0.1s' }}>
                <div className="flex items-center gap-2.5 mb-7">
                  <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white text-[20px]">description</span>
                  </div>
                  {/* Static logo text — no animation on right panel */}
                  <span className="font-headline font-bold text-xl tracking-tighter text-on-surface">DocuChat</span>
                </div>
                <h2 className="font-serif text-4xl text-on-surface mb-1.5">
                  {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h2>
                <p className="text-on-surface-variant font-body text-sm">
                  {isSignUp ? 'Start chatting with your AI-powered documents.' : 'Please enter your details to access your dashboard.'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl px-4 py-3 animate-shake">
                  <span>⚠</span> {error}
                </div>
              )}
              {slowHint && <div className="text-on-surface-variant text-xs text-center">⏳ Server waking up… please wait.</div>}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit} noValidate style={{ animation: 'fadeInUp 0.5s ease both 0.2s' }}>

                {/* Name - signup only */}
                <div className={`overflow-hidden transition-all duration-400 ${isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1" htmlFor="f-name">Full Name</label>
                    <input
                      id="f-name" type="text" name="name" placeholder="John Doe"
                      value={form.name} onChange={handleChange} autoComplete="name" tabIndex={isSignUp ? 0 : -1}
                      className={`w-full px-5 py-4 rounded-xl bg-surface-container-low border focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-on-surface placeholder:text-outline-variant outline-none ${fieldErrors.name ? 'border-red-400' : 'border-transparent'}`}
                    />
                    {fieldErrors.name && <span className="text-xs text-red-500 font-medium px-1">{fieldErrors.name}</span>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1" htmlFor="f-email">Email Address</label>
                  <input
                    id="f-email" type="email" name="email" placeholder="name@company.com"
                    value={form.email} onChange={handleChange} autoComplete="email"
                    className={`w-full px-5 py-4 rounded-xl bg-surface-container-low border focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-on-surface placeholder:text-outline-variant outline-none ${fieldErrors.email ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {fieldErrors.email && <span className="text-xs text-red-500 font-medium px-1">{fieldErrors.email}</span>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="f-password">
                      {isSignUp ? 'Set Password' : 'Password'}
                    </label>
                    {!isSignUp && <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>}
                  </div>
                  <div className="relative">
                    <input
                      id="f-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder={isSignUp ? 'Min. 6 characters' : '••••••••'}
                      value={form.password}
                      onChange={handleChange}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      className={`w-full pl-5 pr-12 py-4 rounded-xl bg-surface-container-low border focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-on-surface placeholder:text-outline-variant outline-none ${fieldErrors.password ? 'border-red-400' : 'border-transparent'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {fieldErrors.password && <span className="text-xs text-red-500 font-medium px-1">{fieldErrors.password}</span>}
                </div>

                {/* Remember me */}
                <div className={`overflow-hidden transition-all duration-300 ${isSignUp ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-10 opacity-100'}`}>
                  <label className="flex items-center gap-2 text-[13px] text-on-surface-variant cursor-pointer select-none px-1">
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(v => !v)} tabIndex={isSignUp ? -1 : 0} className="w-4 h-4 rounded accent-primary" />
                    Remember me
                  </label>
                </div>

                {/* Terms */}
                <div className={`overflow-hidden transition-all duration-300 ${!isSignUp ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-16 opacity-100'}`}>
                  <label className="flex items-start gap-2.5 text-[13px] text-on-surface-variant cursor-pointer select-none px-1">
                    <input type="checkbox" checked={agreedToTerms} onChange={() => { setAgreedToTerms(v => !v); setError(''); }} tabIndex={isSignUp ? 0 : -1} className="mt-0.5 w-4 h-4 rounded accent-primary" />
                    <span>I agree to the <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} className="text-primary font-bold hover:underline">Terms & Conditions</button>.</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full bg-on-background text-white font-headline font-bold py-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading
                      ? (<><span className="inline-block w-4 h-4 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" />{isSignUp ? 'Creating…' : 'Signing in…'}</>)
                      : isSignUp ? 'Create Account' : 'Sign In'
                    }
                  </button>


                </div>
              </form>

              {/* Switch mode */}
              <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease both 0.35s' }}>
                <p className="text-on-surface-variant font-body text-sm">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <button type="button" onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                    className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              {/* Footer */}
              <footer className="flex flex-wrap justify-center gap-5 pt-4 border-t border-outline-variant/10" style={{ animation: 'fadeInUp 0.5s ease both 0.4s' }}>
                <button onClick={() => setShowPrivacyModal(true)} className="text-[10px] uppercase tracking-tighter text-outline font-bold hover:text-primary transition-colors bg-transparent border-none cursor-pointer">Privacy Policy</button>
                <button onClick={() => setShowTermsModal(true)} className="text-[10px] uppercase tracking-tighter text-outline font-bold hover:text-primary transition-colors bg-transparent border-none cursor-pointer">Terms of Service</button>
                <a className="text-[10px] uppercase tracking-tighter text-outline font-bold hover:text-primary transition-colors" href="mailto:support@docuchat.app">Contact</a>
              </footer>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          Terms Modal
          ════════════════════════════════════════════════ */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease both' }}>
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-h-[85vh] max-h-[90vh]" style={{ animation: 'fadeInUp 0.3s ease both' }}>
            <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface">Terms of Service</h2>
                <p className="text-on-surface-variant text-xs mt-0.5">Last updated: April 10, 2025</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-on-surface-variant space-y-6 flex-1">
              <p className="text-[15px] font-medium text-on-surface leading-relaxed">Welcome to DocuChat. These Terms of Service govern your use of our AI-powered document analysis platform. By creating an account, you agree to be legally bound by these terms.</p>
              {[
                ['1. Acceptance of Terms', 'By accessing or using DocuChat, you confirm that you are at least 13 years of age and have the legal authority to enter into this agreement. If you are using DocuChat on behalf of an organisation, you represent that you have authority to bind that organisation. If you do not agree to these terms, you must not use our services.'],
                ['2. Account Registration & Security', 'You must provide accurate, complete and current information at registration. You are solely responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You agree to notify us immediately at support@docuchat.app if you suspect any unauthorised use of your account. DocuChat cannot be held liable for losses caused by unauthorised account access.'],
                ['3. Use of AI Features & Document Processing', 'When you upload a document, DocuChat processes its content using large language model (LLM) APIs to generate summaries, answer questions and perform analysis. You acknowledge that AI-generated content may occasionally be inaccurate and should not be relied upon as professional legal, financial or medical advice. You retain full ownership of all documents you upload.'],
                ['4. Acceptable Use Policy', 'You agree not to use DocuChat to upload, share or process any content that is unlawful, defamatory, harassing, or that infringes third-party intellectual property rights. You must not attempt to reverse-engineer, scrape, or exploit our APIs beyond their intended use. Violations may result in immediate account suspension or termination without notice.'],
                ['5. Intellectual Property', 'The DocuChat platform, including its design, codebase, branding and AI systems, is the exclusive intellectual property of DocuChat and its licensors. You are granted a limited, non-exclusive, non-transferable licence to use the platform for your own personal or internal business purposes. You may not reproduce, distribute or create derivative works without prior written consent.'],
                ['6. Limitation of Liability', 'To the maximum extent permitted by applicable law, DocuChat shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the service, including but not limited to loss of data, revenue or goodwill. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.'],
                ['7. Modifications & Termination', 'DocuChat reserves the right to modify these Terms at any time. We will notify registered users via email of material changes at least 14 days in advance. Continued use of the platform after changes take effect constitutes acceptance. We reserve the right to terminate accounts that violate these Terms.'],
                ['8. Governing Law', 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of your registered state. If you are accessing DocuChat from outside India, you remain responsible for compliance with local laws.'],
              ].map(([title, body], i) => (
                <div key={i} className="space-y-2 pb-4 border-b border-outline-variant/10 last:border-0">
                  <h3 className="text-on-surface font-bold text-[15px]">{title}</h3>
                  <p className="leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => setShowTermsModal(false)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-surface transition-colors cursor-pointer">Cancel</button>
              <button onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); if (isSignUp) performAction(); }} className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">
                I Agree {isSignUp ? '& Sign Up' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────
          Privacy Policy Modal
          ─────────────────────────────────────────────── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease both' }}>
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-h-[85vh] max-h-[90vh]" style={{ animation: 'fadeInUp 0.3s ease both' }}>
            <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface">Privacy Policy</h2>
                <p className="text-on-surface-variant text-xs mt-0.5">Last updated: April 10, 2025</p>
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-on-surface-variant space-y-6 flex-1">
              <p className="text-[15px] font-medium text-on-surface leading-relaxed">At DocuChat, we take your privacy seriously. This Privacy Policy explains what data we collect, how we use it, and the rights you have over your information.</p>
              {[
                ['1. Information We Collect', 'We collect the following when you register and use DocuChat: (a) Account Information — your name, email address and hashed password; (b) Document Content — the text and metadata of files you upload for processing; (c) Usage Data — pages visited, features used, timestamps and device/browser information; (d) Communication Data — emails you send to our support team.'],
                ['2. How We Use Your Information', 'We use your data exclusively to provide and improve the DocuChat service: to process your documents with AI, to authenticate your account securely, to send service-related emails (password resets, OTP codes), to analyse aggregate usage patterns to improve performance, and to respond to support requests. We do not use your documents or personal data for advertising.'],
                ['3. AI & Third-Party Processing', 'To power our AI features, document content is sent to third-party LLM providers (such as Google Gemini or OpenRouter) strictly for inference. These providers process your data under their own privacy agreements and are contractually prohibited from using your content for model training. We select only providers with strong privacy commitments.'],
                ['4. Data Storage & Security', 'Your account data is stored in MongoDB Atlas with encryption at rest. Document embeddings are stored in isolated, user-specific namespaces. We use industry-standard HTTPS/TLS for all data in transit. Passwords are never stored in plain text — they are hashed using bcrypt with a secure salt.'],
                ['5. Data Retention', 'We retain your account information for as long as your account is active. Document content and chat history are retained to power your session history. You may request deletion of your account and all associated data at any time by emailing privacy@docuchat.app. We will complete deletion within 30 days.'],
                ['6. Your Rights', 'Depending on your jurisdiction, you may have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data (right to erasure), restrict or object to processing, and receive a portable copy of your data. To exercise any of these rights, contact us at privacy@docuchat.app.'],
                ['7. Cookies', 'DocuChat uses only essential session cookies for authentication. We do not use tracking or analytics cookies. We do not display ads and do not share cookie data with third parties.'],
                ['8. Contact Us', 'If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact our Data Protection team at: privacy@docuchat.app. We aim to respond to all requests within 5 business days.'],
              ].map(([title, body], i) => (
                <div key={i} className="space-y-2 pb-4 border-b border-outline-variant/10 last:border-0">
                  <h3 className="text-on-surface font-bold text-[15px]">{title}</h3>
                  <p className="leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface flex justify-end sticky bottom-0">
              <button onClick={() => setShowPrivacyModal(false)} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
