import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

const SUGGESTIONS = [
  { icon: '📝', title: 'Summarize', desc: 'Get a concise summary of your document', prompt: 'Summarize the key points of the uploaded document.' },
  { icon: '🔍', title: 'Analyze', desc: 'Deep-dive analysis of the content', prompt: 'Analyze the content of the uploaded document in detail.' },
  { icon: '❓', title: 'Ask Questions', desc: 'Find specific answers from your doc', prompt: 'What are the main topics covered in this document?' },
  { icon: '✏️', title: 'Extract Data', desc: 'Pull out key facts and figures', prompt: 'Extract the key facts, figures, and data points from the document.' },
];

export default function ChatWindow({ selectedDocumentIds, userName, fileRef, onUpload, uploading }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleSources = (index) => {
    setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSend = async (questionOverride) => {
    const question = (questionOverride || input).trim();
    if (!question || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', { documentIds: selectedDocumentIds, question });
      setMessages((prev) => [...prev, { role: 'ai', text: res.data.answer, sources: res.data.sourceChunks || [] }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: err.response?.data?.message || 'Something went wrong.', sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasMessages = messages.length > 0;

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-1 max-md:px-4">
        {!hasMessages && (
          <div className="m-auto text-center py-10 px-5 animate-fade-in">
            {/* Glow orb */}
            <div className="mx-auto mb-6 w-[52px] h-[52px] animate-pulse-glow rounded-full">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="26" fill="url(#orbGrad)" />
                <path d="M16 26c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10-10-4.48-10-10z" fill="white" fillOpacity="0.3"/>
                <path d="M22 22h8m-8 4h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <radialGradient id="orbGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#C084FC"/>
                    <stop offset="100%" stopColor="#7F00FF"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-800 mb-1">
              Hello, <span className="bg-gradient-to-r from-brand-700 to-accent bg-clip-text text-transparent">{userName || 'there'}</span>
            </h1>
            <p className="text-sm text-gray-400 mb-8">How can I assist you today?</p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto max-sm:grid-cols-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  className="group flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-white border border-brand-100 text-left transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-700/12 hover:border-brand-300 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  onClick={() => handleSend(s.prompt)}
                  disabled={!selectedDocumentIds.length}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[13px] font-bold text-gray-800 group-hover:text-brand-700 transition-colors">{s.title}</span>
                  <span className="text-[11px] text-gray-400 leading-snug">{s.desc}</span>
                </button>
              ))}
            </div>

            {!selectedDocumentIds.length && (
              <p className="text-sm text-gray-400 mt-6 animate-fade-in-up">
                📎 Upload a document using the button below to get started
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 py-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar */}
            <div className={`
              w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-md
              ${msg.role === 'user'
                ? 'order-2 bg-gradient-to-br from-brand-700 to-accent text-white'
                : 'bg-gradient-to-br from-brand-600 to-brand-800 text-white'}
            `}>
              {msg.role === 'user' ? (userName?.[0]?.toUpperCase() || 'U') : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                </svg>
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[70%] min-w-0 ${msg.role === 'user' ? 'order-1' : ''}`}>
              <div className={`text-[11px] font-semibold mb-1 px-0.5 ${msg.role === 'user' ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                {msg.role === 'user' ? 'You' : 'DocuChat AI'}
              </div>
              <div className={`
                text-sm leading-relaxed px-4 py-3 rounded-2xl whitespace-pre-wrap break-words
                ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-brand-700 to-accent text-white rounded-br-sm shadow-md shadow-brand-700/25'
                  : 'bg-white border border-brand-100 text-gray-800 rounded-bl-sm shadow-sm'}
              `}>
                {msg.text}
              </div>

              {/* Sources */}
              {msg.role === 'ai' && msg.sources?.length > 0 && (
                <div className="mt-1 px-0.5">
                  <button
                    className="py-0.5 text-[11px] font-medium text-gray-400 bg-transparent border-none cursor-pointer transition-colors hover:text-brand-700"
                    onClick={() => toggleSources(i)}
                  >
                    {expandedSources[i] ? '▾ Hide sources' : '▸ View sources'}
                  </button>
                  {expandedSources[i] && (
                    <div className="mt-1.5 flex flex-col gap-1.5 animate-fade-in">
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <div key={j} className="flex gap-1.5 px-2.5 py-2 text-xs text-gray-500 bg-brand-50 border border-brand-100 rounded-lg leading-snug">
                          <span className="shrink-0 font-semibold text-brand-700 text-[11px]">#{j + 1}</span>
                          <span className="break-words">{src.length > 200 ? src.slice(0, 200) + '…' : src}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI actions */}
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1 mt-1.5 px-0.5">
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-brand-50 hover:text-brand-700"
                    title="Copy" onClick={() => navigator.clipboard.writeText(msg.text)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-brand-50 hover:text-brand-700" title="Like">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                    </svg>
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-brand-50 hover:text-brand-700" title="Dislike">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
                      <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 py-1">
            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-400 mb-1 px-0.5">DocuChat AI</div>
              <div className="flex items-center gap-[5px] px-4 py-3 bg-white border border-brand-100 rounded-2xl rounded-bl-sm shadow-sm">
                <span className="block w-[7px] h-[7px] rounded-full bg-gray-400 animate-bounce-dot" />
                <span className="block w-[7px] h-[7px] rounded-full bg-gray-400 animate-bounce-dot [animation-delay:0.15s]" />
                <span className="block w-[7px] h-[7px] rounded-full bg-gray-400 animate-bounce-dot [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-brand-100 bg-white/80 backdrop-blur-xl px-6 py-3 max-md:px-4">
        <div className="flex items-end gap-2 bg-white border border-brand-100 rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-700/8 focus-within:shadow-md">
          <textarea
            className="flex-1 min-h-[40px] max-h-[120px] py-2 text-sm text-gray-800 bg-transparent outline-none resize-none placeholder:text-gray-400 font-sans"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your document…"
            disabled={loading}
            rows={1}
          />

          <div className="flex items-center gap-2 pb-0.5">
            {/* Upload button */}
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`} title="Upload File">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              {uploading ? 'Uploading…' : 'Upload File'}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={onUpload}
                disabled={uploading}
                hidden
              />
            </label>

            {/* Send */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent text-white shadow-md shadow-brand-700/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-700/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              title="Send"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </main>
  );
}
