import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentSidebar from '../components/DocumentSidebar';
import ChatWindow from '../components/ChatWindow';
import ThemeGuide from '../components/ThemeGuide';
import api from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [activeDocName, setActiveDocName]   = useState('');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [uploading, setUploading]           = useState(false);

  /* ─── Theme: default light, persisted in localStorage ─── */
  const [theme, setTheme] = useState(() => localStorage.getItem('dc_theme') || 'light');

  /* ─── First-time onboarding ─── */
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('dc_onboarded'));

  const handleSelectTheme = (chosen) => {
    setTheme(chosen);
    localStorage.setItem('dc_theme', chosen);
    localStorage.setItem('dc_onboarded', '1');
    setShowGuide(false);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('dc_theme', next);
  };

  const fileRef        = useRef();
  const refreshDocsRef = useRef(null);

  let userEmail = '';
  let userName  = '';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email || '';
      userName  = payload.name || payload.username || userEmail.split('@')[0] || 'there';
    }
  } catch {}

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const toggleDoc = (docId, docName) => {
    setSelectedDocIds(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
    if (docName) setActiveDocName(docName);
  };

  const handleNewChat = () => { setSelectedDocIds([]); setActiveDocName(''); };

  const registerRefreshDocs = useCallback(fn => { refreshDocsRef.current = fn; }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const docId   = res.data?.documentId || res.data?.id;
      const docName = res.data?.filename || file.name;
      if (docId) { setSelectedDocIds([docId]); setActiveDocName(docName); }
      if (refreshDocsRef.current) refreshDocsRef.current();
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div className="flex w-screen h-dvh overflow-hidden relative" style={{ background: theme === 'dark' ? '#0f0f0f' : '#ffffff' }}>

      {/* First-time theme onboarding */}
      {showGuide && <ThemeGuide onSelect={handleSelectTheme} />}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${sidebarOpen ? 'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40' : ''}`}>
        <DocumentSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          theme={theme}
          selectedDocIds={selectedDocIds}
          onSelectDoc={toggleDoc}
          onLogout={handleLogout}
          userEmail={userEmail}
          onNewChat={handleNewChat}
          registerRefreshDocs={registerRefreshDocs}
        />
      </div>

      <ChatWindow
        selectedDocumentIds={selectedDocIds}
        activeDocName={activeDocName}
        onRemoveDoc={() => { setSelectedDocIds([]); setActiveDocName(''); }}
        userName={userName}
        userEmail={userEmail}
        fileRef={fileRef}
        onUpload={handleUpload}
        uploading={uploading}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </div>
  );
}
