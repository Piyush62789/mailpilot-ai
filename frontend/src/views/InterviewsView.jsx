import React from 'react';
import { Video, Calendar, Clock, ExternalLink, Sparkles, CheckSquare } from 'lucide-react';

export default function InterviewsView({ interviews, onSelectInterviewEmail }) {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="section-top-bar">
        <div className="section-heading-group">
          <h2>Upcoming Scheduled Interviews</h2>
          <span className="count-chip">{interviews.length} confirmed</span>
        </div>
      </div>

      {/* Grid of Interview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {interviews.map((item) => {
          const event = item.event;
          return (
            <div 
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-card)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.company}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                    {event?.title}
                  </span>
                </div>
                <span className="stage-badge interviewing">
                  {event?.platform || 'Video Call'}
                </span>
              </div>

              {/* Date & Time Highlight Box */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#38bdf8" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {event?.date}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {event?.time}
                  </span>
                </div>
              </div>

              {/* AI Preparation Checklist */}
              {item.action_items && item.action_items.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#c7d2fe' }}>
                    <Sparkles size={13} />
                    AI Interview Prep Focus:
                  </span>
                  <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {item.action_items.map((act, i) => (
                      <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
                {event?.link && (
                  <a 
                    href={event.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Video size={14} />
                    <span>Join {event.platform}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => onSelectInterviewEmail(item.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
