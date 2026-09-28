import React from 'react';
import { 
  Inbox, 
  Briefcase, 
  Calendar, 
  Video, 
  Settings, 
  Sparkles, 
  Send, 
  Layers
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, stats }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layers,
      badge: null,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      badge: stats?.emails || 124,
      badgeType: 'highlight',
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      badge: stats?.job_emails || 18,
      badgeType: 'warning',
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: Video,
      badge: stats?.interviews || 4,
      badgeType: 'highlight',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      badge: 3,
      badgeType: 'neutral',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand & Logo */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Send size={18} strokeWidth={2.5} />
        </div>
        <div className="brand-title">
          MailPilot <span className="brand-ai-badge">AI</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <div className="nav-item-left">
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className={`nav-badge ${item.badgeType || ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Engine Status Footer */}
      <div className="sidebar-footer">
        <div className="ai-status-card">
          <div className="ai-status-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#818cf8" />
              MailPilot Engine
            </span>
            <div className="ai-pulse-dot" title="AI active and monitoring" />
          </div>
          <div className="ai-status-desc">
            Gemini 2.5 Flash • Smart Triage Active
          </div>
        </div>
      </div>
    </aside>
  );
}
