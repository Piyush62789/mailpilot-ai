import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Check, 
  Copy, 
  Calendar, 
  Clock, 
  Video, 
  Star, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  MailCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function EmailDetailModal({ 
  email, 
  onClose, 
  onToggleStar, 
  onToggleRead,
  onShowToast 
}) {
  const [selectedTone, setSelectedTone] = useState('confirm');
  const [replyBody, setReplyBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [checkedActions, setCheckedActions] = useState({});

  useEffect(() => {
    if (email) {
      handleGenerateReply('confirm');
    }
  }, [email?.id]);

  if (!email) return null;

  const handleGenerateReply = async (tone) => {
    setSelectedTone(tone);
    setIsGenerating(true);
    try {
      const res = await api.generateAIReply(email.id, tone);
      setReplyBody(res.reply_body);
    } catch (err) {
      console.error('Failed to generate AI reply:', err);
      setReplyBody(
        `Hi ${email.sender.split(' ')[0]},\n\nThank you for reaching out regarding ${email.subject}. I have received the information and look forward to the next steps.\n\nBest regards,\nAlex`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(replyBody);
    setIsCopied(true);
    onShowToast('Draft reply copied to clipboard! 📋');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await api.sendRealEmail({
        to_email: email.sender_email || 'recipient@example.com',
        subject: `Re: ${email.subject}`,
        body: replyBody,
        in_reply_to: email.id
      });
      if (res.status === 'simulated') {
        onShowToast(`Reply queued for ${email.sender_email}! 🚀`);
      } else {
        onShowToast(`Real email delivered to ${email.sender_email} via SMTP! ✉️`);
      }
      onClose();
    } catch (err) {
      onShowToast(`Delivery error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const toggleActionItem = (index) => {
    setCheckedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const aiAnalysis = email.ai_analysis;
  const event = aiAnalysis?.detected_event;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="email-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div 
              className="company-logo-avatar"
              style={{ backgroundColor: email.avatar_color || '#4f46e5', width: '38px', height: '38px' }}
            >
              {email.company ? email.company.slice(0, 2).toUpperCase() : 'EM'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                  {email.company}
                </span>
                <span className={`category-tag ${email.category}`}>
                  {email.category}
                </span>
                {email.is_real && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Live IMAP Mail
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                From: <strong>{email.sender}</strong> ({email.sender_email})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn-icon" 
              onClick={() => onToggleStar(email.id)}
              title={email.is_starred ? 'Unstar' : 'Star'}
            >
              <Star 
                size={16} 
                fill={email.is_starred ? '#f59e0b' : 'none'} 
                color={email.is_starred ? '#f59e0b' : 'var(--text-muted)'} 
              />
            </button>
            <button 
              className="btn-icon" 
              onClick={() => onToggleRead(email.id)}
              title={email.is_read ? 'Mark as Unread' : 'Mark as Read'}
            >
              <CheckCircle2 size={16} color={email.is_read ? '#10b981' : 'var(--text-muted)'} />
            </button>
            <button className="btn-icon" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll">
          {/* Subject Line & Timestamp */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {email.subject}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {email.date}
            </span>
          </div>

          {/* AI Intelligence Card */}
          {aiAnalysis && (
            <div className="ai-intel-box">
              <div className="ai-intel-header">
                <div className="ai-pill-title">
                  <Sparkles size={16} color="#818cf8" />
                  MailPilot AI Executive Summary
                </div>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  color: aiAnalysis.sentiment === 'Action Required' ? '#f43f5e' : '#34d399',
                  background: aiAnalysis.sentiment === 'Action Required' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {aiAnalysis.sentiment}
                </span>
              </div>

              <div className="ai-summary-text">
                {aiAnalysis.summary}
              </div>

              {/* Detected Calendar Event Banner */}
              {event && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={18} color="#38bdf8" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {event.date} at {event.time} • {event.platform}
                      </div>
                    </div>
                  </div>
                  {event.link && (
                    <a 
                      href={event.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', textDecoration: 'none' }}
                    >
                      <Video size={13} />
                      <span>Join Call</span>
                    </a>
                  )}
                </div>
              )}

              {/* Action Items Checklist */}
              {aiAnalysis.action_items && aiAnalysis.action_items.length > 0 && (
                <div className="action-items-list">
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Action Items Detected:
                  </span>
                  {aiAnalysis.action_items.map((action, idx) => (
                    <label 
                      key={idx} 
                      className="action-item-check"
                      style={{ 
                        textDecoration: checkedActions[idx] ? 'line-through' : 'none',
                        opacity: checkedActions[idx] ? 0.6 : 1,
                        cursor: 'pointer'
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={!!checkedActions[idx]}
                        onChange={() => toggleActionItem(idx)}
                        style={{ marginTop: '3px', accentColor: '#6366f1' }}
                      />
                      <span>{action}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Body Content */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '20px', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            color: 'var(--text-main)',
            whiteSpace: 'pre-line'
          }}>
            {email.body}
          </div>

          {/* AI One-Click Smart Reply Generator */}
          <div className="ai-reply-composer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#818cf8" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  MailPilot AI Smart Reply Draft
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Direct SMTP Dispatch Supported
              </span>
            </div>

            {/* Tone Selector Pills */}
            <div className="reply-tones-bar">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>
                Tone:
              </span>
              {[
                { id: 'confirm', label: '✅ Confirm Availability' },
                { id: 'reschedule', label: '🔄 Reschedule Politely' },
                { id: 'enthusiastic', label: '🔥 Enthusiastic' },
                { id: 'professional', label: '💼 Professional' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  className={`tone-button ${selectedTone === tone.id ? 'active' : ''}`}
                  onClick={() => handleGenerateReply(tone.id)}
                  disabled={isGenerating || isSending}
                >
                  {tone.label}
                </button>
              ))}
            </div>

            {/* Editable Draft Text Area */}
            <textarea
              className="reply-textarea"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Generating AI reply..."
              disabled={isGenerating || isSending}
            />

            {/* Reply Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCopy}
                  disabled={isGenerating || isSending || !replyBody}
                >
                  {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Draft'}</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleGenerateReply(selectedTone)}
                  disabled={isGenerating || isSending}
                  title="Regenerate draft"
                >
                  <RefreshCw size={13} className={isGenerating ? 'spin-animation' : ''} />
                  <span>Regenerate</span>
                </button>
              </div>

              <button 
                className="btn btn-primary"
                onClick={handleSend}
                disabled={isGenerating || isSending || !replyBody}
              >
                {isSending ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="spin-animation" style={{ width: '13px', height: '13px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Sending via SMTP...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={14} />
                    <span>Send Real Reply</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
