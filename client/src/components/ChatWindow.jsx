import { useState, useRef, useEffect, useCallback } from 'react';
import { PanelLeftOpen, Menu, Plus, ArrowUp, ChevronDown, ChevronUp,
         ThumbsUp, ThumbsDown, Copy, Check, X, FileText, Sun, Moon, LogOut } from 'lucide-react';
import api from '../utils/api';

const SUGGESTIONS = [
  { label: 'Summarize this document',         prompt: 'Summarize the key points of the uploaded document.' },
  { label: 'Generate an email from this doc', prompt: 'Draft a professional email based on the key content in this document.' },
  { label: 'What is this document about?',    prompt: 'What are the main topics covered in this document?' },
  { label: 'Extract key data and figures',    prompt: 'Extract the key facts, figures, and data points from the document.' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Theme token maps ─── */
const DARK = {
  page:        'bg-[#0f0f0f]',
  topBar:      'bg-[#0f0f0f] border-white/[0.05]',
  topIcon:     'text-white/30 hover:text-white/80 hover:bg-white/[0.05]',
  topLabel:    'text-white/30',
  topAvatar:   'bg-white/[0.08] border-white/10 text-white/60',
  userBubble:  'bg-[#2f2f2f] text-white',
  aiAvatar:    'bg-white/[0.06] border-white/10 text-white/50',
  aiLabel:     'text-white/25',
  srcBtn:      'text-white/25 hover:text-white/60',
  srcCard:     'bg-white/[0.02] border-white/[0.05] text-white/30',
  srcNum:      'text-white/25',
  actionBtn:   'text-white/25 hover:text-white/60 hover:bg-white/[0.04]',
  dot:         'bg-white/30',
  cursor:      'bg-white/50',
  disclaimer:  'text-white/15',
  inputWrap:   'bg-[#2f2f2f]',
  inputText:   'text-white placeholder-white/20',
  attachChat:  'border-white/15 text-white/50 hover:text-white/80 hover:border-white/30',
  sendBtn:     'bg-white text-[#111] hover:bg-white/90',
  chatBg:      'bg-[#0f0f0f]',
  newChat:     'text-white/25 hover:text-white/70 hover:bg-white/[0.05]',
  backBtn:     'text-white/25 hover:text-white/70 hover:bg-white/[0.05]',
};

const LIGHT = {
  page:        'bg-white',
  topBar:      'bg-white border-black/[0.06]',
  topIcon:     'text-black/30 hover:text-black/80 hover:bg-black/[0.04]',
  topLabel:    'text-black/30',
  topAvatar:   'bg-black/[0.06] border-black/10 text-black/50',
  userBubble:  'bg-[#f0f0f0] text-[#0d0d0d]',
  aiAvatar:    'bg-black/[0.05] border-black/[0.08] text-black/40',
  aiLabel:     'text-black/25',
  srcBtn:      'text-black/30 hover:text-black/70',
  srcCard:     'bg-black/[0.02] border-black/[0.06] text-black/40',
  srcNum:      'text-black/25',
  actionBtn:   'text-black/25 hover:text-black/60 hover:bg-black/[0.04]',
  dot:         'bg-black/25',
  cursor:      'bg-black/50',
  disclaimer:  'text-black/20',
  inputWrap:   'bg-[#f0f0f0]',
  inputText:   'text-[#0d0d0d] placeholder-black/30',
  attachChat:  'border-black/15 text-black/40 hover:text-black/70 hover:border-black/30',
  sendBtn:     'bg-[#0d0d0d] text-white hover:bg-black/80',
  chatBg:      'bg-white',
  newChat:     'text-black/25 hover:text-black/70 hover:bg-black/[0.05]',
  backBtn:     'text-black/25 hover:text-black/70 hover:bg-black/[0.05]',
};

/* ─── Animated Ray Background ─── */
function RayBackground({ isDark }) {
  const glowRef  = useRef(null);
  const ringsRef = useRef(null);
  useEffect(() => {
    let frame, t = 0;
    const tick = () => {
      t += 0.004;
      const pulse  = isDark
        ? 0.55 + 0.3  * (0.5 + 0.5 * Math.sin(t))
        : 0.30 + 0.15 * (0.5 + 0.5 * Math.sin(t)); // softer in light
      const sway   = 30          * Math.sin(t * 0.7);
      const bob    = 20          * Math.sin(t * 0.5);
      const rScale = 0.97 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.6));
      if (glowRef.current)  { glowRef.current.style.opacity = pulse; glowRef.current.style.transform = `translateX(calc(-50% + ${sway}px)) translateY(${bob}px)`; }
      if (ringsRef.current) { ringsRef.current.style.transform = `translate(-50%) rotate(180deg) scale(${rScale}) translateY(${bob * 0.4}px)`; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line
  }, [isDark]);

  const fill = isDark ? '#0f0f0f' : '#f5fbf8'; // page bg colour used inside rings
  const glowGrad = isDark
    ? 'radial-gradient(circle at center 800px,rgba(61,158,122,0.85) 0%,rgba(61,158,122,0.38) 12%,rgba(61,158,122,0.18) 17%,rgba(61,158,122,0.07) 22%,rgba(15,15,15,0.2) 25%)'
    : 'radial-gradient(circle at center 800px,rgba(61,158,122,0.35) 0%,rgba(61,158,122,0.14) 14%,rgba(61,158,122,0.05) 20%,transparent 27%)';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0" style={{ background: isDark ? '#0f0f0f' : '#f2faf7' }} />
      <div ref={glowRef} className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px]"
        style={{ willChange:'transform,opacity', background: glowGrad }} />
      <div ref={ringsRef} className="absolute left-1/2 w-[1600px] h-[1600px] sm:w-[3043px] sm:h-[2865px]"
        style={{ top:'175px', transform:'translate(-50%) rotate(180deg)', willChange:'transform' }}>
        {/* Ring 5 – innermost visible border */}
        <div className="absolute w-full h-full rounded-full -mt-[13px]" style={{
          background: isDark
            ? 'radial-gradient(43.89% 25.74% at 50.02% 97.24%,#111114 0%,#0f0f0f 100%)'
            : `radial-gradient(43.89% 25.74% at 50.02% 97.24%,${fill} 0%,${fill} 100%)`,
          border: isDark ? '16px solid white' : '16px solid #c8ece0',
          transform:'rotate(180deg)', zIndex:5,
        }} />
        <div className="absolute w-full h-full rounded-full -mt-[11px]" style={{ background: fill, border:'23px solid #a8d5c4', transform:'rotate(180deg)', zIndex:4 }} />
        <div className="absolute w-full h-full rounded-full -mt-[8px]"  style={{ background: fill, border:'23px solid #7dc4ad', transform:'rotate(180deg)', zIndex:3 }} />
        <div className="absolute w-full h-full rounded-full -mt-[4px]"  style={{ background: fill, border:'23px solid #4aab8c', transform:'rotate(180deg)', zIndex:2 }} />
        <div className="absolute w-full h-full rounded-full"             style={{
          background: fill,
          border:'20px solid #1e7a57',
          boxShadow: isDark ? '0 -15px 40px rgba(30,122,87,0.7)' : '0 -15px 40px rgba(30,122,87,0.35)',
          transform:'rotate(180deg)', zIndex:1,
        }} />
      </div>
    </div>
  );
}

/* ─── Markdown renderer ─── */
function MarkdownText({ text, isDark }) {
  const textColor  = isDark ? 'text-white'       : 'text-[#0d0d0d]';
  const listColor  = isDark ? 'text-white'       : 'text-[#0d0d0d]';
  const dotColor   = isDark ? 'bg-white/40'      : 'bg-black/30';
  const numColor   = isDark ? 'text-white/50'    : 'text-black/40';
  const codeStyle  = isDark
    ? 'bg-white/10 text-white/80'
    : 'bg-black/[0.06] text-[#0d0d0d]';
  const hrStyle    = isDark ? 'border-white/10'  : 'border-black/10';

  const parseInline = (str) => {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[2]) parts.push(<strong key={m.index} className="font-semibold">{m[2]}</strong>);
      if (m[3]) parts.push(<code key={m.index} className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${codeStyle}`}>{m[3]}</code>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts;
  };

  const lines = text.split('\n');
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3} /.test(line)) {
      const lvl = line.match(/^(#{1,3}) /)[1].length;
      nodes.push(
        <div key={i} className={`font-bold mt-4 mb-2 ${textColor} ${lvl===1?'text-[17px]':lvl===2?'text-[15px]':'text-[14px]'}`}>
          {parseInline(line.replace(/^#{1,3} /,''))}
        </div>
      );
    } else if (/^[-*•] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) { items.push(lines[i].replace(/^[-*•] /,'')); i++; }
      nodes.push(
        <ul key={`ul${i}`} className="my-2 space-y-1.5">
          {items.map((it,j) => (
            <li key={j} className={`flex items-start gap-2.5 ${listColor} text-[15px] leading-relaxed`}>
              <span className={`mt-[9px] w-[4px] h-[4px] rounded-full ${dotColor} shrink-0`} />
              <span>{parseInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /,'')); i++; }
      nodes.push(
        <ol key={`ol${i}`} className="my-2 space-y-1.5">
          {items.map((it,j) => (
            <li key={j} className={`flex items-start gap-2.5 ${listColor} text-[15px] leading-relaxed`}>
              <span className={`font-semibold ${numColor} shrink-0 w-4`}>{j+1}.</span>
              <span>{parseInline(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} className={`${hrStyle} my-4`} />);
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(
        <p key={i} className={`${textColor} leading-[1.8] text-[15px]`}>{parseInline(line)}</p>
      );
    }
    i++;
  }
  return <div>{nodes}</div>;
}

/* ─── Document pill ─── */
function DocPill({ name, onRemove, isDark }) {
  const short = name?.length > 32 ? name.slice(0,30)+'…' : name;
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 w-fit border ${
      isDark ? 'bg-[#252529] border-white/[0.1]' : 'bg-[#f0f0f0] border-black/[0.08]'
    }`}>
      <div className="w-8 h-8 rounded-xl bg-[#3d9e7a] flex items-center justify-center shrink-0">
        <FileText size={15} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className={`text-[13px] font-semibold truncate ${isDark ? 'text-white' : 'text-[#0d0d0d]'}`}>{short}</div>
        <div className={`text-[10px] ${isDark ? 'text-[#5a5a5f]' : 'text-[#888]'}`}>Document</div>
      </div>
      <button onClick={onRemove}
        className={`w-5 h-5 rounded-full flex items-center justify-center hover:opacity-100 transition-all border-none cursor-pointer shrink-0 ${
          isDark ? 'bg-white/10 hover:bg-white/20 text-[#8a8a8f] hover:text-white' : 'bg-black/8 hover:bg-black/15 text-[#888] hover:text-[#111]'
        }`}>
        <X size={11} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function ChatWindow({
  selectedDocumentIds, activeDocName, onRemoveDoc,
  userName, userEmail, fileRef, onUpload, uploading,
  sidebarOpen, onToggleSidebar,
  theme, onToggleTheme, onLogout,
}) {
  const isDark = theme === 'dark';
  const T      = isDark ? DARK : LIGHT;
  const SG     = { fontFamily: "'Space Grotesk', sans-serif" };

  const [phase, setPhase]                     = useState('welcome');
  const [messages, setMessages]               = useState([]);
  const [streamText, setStreamText]           = useState('');
  const [isStreaming, setIsStreaming]         = useState(false);
  const [input, setInput]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedIndex, setCopiedIndex]         = useState(null);
  const [twText, setTwText]                   = useState('');
  const [twDone, setTwDone]                   = useState(false);
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const menuRef = useRef(null);

  /* Close user menu on outside click */
  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bottomRef      = useRef(null);
  const textareaRef    = useRef(null);

  const nickname    = localStorage.getItem('dc_nickname') || '';
  const displayName = nickname || userName || 'there';
  const userInitial = displayName[0]?.toUpperCase() || 'U';

  /* Typewriter greeting */
  useEffect(() => {
    const key = 'dc_tw_done';
    const full = `${getGreeting()}, ${displayName.split(' ')[0]}`;
    if (sessionStorage.getItem(key)) { setTwText(full); setTwDone(true); return; }
    let idx = 0;
    const t = setInterval(() => {
      idx++;
      setTwText(full.slice(0, idx));
      if (idx >= full.length) { clearInterval(t); setTwDone(true); sessionStorage.setItem(key, '1'); }
    }, 60);
    return () => clearInterval(t);
  // eslint-disable-next-line
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamText, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`; }
  }, [input]);

  /* ── Real SSE stream reader ─────────────────────────────────── */
  const streamAbortRef = useRef(null);

  const readSSEStream = useCallback(async (question) => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    // Abort any previous in-flight stream
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    const resp = await fetch(`${baseURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ documentIds: selectedDocumentIds, question }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || 'Too many requests. Please wait a moment.');
      }
      throw new Error(`Server error ${resp.status}`);
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let sources  = [];

    setIsStreaming(true);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.token) {
            fullText += payload.token;
            setStreamText(fullText);
          }
          if (payload.done) {
            sources = payload.sourceChunks || [];
          }
          if (payload.error) {
            throw new Error(payload.error);
          }
        } catch { /* partial JSON, skip */ }
      }
    }

    setMessages(p => [...p, { role: 'ai', text: fullText, sources }]);
    setStreamText('');
    setIsStreaming(false);
    return fullText;
  }, [selectedDocumentIds]);

  useEffect(() => () => { streamAbortRef.current?.abort(); }, []);

  const toggleSources = i => setExpandedSources(p => ({ ...p, [i]: !p[i] }));

  const handleSend = async (override) => {
    const question = (override || input).trim();
    if (!question || loading || isStreaming) return;

    const isFirst = messages.length === 0 && phase === 'welcome';
    setMessages(p => [...p, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    if (isFirst) {
      setPhase('exiting');
      setTimeout(() => setPhase('chat'), 370);
    }

    try {
      setLoading(false); // dots off once stream starts
      await readSSEStream(question);
    } catch (err) {
      if (err.name === 'AbortError') return; // user navigated away
      setIsStreaming(false);
      setStreamText('');
      const msg = err.message || 'Something went wrong. Please try again.';
      setMessages(p => [...p, { role: 'ai', text: msg, sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    streamAbortRef.current?.abort();
    setPhase('welcome');
    setMessages([]); setStreamText('');
    setIsStreaming(false); setLoading(false);
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleCopy = async (text, i) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(i); setTimeout(() => setCopiedIndex(null), 1500);
  };

  /* ─── Input area (shared welcome + chat) ─── */
  const InputArea = ({ inChat = false }) => (
    <div className={inChat ? 'w-full' : 'w-full max-w-[680px]'}>
      {activeDocName && selectedDocumentIds.length > 0 && (
        <div className="mb-3">
          <DocPill name={activeDocName} onRemove={onRemoveDoc} isDark={isDark} />
        </div>
      )}
      <div className={`relative rounded-3xl overflow-hidden ${
        inChat ? T.inputWrap : (isDark ? 'bg-[#1e1e22] ring-1 ring-white/[0.08]' : 'bg-[#f4f4f4] ring-1 ring-black/[0.06]')
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={selectedDocumentIds.length ? 'Ask anything about your document…' : 'Upload a PDF, then ask anything…'}
          disabled={loading || isStreaming}
          className={`w-full resize-none bg-transparent text-[15px] px-5 pt-4 pb-3 focus:outline-none min-h-[52px] max-h-[180px] leading-relaxed ${T.inputText}`}
          rows={1}
        />
        <div className="flex items-center justify-between px-3 pb-3 gap-2">
          {/* Attach */}
          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
            uploading ? 'opacity-40 pointer-events-none' : (inChat ? T.attachChat : (isDark
              ? 'border-[#3d9e7a]/50 bg-[#3d9e7a]/10 text-[#3d9e7a] hover:bg-[#3d9e7a]/20'
              : 'border-[#3d9e7a]/50 bg-[#3d9e7a]/10 text-[#3d9e7a] hover:bg-[#3d9e7a]/20'))
          }`}>
            <Plus size={13} />
            {uploading ? 'Uploading…' : 'Attach PDF'}
            <input ref={fileRef} type="file" accept=".pdf" onChange={onUpload} disabled={uploading} hidden />
          </label>
          {/* Send */}
          <button onClick={() => handleSend()} disabled={loading || isStreaming || !input.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm border-none disabled:opacity-25 disabled:cursor-not-allowed ${T.sendBtn}`}>
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Top control bar icons (shared) ─── */
  const TopBtn = ({ onClick, children, title, extra = '' }) => (
    <button onClick={onClick} title={title}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all border-none cursor-pointer ${T.topIcon} ${extra}`}>
      {children}
    </button>
  );

  /* ═══ RENDER ═══ */
  return (
    <main className={`flex-1 flex flex-col min-w-0 h-full relative overflow-hidden ${T.page}`}>

      {/* ── WELCOME SCREEN ── */}
      {(phase === 'welcome' || phase === 'exiting') && (
        <div className={`absolute inset-0 flex flex-col ${phase === 'exiting' ? 'hero-exit' : ''}`}>
          <RayBackground isDark={isDark} />

          {/* Top bar — adapts to theme */}
          <div className="relative z-20 flex items-center justify-between px-5 py-4">
            <button onClick={onToggleSidebar}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border-none cursor-pointer ${
                isDark ? 'bg-white/[0.06] hover:bg-white/10 text-[#8a8a8f] hover:text-white' : 'bg-black/[0.06] hover:bg-black/10 text-[#6a6a6f] hover:text-[#111]'
              }`}>
              {sidebarOpen ? <Menu size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onToggleTheme} title="Toggle theme"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border-none cursor-pointer ${
                  isDark ? 'bg-white/[0.06] hover:bg-white/10 text-[#8a8a8f] hover:text-white' : 'bg-black/[0.06] hover:bg-black/10 text-[#6a6a6f] hover:text-[#111]'
                }`}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(o => !o)}
                  className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl transition-all border-none cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                  }`}>
                  <span className={`text-[13px] font-semibold ${isDark ? 'text-[#c0c0c5]' : 'text-[#3a5a4a]'}`} style={SG}>
                    {nickname || userName || 'User'}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#3d9e7a]/20 border border-[#3d9e7a]/30 flex items-center justify-center text-[#3d9e7a] text-[15px] font-bold select-none" style={SG}>
                    {userInitial}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                    isDark ? 'bg-[#1a1a1e] border-white/[0.1]' : 'bg-white border-black/[0.08]'
                  }`} style={{ animation: 'fadeInUp 0.15s ease both' }}>
                    <div className={`px-4 py-3 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.06]'}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-widest mb-0.5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Signed in as</p>
                      <p className={`text-[13px] font-medium truncate ${isDark ? 'text-white' : 'text-[#111]'}`} style={SG}>{userEmail || userName}</p>
                    </div>
                    <div className="p-1.5">
                      <button onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left bg-transparent border-none cursor-pointer transition-all ${
                          isDark ? 'text-red-400/80 hover:text-red-400 hover:bg-red-400/8' : 'text-red-500/80 hover:text-red-600 hover:bg-red-50'
                        }`} style={SG}>
                        <LogOut size={14} />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6"
            style={{ paddingTop: '80px', paddingBottom: '60px' }}>
            <div className="mb-5 text-center" style={{ minHeight: '32px' }}>
              <span className="text-[#3d9e7a] text-lg font-semibold tracking-wide" style={SG}>
                {twText}
                {!twDone && <span className="inline-block w-0.5 h-[1.1em] bg-[#3d9e7a] ml-0.5 align-middle" style={{ animation: 'blink 0.8s step-end infinite' }} />}
              </span>
            </div>
            <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight text-center mb-2 ${isDark ? 'text-white' : 'text-[#111]'}`} style={SG}>
              What will you{' '}
              <span className={`bg-gradient-to-b bg-clip-text text-transparent italic ${
                isDark
                  ? 'from-[#5ec9a4] via-[#3d9e7a] to-white'
                  : 'from-[#2d8a6a] via-[#3d9e7a] to-[#1a6b50]'
              }`}>ask</span>
              {' '}today?
            </h1>
            <p className={`text-base font-medium text-center mb-10 max-w-md ${isDark ? 'text-[#6a7a6f]' : 'text-[#5a7a6a]'}`}>
              Upload a document and unlock deep AI-powered answers from your files.
            </p>
            {selectedDocumentIds.length > 0 && (
              <div className="w-full max-w-[680px] mb-6">
                <p className={`text-[10px] uppercase tracking-widest mb-3 font-semibold ${isDark ? 'text-[#4a5a4f]' : 'text-[#5a8a70]'}`}>Try asking</p>
                <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => handleSend(s.prompt)}
                      className={`group p-4 rounded-2xl text-left border transition-all ${
                        isDark
                          ? 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.08] hover:border-[#3d9e7a]/30'
                          : 'bg-white/60 border-[#3d9e7a]/15 hover:bg-white/90 hover:border-[#3d9e7a]/40 shadow-sm'
                      }`}>
                      <span className={`text-[13px] font-medium transition-colors ${
                        isDark ? 'text-[#a0b0a5] group-hover:text-white' : 'text-[#4a7a5a] group-hover:text-[#1e5a38]'
                      }`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <InputArea />
            {!selectedDocumentIds.length && (
              <p className={`text-xs mt-3 ${isDark ? 'text-[#4a5a4f]' : 'text-[#7aaa8a]'}`}>Use "Attach PDF" to upload first</p>
            )}
          </div>
        </div>
      )}

      {/* ── CHAT VIEW ── */}
      {phase === 'chat' && (
        <div className={`flex flex-col h-full chat-enter ${T.chatBg}`}>

          {/* Top bar */}
          <div className={`flex items-center justify-between px-5 h-14 border-b shrink-0 ${T.topBar}`}>
            <div className="flex items-center gap-1">
              <TopBtn onClick={onToggleSidebar}>
                {sidebarOpen ? <Menu size={16} /> : <PanelLeftOpen size={16} />}
              </TopBtn>
              <button onClick={handleBack}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all border-none cursor-pointer ${T.backBtn}`}>
                <span style={{ fontSize: '15px', lineHeight: 1 }}>↩</span>
                <span style={SG}>New chat</span>
              </button>
            </div>

            <span className={`text-[13px] font-medium ${T.topLabel}`} style={SG}>DocuChat</span>

            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <TopBtn onClick={onToggleTheme} title={isDark ? 'Switch to light' : 'Switch to dark'}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </TopBtn>
              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(o => !o)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[12px] font-bold cursor-pointer transition-all ${T.topAvatar} hover:scale-105`}
                  style={SG}>
                  {userInitial}
                </button>
                {userMenuOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                    isDark ? 'bg-[#1a1a1e] border-white/[0.1]' : 'bg-white border-black/[0.08]'
                  }`} style={{ animation: 'fadeInUp 0.15s ease both' }}>
                    <div className={`px-4 py-3 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.06]'}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-widest mb-0.5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Signed in as</p>
                      <p className={`text-[13px] font-medium truncate ${isDark ? 'text-white' : 'text-[#111]'}`} style={SG}>{userEmail || userName}</p>
                    </div>
                    <div className="p-1.5">
                      <button onClick={() => { setUserMenuOpen(false); onLogout?.(); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left bg-transparent border-none cursor-pointer transition-all ${
                          isDark ? 'text-red-400/80 hover:text-red-400 hover:bg-red-400/8' : 'text-red-500/80 hover:text-red-600 hover:bg-red-50'
                        }`} style={SG}>
                        <LogOut size={14} />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-8 flex flex-col">
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: 'fadeInUp 0.25s ease both' }}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end px-5 sm:px-10 mb-8">
                    <div className={`max-w-[75%] rounded-3xl rounded-tr-sm px-5 py-3.5 text-[15px] leading-relaxed ${T.userBubble}`}>
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 px-5 sm:px-10 mb-8">
                    <div className={`w-7 h-7 rounded-full shrink-0 border flex items-center justify-center text-[10px] font-bold mt-0.5 ${T.aiAvatar}`} style={SG}>DC</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <MarkdownText text={msg.text} isDark={isDark} />

                      {/* Sources */}
                      {msg.sources?.length > 0 && (
                        <div className="mt-4">
                          <button onClick={() => toggleSources(i)}
                            className={`flex items-center gap-1.5 text-[12px] bg-transparent border-none cursor-pointer transition-colors ${T.srcBtn}`}>
                            {expandedSources[i] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expandedSources[i] ? 'Hide sources' : `${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}`}
                          </button>
                          {expandedSources[i] && (
                            <div className="mt-2 flex flex-col gap-2" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                              {msg.sources.slice(0, 3).map((src, j) => (
                                <div key={j} className={`flex gap-2.5 px-4 py-3 text-xs rounded-xl leading-relaxed border ${T.srcCard}`}>
                                  <span className={`shrink-0 font-bold text-[10px] mt-0.5 ${T.srcNum}`}>#{j + 1}</span>
                                  <span className="break-words">{src.length > 200 ? src.slice(0, 200) + '…' : src}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 mt-3">
                        <button onClick={() => handleCopy(msg.text, i)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-transparent border-none cursor-pointer transition-all ${T.actionBtn}`}>
                          {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                          {copiedIndex === i ? 'Copied' : 'Copy'}
                        </button>
                        <button className={`px-2 py-1 rounded-lg bg-transparent border-none cursor-pointer transition-all ${T.actionBtn}`}><ThumbsUp size={12} /></button>
                        <button className={`px-2 py-1 rounded-lg bg-transparent border-none cursor-pointer transition-all ${T.actionBtn}`}><ThumbsDown size={12} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming */}
            {isStreaming && (
              <div className="flex gap-4 px-5 sm:px-10 mb-8" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <div className={`w-7 h-7 rounded-full shrink-0 border flex items-center justify-center text-[10px] font-bold mt-0.5 ${T.aiAvatar}`} style={SG}>DC</div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownText text={streamText} isDark={isDark} />
                  <span className={`inline-block w-[3px] h-[16px] ml-0.5 align-middle rounded-sm ${T.cursor}`}
                    style={{ animation: 'blink 0.6s step-end infinite' }} />
                </div>
              </div>
            )}

            {/* Loading dots */}
            {loading && !isStreaming && (
              <div className="flex gap-4 px-5 sm:px-10 mb-8" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <div className={`w-7 h-7 rounded-full shrink-0 border flex items-center justify-center text-[10px] font-bold mt-0.5 ${T.aiAvatar}`} style={SG}>DC</div>
                <div className="pt-2 flex items-center gap-1.5">
                  <span className={`block w-2 h-2 rounded-full animate-bounce-dot ${T.dot}`} />
                  <span className={`block w-2 h-2 rounded-full animate-bounce-dot [animation-delay:0.15s] ${T.dot}`} />
                  <span className={`block w-2 h-2 rounded-full animate-bounce-dot [animation-delay:0.3s] ${T.dot}`} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className={`px-5 sm:px-10 pb-5 pt-2 shrink-0 ${T.chatBg}`}>
            <InputArea inChat />
            <p className={`text-[10px] text-center mt-2 ${T.disclaimer}`}>DocuChat can make mistakes. Verify important information.</p>
          </div>
        </div>
      )}
    </main>
  );
}
