import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentSidebar from '../components/DocumentSidebar';
import ChatWindow from '../components/ChatWindow';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // Decode token for user info
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
    // Trigger file input from sidebar
    if (fileRef.current) fileRef.current.click();
  };

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
      // Auto-select newly uploaded doc
      if (res.data?.id) {
        setSelectedDocIds([res.data.id]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="dc-app">
      {/* Mobile header bar */}
      <div className="dc-mobile-bar">
        <button className="dc-hamburger" onClick={() => setSidebarOpen(true)}>
          <span /><span /><span />
        </button>
        <span className="dc-mobile-logo">DocuChat</span>
      </div>

      <div className="dc-layout">
        <DocumentSidebar
          selectedDocIds={selectedDocIds}
          onToggle={toggleDoc}
          onLogout={handleLogout}
          userEmail={userEmail}
          onNewChat={handleNewChat}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
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
