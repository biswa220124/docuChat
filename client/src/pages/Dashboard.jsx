import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentSidebar from '../components/DocumentSidebar';
import ChatWindow from '../components/ChatWindow';
import api from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const refreshDocsRef = useRef(null);

  let userEmail = '';
  let userName = '';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email || '';
      userName = payload.name || payload.username || userEmail.split('@')[0] || 'there';
    }
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleNewChat = () => {
    setSelectedDocIds([]);
    setSidebarOpen(false);
    if (fileRef.current) fileRef.current.click();
  };

  const registerRefreshDocs = useCallback((fn) => {
    refreshDocsRef.current = fn;
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.id) setSelectedDocIds([res.data.id]);
      if (refreshDocsRef.current) refreshDocsRef.current();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col w-screen h-dvh overflow-hidden font-sans bg-gradient-to-br from-brand-50 via-brand-100 to-purple-50">
      {/* Mobile header bar */}
      <div className="hidden max-md:flex items-center gap-3.5 px-4 py-3 bg-white/75 backdrop-blur-xl border-b border-brand-700/10 z-50">
        <button className="bg-transparent border-none cursor-pointer flex flex-col gap-[5px] p-1" onClick={() => setSidebarOpen(true)}>
          <span className="block w-[22px] h-0.5 bg-brand-700 rounded-full transition-transform" />
          <span className="block w-[22px] h-0.5 bg-brand-700 rounded-full transition-transform" />
          <span className="block w-[22px] h-0.5 bg-brand-700 rounded-full transition-transform" />
        </button>
        <span className="text-[17px] font-extrabold bg-gradient-to-br from-brand-700 to-accent bg-clip-text text-transparent">
          DocuChat
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <DocumentSidebar
          selectedDocIds={selectedDocIds}
          onToggle={toggleDoc}
          onLogout={handleLogout}
          userEmail={userEmail}
          onNewChat={handleNewChat}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          registerRefreshDocs={registerRefreshDocs}
        />
        <ChatWindow
          selectedDocumentIds={selectedDocIds}
          userName={userName}
          fileRef={fileRef}
          onUpload={handleUpload}
          uploading={uploading}
        />
      </div>
    </div>
  );
}
