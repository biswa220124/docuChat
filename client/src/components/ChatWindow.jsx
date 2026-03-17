import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

export default function ChatWindow({ selectedDocumentIds }) {
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

  const handleSend = async () => {
    const question = input.trim();
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

  // No documents selected
  if (!selectedDocumentIds.length) {
    return (
      <main className="chat">
        <div className="chat__empty">
          <div className="chat__empty-icon">📄</div>
          <p className="chat__empty-title">Upload a PDF and start asking questions</p>
          <p className="chat__empty-hint">
            Select at least one document from the sidebar to begin a conversation.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="chat">
      <div className="chat__messages">
        {messages.length === 0 && (
          <div className="chat__empty">
            <div className="chat__empty-icon">💬</div>
            <p className="chat__empty-title">Ask anything</p>
            <p className="chat__empty-hint">
              Your questions will be answered using the selected documents.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat__bubble chat__bubble--${msg.role}`}>
            <div className="chat__bubble-label">
              {msg.role === 'user' ? 'You' : 'DocuChat'}
            </div>
            <div className="chat__bubble-text">{msg.text}</div>

            {/* Sources toggle for AI messages */}
            {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
              <div className="chat__sources">
                <button
                  className="chat__sources-toggle"
                  onClick={() => toggleSources(i)}
                >
                  {expandedSources[i] ? '▾ Hide sources' : '▸ Sources'}
                </button>
                {expandedSources[i] && (
                  <div className="chat__sources-list">
                    {msg.sources.slice(0, 3).map((src, j) => (
                      <div key={j} className="chat__source-item">
                        <span className="chat__source-num">#{j + 1}</span>
                        <span className="chat__source-text">
                          {src.length > 200 ? src.slice(0, 200) + '…' : src}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat__bubble chat__bubble--ai">
            <div className="chat__bubble-label">DocuChat</div>
            <div className="chat__typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat__input-bar">
        <textarea
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your question…"
          rows={1}
          disabled={loading}
        />
        <button
          className="chat__send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          title="Send"
        >
          ↑
        </button>
      </div>
    </main>
  );
}
