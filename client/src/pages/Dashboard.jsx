import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentSidebar from '../components/DocumentSidebar';
import ChatWindow from '../components/ChatWindow';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [activeTab, setActiveTab] = useState('docs');

  // Try to read email from JWT payload
  let userEmail = '';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email || '';
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

  return (
    <div className="dash">
      {/* Top navbar */}
      <header className="dash-nav">
        <span className="dash-nav__logo">DocuChat</span>
        <span className="dash-nav__email">{userEmail}</span>
        <div className="dash-nav__right">
          <ThemeToggle />
          <button className="dash-nav__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="dash-body">
        <DocumentSidebar
          selectedDocIds={selectedDocIds}
          onToggle={toggleDoc}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ChatWindow selectedDocumentIds={selectedDocIds} />
      </div>
    </div>
  );
}
