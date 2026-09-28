import React, { useState } from 'react';
import { 
  Mail, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Star, 
  ChevronRight,
  Send,
  Zap
} from 'lucide-react';

export default function DashboardView({ 
  dashboardData, 
  onSelectEmail, 
  onToggleStar, 
  onToggleRead,
  setActiveView 
}) {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  const greeting = dashboardData?.greeting || 'Good afternoon 👋';
  const stats = dashboardData?.stats || {
    emails: 124,
    job_emails: 18,
    interviews: 4,
    unread: 12,
  };

  const rawEmails = dashboardData?.recent_emails || [];
  const filteredEmails = rawEmails.filter(email => {
    if (selectedCategoryTab === 'all') return true;
    return email.category === selectedCategoryTab;
  });

  return (
    <div className="dashboard-container">
      {/* Hero Greeting Section */}
      <div className="hero-greeting-card">
        <div className="hero-text-group">
          <h1>{greeting}</h1>
          <p>
            MailPilot AI triaged your inbox today. You have <strong style={{ color: '#ffffff' }}>4 interviews</strong> upcoming and <strong style={{ color: '#ffffff' }}>18 active job communications</strong>.
          </p>
        </div>
        <div className="hero-sync-info">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            AI Status: <strong style={{ color: '#10b981' }}>Active</strong>
          </span>
        </div>
      </div>

      {/* The 3 Core Stat Cards from ASCII Mockup:
          📧 124 Emails
          💼 18 Job Emails
          📅 4 Interviews
      */}
      <div className="stats-cards-grid">
        {/* Card 1: 📧 124 Emails */}
        <div 
          className="stat-card emails"
          onClick={() => setActiveView('inbox')}
          title="Click to view all emails in Inbox"
        >
          <div className="stat-card-header">
            <div className="stat-emoji-pill">📧</div>
            <span className="stat-trend-tag positive">+12 new</span>
          </div>
          <div className="stat-main-metric">
            <div className="stat-number-label">
              {stats.emails} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Emails</span>
            </div>
            <span className="stat-subtitle">All processed messages in inbox</span>
          </div>
          <div className="stat-footer-detail">
            <CheckCircle2 size={13} color="#10b981" />
            <span>98.6% auto-categorized by AI</span>
          </div>
        </div>

        {/* Card 2: 💼 18 Job Emails */}
        <div 
          className="stat-card jobs"
          onClick={() => setActiveView('jobs')}
          title="Click to view Job Applications Pipeline"
        >
          <div className="stat-card-header">
            <div className="stat-emoji-pill">💼</div>
            <span className="stat-trend-tag neutral">5 Active Companies</span>
          </div>
          <div className="stat-main-metric">
            <div className="stat-number-label">
              {stats.job_emails} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Job Emails</span>
            </div>
            <span className="stat-subtitle">Applications, OAs & status updates</span>
          </div>
          <div className="stat-footer-detail">
            <Clock size={13} color="#f59e0b" />
            <span>1 online assessment pending</span>
          </div>
        </div>

        {/* Card 3: 📅 4 Interviews */}
        <div 
          className="stat-card interviews"
          onClick={() => setActiveView('interviews')}
          title="Click to view Interview Timetable"
        >
          <div className="stat-card-header">
            <div className="stat-emoji-pill">📅</div>
            <span className="stat-trend-tag positive">Next in 3 days</span>
          </div>
          <div className="stat-main-metric">
            <div className="stat-number-label">
              {stats.interviews} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Interviews</span>
            </div>
            <span className="stat-subtitle">Technical rounds & recruiter calls</span>
          </div>
          <div className="stat-footer-detail">
            <Zap size={13} color="#38bdf8" />
            <span>Google Tech Round 2 confirmed</span>
          </div>
        </div>
      </div>

      {/* Recent Emails Section (Matching ASCII Box)
          ┌────────────────────────────┐
          │ Google — Interview Update │
          │ Amazon — Application      │
          │ College — Announcement    │
          └────────────────────────────┘
      */}
      <div className="recent-emails-section">
        <div className="section-top-bar">
          <div className="section-heading-group">
            <h2>Recent Emails</h2>
            <span className="count-chip">{filteredEmails.length} messages</span>
          </div>

          {/* Category Tabs */}
          <div className="filter-tabs-pills">
            <button 
              className={`filter-pill ${selectedCategoryTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab('all')}
            >
              All
            </button>
            <button 
              className={`filter-pill ${selectedCategoryTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab('interviews')}
            >
              Interviews
            </button>
            <button 
              className={`filter-pill ${selectedCategoryTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab('jobs')}
            >
              Jobs
            </button>
            <button 
              className={`filter-pill ${selectedCategoryTab === 'college' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab('college')}
            >
              College
            </button>
          </div>
        </div>

        {/* Email Cards List */}
        <div className="email-cards-list">
          {filteredEmails.map((email) => {
            const isUnread = !email.is_read;
            const isStarred = email.is_starred;
            const takeaway = email.ai_analysis?.key_takeaway;

            return (
              <div 
                key={email.id} 
                className={`email-card-item ${isUnread ? 'unread' : ''}`}
                onClick={() => onSelectEmail(email)}
              >
                {/* Left Side: Avatar, Company, Subject, Snippet */}
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
                          Action Req
                        </span>
                      )}
                    </div>

                    <p className="email-snippet-text">
                      {email.snippet}
                    </p>

                    {takeaway && (
                      <div className="ai-takeaway-inline">
                        <Sparkles size={11} />
                        <span>AI Takeaway: {takeaway}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Date & Quick Actions */}
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
                      <span>AI Reply</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
