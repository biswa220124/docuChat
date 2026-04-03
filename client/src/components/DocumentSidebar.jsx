import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function DocumentSidebar({
  selectedDocIds,
  onToggle,
  onLogout,
  userEmail,
  onNewChat,
  mobileOpen,
  onMobileClose,
  registerRefreshDocs,
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

  useEffect(() => {
    if (registerRefreshDocs) registerRefreshDocs(fetchDocs);
  }, [registerRefreshDocs]);

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

  const userName = userEmail ? userEmail.split('@')[0] : 'User';
  const userInitial = userName[0]?.toUpperCase() || 'U';
  const filteredDocs = docs.filter((d) =>
    d.originalName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={onMobileClose} />
      )}

      <aside className={`
        w-[270px] shrink-0 flex flex-col bg-white/80 backdrop-blur-xl border-r border-brand-100
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[280px] max-md:shadow-2xl max-md:shadow-black/20
        ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-4">
          <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-brand-700 to-accent rounded-lg shadow-md shadow-brand-700/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4a2 2 0 00-2 2v14a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z" />
            </svg>
          </span>
          <span className="text-[17px] font-extrabold bg-gradient-to-br from-brand-700 to-accent bg-clip-text text-transparent">DocuChat</span>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-3">
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-br from-brand-700 to-accent text-white text-sm font-bold shadow-md shadow-brand-700/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-700/40 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onNewChat}
            disabled={uploading}
          >
            <span className="text-lg leading-none">+</span>
            {uploading ? 'Uploading…' : 'New Chat'}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-brand-50/80 border border-brand-100 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-brand-300 focus:ring-4 focus:ring-brand-700/8"
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 animate-shake">
            {error}
          </div>
        )}

        {/* Section label */}
        <div className="px-5 pt-2 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
          History
        </div>

        {/* Doc/History list */}
        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="px-3 py-6 text-center text-[13px] text-gray-400">Loading…</div>
          ) : filteredDocs.length === 0 && history.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-gray-400">No conversations yet.</div>
          ) : (
            <>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`
                    group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                    ${selectedDocIds.includes(doc.id)
                      ? 'bg-gradient-to-r from-brand-100 to-brand-50 border-l-[3px] border-brand-700 shadow-sm'
                      : 'hover:bg-brand-50/60 border-l-[3px] border-transparent'}
                  `}
                  onClick={() => { onToggle(doc.id); onMobileClose?.(); }}
                >
                  <svg className="shrink-0 text-brand-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-gray-700 truncate" title={doc.originalName}>
                    {doc.originalName}
                  </span>
                  {selectedDocIds.includes(doc.id) && (
                    <button
                      className="shrink-0 w-[22px] h-[22px] flex items-center justify-center rounded text-gray-400 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150 hover:text-red-500 hover:bg-red-50"
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
                  <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    Recent
                  </div>
                  {history.slice(0, 5).map((chat) => (
                    <div key={chat._id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-500">
                      <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      <span className="flex-1 min-w-0 text-[13px] truncate">{chat.question}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Hidden upload input */}
        <label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            hidden
          />
        </label>

        {/* User Profile Footer */}
        <div className="mt-auto border-t border-brand-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-700 to-accent flex items-center justify-center text-white text-sm font-bold shadow-md shadow-brand-700/30 ring-2 ring-white">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold text-gray-800 truncate">{userName}</span>
              <span className="block text-[11px] text-gray-400 truncate">{userEmail || 'user@example.com'}</span>
            </div>
            <button
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
              onClick={onLogout}
              title="Log out"
            >
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
