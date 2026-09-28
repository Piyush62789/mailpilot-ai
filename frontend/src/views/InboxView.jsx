import React, { useState } from 'react';
import { 
  Inbox, 
  Star, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Mail, 
  ChevronRight 
} from 'lucide-react';

export default function InboxView({ 
  emails, 
  onSelectEmail, 
  onToggleStar, 
  onToggleRead 
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [filterUnread, setFilterUnread] = useState(false);

  const filteredEmails = emails.filter((email) => {
    if (filterUnread && email.is_read) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'starred') return email.is_starred;
    return email.category === activeTab;
  });

  return (
    <div className="dashboard-container">
      {/* Top Controls Bar */}
      <div className="section-top-bar" style={{ marginBottom: '8px' }}>
        <div className="section-heading-group">
          <h2>All Inbox Messages</h2>
          <span className="count-chip">{filteredEmails.length} emails</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Unread Filter Toggle */}
          <button 
            className={`btn ${filterUnread ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => setFilterUnread(!filterUnread)}
          >
            <Filter size={13} />
            <span>Unread Only</span>
          </button>

          {/* Folder Pills */}
          <div className="filter-tabs-pills">
            {['all', 'jobs', 'interviews', 'college', 'starred'].map((tab) => (
              <button
                key={tab}
                className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email Feed */}
      <div className="email-cards-list">
        {filteredEmails.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-card)'
          }}>
            <Inbox size={42} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No emails found matching your current filter.</p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isUnread = !email.is_read;
            const isStarred = email.is_starred;
            const takeaway = email.ai_analysis?.key_takeaway;

            return (
              <div 
                key={email.id} 
                className={`email-card-item ${isUnread ? 'unread' : ''}`}
                onClick={() => onSelectEmail(email)}
              >
                <div className="email-item-left">
                  <div 
                    className="company-logo-avatar"
                    style={{ backgroundColor: email.avatar_color || '#4f46e5' }}
                  >
                    {email.company ? email.company.slice(0, 2).toUpperCase() : 'EM'}
                  </div>

                  <div className="email-content-block">
                    <div className="email-row-header">
                      <span className="company-name-bold">{email.company}</span>
                      <span className="email-subject-line">{email.subject}</span>
                      <span className={`category-tag ${email.category}`}>
                        {email.category}
                      </span>
                      {email.urgency === 'High' && (
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 700, 
                          color: '#f43f5e', 
                          background: 'rgba(244, 63, 94, 0.14)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(244, 63, 94, 0.25)'
                        }}>
                          High Priority
                        </span>
                      )}
                    </div>

                    <p className="email-snippet-text">{email.snippet}</p>

                    {takeaway && (
                      <div className="ai-takeaway-inline">
                        <Sparkles size={11} />
                        <span>AI Summary: {takeaway}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="email-item-right">
                  <span className="email-date-string">{email.date}</span>

                  <div className="email-actions-hover" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-icon" 
                      onClick={() => onToggleStar(email.id)}
                      title={isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star 
                        size={15} 
                        fill={isStarred ? '#f59e0b' : 'none'} 
                        color={isStarred ? '#f59e0b' : 'var(--text-muted)'} 
                      />
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => onSelectEmail(email)}
                    >
                      <span>Open Thread</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
