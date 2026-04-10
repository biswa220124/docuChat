import { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, RefreshCw, Settings, HelpCircle, LogOut,
         Search, FileText, MessageSquare, Trash2, ChevronRight,
         Mail, Edit3, Check, X, UserMinus, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const SG = { fontFamily: "'Space Grotesk', sans-serif" };

/* ─── Sidebar theme tokens ─── */
const DS = {
  dark: {
    bg:          'bg-[#111113]',
    border:      'border-white/[0.07]',
    title:       'text-white',
    iconBtn:     'text-white/50 hover:text-white hover:bg-white/8',
    navBtn:      'text-white/70 hover:text-white hover:bg-white/8',
    divider:     'bg-white/[0.08]',
    searchBg:    'bg-white/[0.06] border-white/[0.08]',
    searchText:  'text-white placeholder-white/30',
    searchFocus: 'focus:border-white/20',
    secLabel:    'text-white/30',
    docActive:   'bg-white/12 text-white',
    docIdle:     'text-white/60 hover:bg-white/[0.06] hover:text-white/90',
    histItem:    'text-white/50 hover:text-white/80 hover:bg-white/[0.04]',
    footerBorder:'border-white/[0.08]',
    userName:    'text-white',
    userEmail:   'text-white/40',
    logoutBtn:   'text-white/40 hover:text-red-400 hover:bg-red-400/10',
    deleteBtn:   'text-white/30 hover:text-red-400 hover:bg-red-400/8',
    modalBg:     'bg-[#18181b] border-white/[0.1]',
    modalTitle:  'text-white',
    inputBg:     'bg-white/[0.06] border-white/[0.1] text-white placeholder-white/30',
    inputFocus:  'focus:border-[#3d9e7a]/60',
    labelText:   'text-white/50',
    dimText:     'text-white/40',
    hintText:    'text-white/25',
    errorBg:     'bg-red-500/10 border-red-500/20 text-red-400',
    ctxMenu:     'bg-[#1e1e22] border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
    ctxItem:     'text-white/80 hover:text-white hover:bg-white/[0.06]',
    ctxDanger:   'text-red-400/90 hover:text-red-400 hover:bg-red-400/8',
    ctxDivider:  'bg-white/[0.08]',
  },
  light: {
    bg:          'bg-[#f5f5f5]',
    border:      'border-black/[0.07]',
    title:       'text-[#111]',
    iconBtn:     'text-[#aaa] hover:text-[#111] hover:bg-black/[0.05]',
    navBtn:      'text-[#555] hover:text-[#111] hover:bg-black/[0.05]',
    divider:     'bg-black/[0.07]',
    searchBg:    'bg-white border-black/[0.1]',
    searchText:  'text-[#111] placeholder-[#bbb]',
    searchFocus: 'focus:border-black/25',
    secLabel:    'text-[#bbb]',
    docActive:   'bg-black/[0.08] text-[#111]',
    docIdle:     'text-[#666] hover:bg-black/[0.04] hover:text-[#111]',
    histItem:    'text-[#aaa] hover:text-[#555] hover:bg-black/[0.03]',
    footerBorder:'border-black/[0.07]',
    userName:    'text-[#111]',
    userEmail:   'text-[#999]',
    logoutBtn:   'text-[#bbb] hover:text-red-500 hover:bg-red-500/10',
    deleteBtn:   'text-[#ccc] hover:text-red-500 hover:bg-red-500/8',
    modalBg:     'bg-white border-black/[0.1]',
    modalTitle:  'text-[#111]',
    inputBg:     'bg-[#f4f4f4] border-black/[0.1] text-[#111] placeholder-[#bbb]',
    inputFocus:  'focus:border-[#3d9e7a]/50',
    labelText:   'text-[#888]',
    dimText:     'text-[#aaa]',
    hintText:    'text-[#ccc]',
    errorBg:     'bg-red-50 border-red-200 text-red-500',
    ctxMenu:     'bg-white border-black/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
    ctxItem:     'text-[#444] hover:text-[#111] hover:bg-black/[0.04]',
    ctxDanger:   'text-red-500/90 hover:text-red-600 hover:bg-red-50',
    ctxDivider:  'bg-black/[0.07]',
  },
};

export default function DocumentSidebar({
  isOpen, onToggle, theme,
  selectedDocIds, onSelectDoc,
  onLogout, userEmail, onNewChat, registerRefreshDocs,
}) {
  const [docs, setDocs]       = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const [showSettings, setShowSettings]         = useState(false);
  const [showHelp, setShowHelp]                 = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount]   = useState(false);

  const [nickname, setNickname] = useState(() => localStorage.getItem('dc_nickname') || '');
  const [nickEdit, setNickEdit] = useState('');
  const [nickSaved, setNickSaved] = useState(false);

  /* Context menu */
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, doc }
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);

  const S      = DS[theme] || DS.dark;
  const isDark = theme === 'dark';

  const fetchDocs = async () => {
    setLoading(true);
    try { const r = await api.get('/documents'); setDocs(r.data); } catch { /* silent */ }
    finally { setLoading(false); }
  };
  const fetchHistory = async () => {
    try { const r = await api.get('/chat/history'); setHistory(r.data); } catch { /* silent */ }
  };

  useEffect(() => { fetchDocs(); fetchHistory(); }, []);
  useEffect(() => { if (registerRefreshDocs) registerRefreshDocs(fetchDocs); }, [registerRefreshDocs]);

  /* Close context menu on any click */
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-ctx-menu]')) setCtxMenu(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  /* Focus rename input when it appears */
  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  /* ── Context menu actions ── */
  const openCtxMenu = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, doc });
  };

  const startRename = (doc) => {
    setCtxMenu(null);
    setRenamingId(doc.id);
    setRenameValue(doc.originalName?.replace(/\.pdf$/i, '') || '');
  };

  const commitRename = async (docId) => {
    const newName = renameValue.trim();
    if (!newName) { setRenamingId(null); return; }
    const fullName = newName.endsWith('.pdf') ? newName : newName + '.pdf';
    try {
      await api.patch(`/documents/${docId}`, { name: fullName });
      setDocs(p => p.map(d => d.id === docId ? { ...d, originalName: fullName } : d));
    } catch { /* show err if needed */ }
    setRenamingId(null);
  };

  const handleDelete = async (id) => {
    setCtxMenu(null);
    try { await api.delete(`/documents/${id}`); setDocs(p => p.filter(d => d.id !== id)); } catch { /* silent */ }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await api.delete('/auth/account');
      localStorage.clear();
      window.location.href = '/login';
    } catch {
      alert('Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  const saveNickname = () => {
    const val = nickEdit.trim();
    localStorage.setItem('dc_nickname', val);
    setNickname(val);
    setNickSaved(true);
    setTimeout(() => setNickSaved(false), 2000);
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'User';
  const userInitial = (nickname || displayName)[0]?.toUpperCase() || 'U';
  const filtered    = docs.filter(d => d.originalName?.toLowerCase().includes(search.toLowerCase()));

  const now = Date.now();
  const grouped = history.reduce((acc, chat) => {
    const age = now - new Date(chat.createdAt || now).getTime();
    const k = age < 86400000 ? 'Today' : age < 172800000 ? 'Yesterday' : age < 604800000 ? 'This Week' : 'Older';
    (acc[k] = acc[k] || []).push(chat);
    return acc;
  }, {});

  /* ─── Modal ─── */
  const Modal = ({ title, onClose, children }) => (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[340px] border rounded-2xl shadow-2xl p-6 ${S.modalBg}`} style={SG}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={`font-semibold text-base ${S.modalTitle}`}>{title}</h2>
          <button onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer transition-all ${S.iconBtn}`}>
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </>
  );

  return (
    <>
      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div data-ctx-menu
          className={`fixed z-[100] w-48 rounded-xl border py-1.5 overflow-hidden ${S.ctxMenu}`}
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 200), top: Math.min(ctxMenu.y, window.innerHeight - 120) }}
        >
          <button
            onClick={() => startRename(ctxMenu.doc)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium bg-transparent border-none cursor-pointer text-left transition-all ${S.ctxItem}`}
          >
            <Edit3 size={13} />
            Rename
          </button>
          <div className={`my-1 mx-2 h-px ${S.ctxDivider}`} />
          <button
            onClick={() => handleDelete(ctxMenu.doc.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium bg-transparent border-none cursor-pointer text-left transition-all ${S.ctxDanger}`}
          >
            <Trash2 size={13} />
            Delete file
          </button>
        </div>
      )}

      {/* ── Push sidebar ── */}
      <aside
        className={`relative flex-shrink-0 h-full flex flex-col border-r overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${S.bg} ${S.border}`}
        style={{ width: isOpen ? '260px' : '0px', minWidth: isOpen ? '260px' : '0px' }}
      >
        <div className="w-[260px] h-full flex flex-col" style={SG}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
            <span className={`text-[17px] font-bold tracking-tight ${S.title}`}>DocuChat</span>
            <button onClick={onToggle}
              className={`w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer transition-all ${S.iconBtn}`}>
              <PanelLeftClose size={15} />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 mb-1 shrink-0">
            <button onClick={onNewChat}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-none bg-transparent cursor-pointer text-left ${S.navBtn}`}>
              <RefreshCw size={14} />
              New Chat
            </button>
          </div>

          {/* Nav */}
          <div className="px-3 mb-2 flex flex-col gap-0.5 shrink-0">
            {[
              { icon: <Settings size={14} />,   label: 'Settings',       action: () => { setNickEdit(nickname); setShowSettings(true); } },
              { icon: <HelpCircle size={14} />, label: 'Help & Support',  action: () => setShowHelp(true) },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all border-none bg-transparent cursor-pointer text-left group ${S.navBtn}`}>
                <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            ))}
          </div>

          <div className={`mx-3 mb-2 h-px shrink-0 ${S.divider}`} />

          {/* Search */}
          <div className="px-3 mb-2 shrink-0">
            <div className="relative">
              <Search size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50`} />
              <input
                className={`w-full pl-8 pr-3 py-2 rounded-lg border text-[12px] outline-none transition-colors bg-transparent ${S.searchBg} ${S.searchText} ${S.searchFocus}`}
                style={SG}
                placeholder="Search documents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
            {loading ? (
              <p className={`py-8 text-center text-xs ${S.dimText}`}>Loading…</p>
            ) : filtered.length === 0 && history.length === 0 ? (
              <p className={`py-8 text-center text-xs ${S.dimText}`}>No documents yet.</p>
            ) : (
              <>
                {filtered.length > 0 && (
                  <>
                    <p className={`px-2 pt-2 pb-1 text-[9px] font-bold tracking-widest uppercase ${S.secLabel}`}>Documents</p>
                    {filtered.map(doc => (
                      <div key={doc.id}
                        onClick={() => { if (renamingId !== doc.id) onSelectDoc(doc.id, doc.originalName); }}
                        onContextMenu={e => openCtxMenu(e, doc)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 text-[12px] select-none ${
                          selectedDocIds.includes(doc.id) ? S.docActive : S.docIdle
                        }`}
                      >
                        <FileText size={12} className="shrink-0 opacity-70" />

                        {/* Rename inline input */}
                        {renamingId === doc.id ? (
                          <input
                            ref={renameRef}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitRename(doc.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={() => commitRename(doc.id)}
                            onClick={e => e.stopPropagation()}
                            className={`flex-1 min-w-0 bg-transparent outline-none border-b text-[12px] font-medium ${isDark ? 'border-white/30 text-white' : 'border-black/30 text-[#111]'}`}
                            style={SG}
                          />
                        ) : (
                          <span className="flex-1 min-w-0 truncate font-medium" title={doc.originalName}>
                            {doc.originalName}
                          </span>
                        )}

                        {/* Right-click hint dot */}
                        <span className="opacity-0 group-hover:opacity-30 transition-opacity text-[10px]">⋮</span>
                      </div>
                    ))}
                  </>
                )}

                {Object.entries(grouped).map(([grp, chats]) => (
                  <div key={grp}>
                    <p className={`px-2 pt-3 pb-1 text-[9px] font-bold tracking-widest uppercase ${S.secLabel}`}>{grp}</p>
                    {chats.slice(0, 8).map(chat => (
                      <div key={chat._id}
                        className={`flex items-start gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${S.histItem}`}>
                        <MessageSquare size={11} className="shrink-0 mt-0.5 opacity-70" />
                        <span className="flex-1 min-w-0 text-[12px] truncate">{chat.question}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t px-3 py-3 shrink-0 ${S.footerBorder}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#3d9e7a]/20 border border-[#3d9e7a]/30 flex items-center justify-center text-[#3d9e7a] text-sm font-bold shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`block text-[12px] font-semibold truncate ${S.userName}`}>{nickname || displayName}</span>
                <span className={`block text-[10px] truncate ${S.userEmail}`}>{userEmail}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {/* Delete Account */}
                <button onClick={() => { setDeleteConfirmText(''); setShowDeleteAccount(true); }} title="Delete account"
                  className={`w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer transition-all ${S.deleteBtn}`}>
                  <UserMinus size={13} />
                </button>
                {/* Logout */}
                <button onClick={onLogout} title="Log out"
                  className={`w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer transition-all ${S.logoutBtn}`}>
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-5">
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-widest mb-2 ${S.labelText}`}>Display Name / Nickname</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Edit3 size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 ${S.dimText.split(' ')[0]}`} />
                  <input
                    className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-[14px] outline-none transition-colors ${S.inputBg} ${S.inputFocus}`}
                    style={SG}
                    value={nickEdit}
                    onChange={e => setNickEdit(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveNickname()}
                    placeholder={displayName}
                  />
                </div>
                <button onClick={saveNickname}
                  className="px-4 py-2.5 rounded-xl bg-[#3d9e7a] hover:bg-[#4aab8c] text-white text-sm font-semibold transition-all border-none cursor-pointer flex items-center gap-1.5">
                  {nickSaved ? <Check size={14} /> : 'Save'}
                </button>
              </div>
              <p className={`text-[11px] mt-2 ${S.hintText}`}>This name appears in the greeting and chat UI.</p>
            </div>
            <div className={`h-px ${S.divider}`} />
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1.5 ${S.labelText}`}>Account</p>
              <p className={`text-[13px] ${S.dimText}`}>{userEmail || '—'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Help Modal ── */}
      {showHelp && (
        <Modal title="Help & Support" onClose={() => setShowHelp(false)}>
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#3d9e7a]/8 border border-[#3d9e7a]/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3d9e7a]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={14} className="text-[#3d9e7a]" />
                </div>
                <div>
                  <p className={`text-[13px] font-semibold mb-1 ${S.modalTitle}`}>Email Us</p>
                  <p className={`text-[12px] mb-2 ${S.dimText}`}>For queries, feedback or issues:</p>
                  <a href="mailto:biswabhusan2828@gmail.com" className="text-[13px] text-[#3d9e7a] hover:text-[#4aab8c] font-semibold transition-colors">
                    biswabhusan2828@gmail.com
                  </a>
                </div>
              </div>
            </div>
            <div className={`h-px ${S.divider}`} />
            <div className="space-y-2">
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${S.labelText}`}>Quick Tips</p>
              {['Upload a PDF using the Attach button.', 'Right-click a document to rename or delete it.', 'Toggle light/dark mode with the ☀ button.', 'Set a nickname in Settings for a personalised greeting.']
                .map((tip, i) => (
                  <div key={i} className={`flex items-start gap-2.5 text-[12px] ${S.dimText}`}>
                    <span className="text-[#3d9e7a] font-bold shrink-0 mt-0.5">{i + 1}.</span>
                    {tip}
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteAccount && (
        <Modal title="Delete Account" onClose={() => setShowDeleteAccount(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-red-400 mb-1">This action is irreversible</p>
                <p className={`text-[12px] ${S.dimText}`}>All your documents, chat history, and account data will be permanently deleted.</p>
              </div>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-widest mb-2 ${S.labelText}`}>
                Type <span className="text-red-400 font-bold">DELETE</span> to confirm
              </label>
              <input
                className={`w-full px-3 py-2.5 rounded-xl border text-[14px] outline-none transition-colors ${S.inputBg} focus:border-red-500/50`}
                style={SG}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setShowDeleteAccount(false)}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all ${isDark ? 'bg-white/8 text-white/70 hover:bg-white/12' : 'bg-black/6 text-[#555] hover:bg-black/10'}`}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                {deletingAccount ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
