import React from 'react';
import { Search, RefreshCw, CheckCircle2, AlertCircle, Bell, LogOut } from 'lucide-react';

export default function Header({ 
  currentView, 
  searchQuery, 
  setSearchQuery, 
  backendConnected, 
  onSync, 
  isSyncing,
  user,
  onLogout
}) {
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'inbox': return 'Inbox';
      case 'jobs': return 'Job Pipeline';
      case 'interviews': return 'Interviews Schedule';
      case 'calendar': return 'Calendar Events';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  const displayName = user?.name || 'Alex Rivera';
  const displayAvatar = user?.avatar || 'AR';

  return (
    <header className="top-header">
      {/* Left: View title & Breadcrumb */}
      <div className="header-left">
        <div className="page-title-group">
          <span className="page-breadcrumbs">MailPilot AI / {getTitle()}</span>
          <h1 className="current-view-title">{getTitle()}</h1>
        </div>

        {/* Global Search Input */}
        <div className="header-search-container">
          <Search className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search emails, companies, roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Backend Connection Badge, Sync Button, Profile, Logout */}
      <div className="header-right">
        {/* Live Backend Connection Indicator */}
        <div 
          className={`backend-badge ${backendConnected ? 'connected' : 'disconnected'}`}
          title={backendConnected ? 'FastAPI Backend is online at http://localhost:8000' : 'Cannot reach backend at http://localhost:8000'}
        >
          <div className="status-dot" />
          <span>{backendConnected ? 'Backend Connected' : 'Offline Mode'}</span>
        </div>

        {/* Quick Sync Button */}
        <button 
          className="btn btn-secondary" 
          onClick={onSync}
          disabled={isSyncing}
          title="Sync inbox & run AI categorization"
        >
          <RefreshCw size={14} className={isSyncing ? 'spin-animation' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Notification Bell */}
        <button className="btn btn-icon" title="Notifications">
          <Bell size={16} />
        </button>

        {/* User Profile Badge */}
        <div className="user-profile-badge" title={`Signed in as ${user?.email || 'alex@mailpilot.ai'}`}>
          <div className="user-avatar">{displayAvatar}</div>
          <span className="user-name">{displayName}</span>
        </div>

        {/* Sign Out Button */}
        <button 
          className="btn-icon" 
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={15} color="#fb7185" />
        </button>
      </div>
    </header>
  );
}
