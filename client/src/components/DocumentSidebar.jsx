import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function DocumentSidebar({ selectedDocIds, onToggle, activeTab, onTabChange }) {
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [expandedChat, setExpandedChat] = useState(null);
  const fileRef = useRef();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocs(res.data);
    } catch {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      setHistory(res.data);
    } catch {
      console.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchHistory();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      console.error('Delete failed');
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Skeleton rows
  const Skeleton = () => (
    <div className="sidebar__list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="sidebar__doc skeleton-row">
          <div className="skeleton-box" style={{ width: 15, height: 15, borderRadius: 3 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="skeleton-box" style={{ width: '80%', height: 12, borderRadius: 4 }} />
            <div className="skeleton-box" style={{ width: '50%', height: 10, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <aside className="sidebar">
      {/* Tabs */}
      <div className="sidebar__tabs">
        <button
          className={`sidebar__tab${activeTab === 'docs' ? ' active' : ''}`}
          onClick={() => onTabChange('docs')}
        >
          Documents
        </button>
        <button
          className={`sidebar__tab${activeTab === 'history' ? ' active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'docs' && (
        <>
          <div className="sidebar__top">
            <label className={`sidebar__upload-btn${uploading ? ' disabled' : ''}`}>
              {uploading ? <span className="sidebar__spinner" /> : <span>+ Upload PDF</span>}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />
            </label>
          </div>

          {error && <p className="sidebar__error">{error}</p>}

          {loading ? (
            <Skeleton />
          ) : (
            <div className="sidebar__list">
              {docs.length === 0 && (
                <p className="sidebar__empty">No documents yet. Upload a PDF to get started.</p>
              )}

              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`sidebar__doc${selectedDocIds.includes(doc.id) ? ' selected' : ''}`}
                  onClick={() => onToggle(doc.id)}
                >
                  <div className="sidebar__doc-check">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => onToggle(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="sidebar__doc-info">
                    <span className="sidebar__doc-name" title={doc.originalName}>
                      {doc.originalName}
                    </span>
                    <span className="sidebar__doc-meta">
                      {formatDate(doc.createdAt)} · {doc.chunkCount} chunks
                    </span>
                  </div>
                  <button
                    className="sidebar__doc-del"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="sidebar__list">
          {history.length === 0 && (
            <p className="sidebar__empty">No chat history yet.</p>
          )}

          {history.map((chat) => (
            <div key={chat._id} className="sidebar__history-item">
              <button
                className="sidebar__history-q"
                onClick={() => setExpandedChat(expandedChat === chat._id ? null : chat._id)}
              >
                <span className="sidebar__history-q-text">{chat.question}</span>
                <span className="sidebar__history-date">{formatDate(chat.createdAt)}</span>
              </button>
              {expandedChat === chat._id && (
                <div className="sidebar__history-a">{chat.answer}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
