import React from 'react';
import { Calendar, Clock, Video, MapPin, ExternalLink, Sparkles } from 'lucide-react';

export default function CalendarView({ events, onSelectEventEmail }) {
  return (
    <div className="dashboard-container">
      <div className="section-top-bar">
        <div className="section-heading-group">
          <h2>AI Extracted Calendar Events</h2>
          <span className="count-chip">{events.length} events scheduled</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {events.map((evt) => (
          <div 
            key={evt.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-card)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {/* Date Box */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={18} color="#818cf8" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c7d2fe', marginTop: '4px' }}>
                  {evt.date.split(',')[0]}
                </span>
              </div>

              {/* Event Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {evt.event_title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} />
                    {evt.time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} />
                    {evt.platform}
                  </span>
                  <span className={`category-tag ${evt.category}`}>
                    {evt.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {evt.link && (
                <a 
                  href={evt.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Meeting Link</span>
                  <ExternalLink size={13} />
                </a>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => onSelectEventEmail(evt.id)}
              >
                View Source Email
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
