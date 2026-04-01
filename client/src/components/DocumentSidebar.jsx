import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import './Sidebar.css';

export default function DocumentSidebar({
  selectedDocIds,
  onToggle,
  onLogout,
  userEmail,
  onNewChat,
  mobileOpen,
  onMobileClose,
}) {
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      console.error('Delete failed');
    }
  };

  // Derive username from email
  const userName = userEmail ? userEmail.split('@')[0] : 'User';
  const userInitial = userName[0]?.toUpperCase() || 'U';

  // Filter docs by search
  const filteredDocs = docs.filter((d) =>
    d.originalName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={onMobileClose} />}

      <aside className={`dc-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* ── Logo ── */}
        <div className="dc-sb-logo">
          <span className="dc-sb-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z" />
            </svg>
          </span>
          <span className="dc-sb-logo-text">DocuChat</span>
        </div>

        {/* ── New Chat Button ── */}
        <button
          className="dc-sb-new-btn"
          onClick={onNewChat}
          disabled={uploading}
        >
          <span className="dc-sb-new-icon">+</span>
          {uploading ? 'Uploading…' : 'New Chat'}
        </button>

        {/* ── Search ── */}
        <div className="dc-sb-search">
          <svg className="dc-sb-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="dc-sb-search-input"
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="dc-sb-error">{error}</div>
        )}

        {/* ── History ── */}
        <div className="dc-sb-section-label">History</div>

        <div className="dc-sb-list">
          {loading ? (
            <div className="dc-sb-empty">Loading…</div>
          ) : filteredDocs.length === 0 && history.length === 0 ? (
            <div className="dc-sb-empty">No conversations yet.</div>
          ) : (
            <>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`dc-sb-item ${selectedDocIds.includes(doc.id) ? 'active' : ''}`}
                  onClick={() => { onToggle(doc.id); onMobileClose?.(); }}
                >
                  <svg className="dc-sb-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <span className="dc-sb-item-text" title={doc.originalName}>
                    {doc.originalName}
                  </span>
                  {selectedDocIds.includes(doc.id) && (
                    <button
                      className="dc-sb-item-del"
                      onClick={(e) => handleDelete(doc.id, e)}
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {history.length > 0 && (
                <>
                  <div className="dc-sb-subsection">Recent</div>
                  {history.slice(0, 5).map((chat) => (
                    <div key={chat._id} className="dc-sb-item muted">
                      <svg className="dc-sb-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      <span className="dc-sb-item-text">{chat.question}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Upload hidden input ── */}
        <label className="dc-sb-upload-label">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            hidden
          />
        </label>

        {/* ── User Profile Footer ── */}
        <div className="dc-sb-footer">
          <div className="dc-sb-user">
            <div className="dc-sb-avatar">{userInitial}</div>
            <div className="dc-sb-user-info">
              <span className="dc-sb-user-name">{userName}</span>
              <span className="dc-sb-user-email">{userEmail || 'user@example.com'}</span>
            </div>
            <button className="dc-sb-logout" onClick={onLogout} title="Log out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
