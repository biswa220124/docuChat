import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import './ChatWindow.css';

const SUGGESTIONS = [
  {
    icon: '📝',
    title: 'Summarize',
    desc: 'Get a concise summary of your document',
    prompt: 'Summarize the key points of the uploaded document.',
  },
  {
    icon: '🔍',
    title: 'Analyze',
    desc: 'Deep-dive analysis of the content',
    prompt: 'Analyze the content of the uploaded document in detail.',
  },
  {
    icon: '❓',
    title: 'Ask Questions',
    desc: 'Find specific answers from your doc',
    prompt: 'What are the main topics covered in this document?',
  },
  {
    icon: '✏️',
    title: 'Extract Data',
    desc: 'Pull out key facts and figures',
    prompt: 'Extract the key facts, figures, and data points from the document.',
  },
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
      const res = await api.post('/chat', {
        documentIds: selectedDocumentIds,
        question,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: res.data.answer,
          sources: res.data.sourceChunks || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: err.response?.data?.message || 'Something went wrong. Please try again.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <main className="dc-chat">
      {/* ── Messages area ── */}
      <div className="dc-chat-messages">
        {!hasMessages && (
          /* Welcome / empty state */
          <div className="dc-welcome">
            {/* Glow orb */}
            <div className="dc-welcome-orb">
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

            <h1 className="dc-welcome-heading">
              Hello, <span className="dc-welcome-name">{userName || 'there'}</span>
            </h1>
            <p className="dc-welcome-sub">How can I assist you today?</p>

            {/* Suggestion cards */}
            <div className="dc-suggestion-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  className="dc-suggestion-card"
                  onClick={() => handleSend(s.prompt)}
                  disabled={!selectedDocumentIds.length}
                >
                  <span className="dc-suggestion-icon">{s.icon}</span>
                  <span className="dc-suggestion-title">{s.title}</span>
                  <span className="dc-suggestion-desc">{s.desc}</span>
                </button>
              ))}
            </div>

            {!selectedDocumentIds.length && (
              <p className="dc-welcome-hint">
                📎 Upload a document using the button below to get started
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`dc-msg-row ${msg.role}`}>
            <div className={`dc-msg-avatar ${msg.role}`}>
              {msg.role === 'user' ? (userName?.[0]?.toUpperCase() || 'U') : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                </svg>
              )}
            </div>
            <div className="dc-msg-bubble">
              <div className="dc-msg-label">
                {msg.role === 'user' ? 'You' : 'DocuChat AI'}
              </div>
              <div className="dc-msg-text">{msg.text}</div>

              {/* Sources for AI */}
              {msg.role === 'ai' && msg.sources?.length > 0 && (
                <div className="dc-sources">
                  <button
                    className="dc-sources-toggle"
                    onClick={() => toggleSources(i)}
                  >
                    {expandedSources[i] ? '▾ Hide sources' : '▸ View sources'}
                  </button>
                  {expandedSources[i] && (
                    <div className="dc-sources-list">
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <div key={j} className="dc-source-chip">
                          <span className="dc-source-num">#{j + 1}</span>
                          {src.length > 200 ? src.slice(0, 200) + '…' : src}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI action row */}
              {msg.role === 'ai' && (
                <div className="dc-msg-actions">
                  <button className="dc-msg-act" title="Copy" onClick={() => navigator.clipboard.writeText(msg.text)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </button>
                  <button className="dc-msg-act" title="Like">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                    </svg>
                  </button>
                  <button className="dc-msg-act" title="Dislike">
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

        {/* Thinking indicator */}
        {loading && (
          <div className="dc-msg-row ai">
            <div className="dc-msg-avatar ai">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <div className="dc-msg-bubble ai-thinking">
              <div className="dc-msg-label">DocuChat AI</div>
              <div className="dc-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="dc-input-area">
        <div className="dc-input-box">
          <textarea
            className="dc-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your document…"
            disabled={loading}
            rows={1}
          />

          <div className="dc-input-actions">
            {/* Upload File — only action */}
            <label className="dc-upload-btn" title="Upload File" style={{ opacity: uploading ? 0.6 : 1 }}>
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
              className="dc-send-btn"
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
        <p className="dc-input-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </main>
  );
}
