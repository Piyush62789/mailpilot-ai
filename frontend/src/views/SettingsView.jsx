import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  Check, 
  Server, 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  Key, 
  HelpCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView({ 
  settings, 
  onSaveSettings, 
  backendConnected, 
  onTestBackend,
  onShowToast 
}) {
  const [formData, setFormData] = useState(settings || {
    ai_model: 'gemini-2.5-flash',
    auto_categorize: true,
    auto_detect_interviews: true,
    sync_interval_mins: 5,
    email_notifications: true,
    theme: 'dark'
  });

  const [mailConfig, setMailConfig] = useState({
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    imap_user: '',
    imap_password: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
  });

  const [testingStatus, setTestingStatus] = useState(null);
  const [mailTestResult, setMailTestResult] = useState(null);
  const [isTestingMail, setIsTestingMail] = useState(false);
  const [isFetchingReal, setIsFetchingReal] = useState(false);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);

  useEffect(() => {
    // Load existing mail configuration
    api.getMailConfig()
      .then((cfg) => {
        if (cfg) {
          setMailConfig(prev => ({
            ...prev,
            imap_host: cfg.imap_host || prev.imap_host,
            imap_port: cfg.imap_port || prev.imap_port,
            imap_user: cfg.imap_user || '',
            smtp_host: cfg.smtp_host || prev.smtp_host,
            smtp_port: cfg.smtp_port || prev.smtp_port,
            smtp_user: cfg.smtp_user || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = (key) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestBackend = async () => {
    setTestingStatus('testing');
    const result = await onTestBackend();
    setTestingStatus(result.connected ? 'success' : 'failed');
    setTimeout(() => setTestingStatus(null), 3500);
  };

  const handleSaveMailConfig = async () => {
    try {
      await api.updateMailConfig(mailConfig);
      onShowToast('Real mail configuration saved! 📬');
    } catch (err) {
      onShowToast('Failed to save mail config');
    }
  };

  const handleTestMailConnection = async () => {
    setIsTestingMail(true);
    setMailTestResult(null);
    try {
      const res = await api.testMailConnection(mailConfig);
      setMailTestResult(res);
      if (res.success) {
        onShowToast('Real IMAP & SMTP connection verified! 🟢');
      }
    } catch (err) {
      setMailTestResult({
        success: false,
        imap_message: err.message,
        smtp_message: 'Could not connect'
      });
    } finally {
      setIsTestingMail(false);
    }
  };

  const handleFetchRealEmails = async () => {
    setIsFetchingReal(true);
    try {
      const res = await api.fetchRealEmails(10);
      if (res.status === 'success') {
        onShowToast(`Fetched ${res.fetched_count} real emails from your inbox! 🚀`);
      } else {
        onShowToast(res.message);
      }
    } catch (err) {
      onShowToast(err.message || 'Error fetching real emails');
    } finally {
      setIsFetchingReal(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '960px' }}>
      <div className="section-top-bar">
        <div className="section-heading-group">
          <h2>MailPilot AI Preferences & Integrations</h2>
        </div>
      </div>

      {/* Backend API Connection Status Box */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: backendConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={20} color={backendConnected ? '#10b981' : '#f43f5e'} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              FastAPI Backend Endpoint
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Host: <code style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>http://127.0.0.1:8000</code> • 
              Status: <strong style={{ color: backendConnected ? '#10b981' : '#f43f5e' }}>{backendConnected ? 'Online & Synced' : 'Offline'}</strong>
            </p>
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={handleTestBackend}
          disabled={testingStatus === 'testing'}
        >
          <RefreshCw size={14} className={testingStatus === 'testing' ? 'spin-animation' : ''} />
          <span>
            {testingStatus === 'testing' ? 'Pinging API...' : 
             testingStatus === 'success' ? 'Ping 200 OK!' : 
             testingStatus === 'failed' ? 'Ping Failed' : 'Test Connection'}
          </span>
        </button>
      </div>

      {/* REAL MAILBOX (IMAP & SMTP) CONFIGURATION PANEL */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="#f59e0b" />
            Real Mailbox Sync (IMAP & SMTP)
          </h3>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
          >
            <HelpCircle size={13} />
            <span>Gmail App Password Guide</span>
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Connect your actual email account (Gmail, Outlook, or custom IMAP/SMTP) to ingest real emails and dispatch smart AI replies directly.
        </p>

        {/* Gmail Setup Instructions Accordion */}
        {showAppPasswordGuide && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.82rem',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <strong style={{ color: '#c7d2fe' }}>How to connect Gmail safely in 3 steps:</strong>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Open your <strong>Google Account Settings</strong> &rarr; <strong>Security</strong>.</li>
              <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
              <li>Under 2-Step Verification, select <strong>App passwords</strong>, name it <code>MailPilot AI</code>, and copy the 16-character generated password.</li>
              <li>Paste it into the Password field below (IMAP Server: <code>imap.gmail.com</code>, SMTP: <code>smtp.gmail.com</code>).</li>
            </ol>
          </div>
        )}

        {/* IMAP & SMTP Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* IMAP Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
              Incoming Mail (IMAP)
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IMAP Host</label>
                <input
                  type="text"
                  value={mailConfig.imap_host}
                  onChange={(e) => setMailConfig({ ...mailConfig, imap_host: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Port</label>
                <input
                  type="number"
                  value={mailConfig.imap_port}
                  onChange={(e) => setMailConfig({ ...mailConfig, imap_port: parseInt(e.target.value) || 993 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email / Username</label>
              <input
                type="text"
                placeholder="your.email@gmail.com"
                value={mailConfig.imap_user}
                onChange={(e) => setMailConfig({ 
                  ...mailConfig, 
                  imap_user: e.target.value,
                  smtp_user: mailConfig.smtp_user ? mailConfig.smtp_user : e.target.value 
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Password / App Password</label>
              <input
                type="password"
                placeholder="16-character app password"
                value={mailConfig.imap_password}
                onChange={(e) => setMailConfig({ 
                  ...mailConfig, 
                  imap_password: e.target.value,
                  smtp_password: mailConfig.smtp_password ? mailConfig.smtp_password : e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* SMTP Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
              Outgoing Mail (SMTP)
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMTP Host</label>
                <input
                  type="text"
                  value={mailConfig.smtp_host}
                  onChange={(e) => setMailConfig({ ...mailConfig, smtp_host: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Port</label>
                <input
                  type="number"
                  value={mailConfig.smtp_port}
                  onChange={(e) => setMailConfig({ ...mailConfig, smtp_port: parseInt(e.target.value) || 587 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMTP User</label>
              <input
                type="text"
                placeholder="Leave blank to use IMAP email"
                value={mailConfig.smtp_user}
                onChange={(e) => setMailConfig({ ...mailConfig, smtp_user: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMTP Password</label>
              <input
                type="password"
                placeholder="Leave blank to use IMAP password"
                value={mailConfig.smtp_password}
                onChange={(e) => setMailConfig({ ...mailConfig, smtp_password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Mail Test Results Banner */}
        {mailTestResult && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: mailTestResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${mailTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: mailTestResult.success ? '#34d399' : '#fb7185' }}>
              {mailTestResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{mailTestResult.success ? 'Real Mailbox Verified & Operational!' : 'Connection Verification Result:'}</span>
            </div>
            {mailTestResult.imap_message && <div>• IMAP: {mailTestResult.imap_message}</div>}
            {mailTestResult.smtp_message && <div>• SMTP: {mailTestResult.smtp_message}</div>}
          </div>
        )}

        {/* Real Mail Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestMailConnection}
              disabled={isTestingMail}
            >
              <RefreshCw size={13} className={isTestingMail ? 'spin-animation' : ''} />
              <span>{isTestingMail ? 'Testing...' : 'Test Mailbox Connection'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleFetchRealEmails}
              disabled={isFetchingReal}
            >
              <Download size={13} className={isFetchingReal ? 'spin-animation' : ''} />
              <span>{isFetchingReal ? 'Fetching...' : 'Fetch Real Emails Now'}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveMailConfig}
          >
            <Check size={14} />
            <span>Save Mail Credentials</span>
          </button>
        </div>
      </div>

      {/* AI Model & Behavior */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#818cf8" />
          AI Model & Intelligence
        </h3>

        {/* Model Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Primary Processing LLM
          </label>
          <select 
            value={formData.ai_model} 
            onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="gemini-2.5-flash" style={{ background: '#131b2e' }}>Google Gemini 2.5 Flash (Recommended: Ultra fast & low latency)</option>
            <option value="gemini-1.5-pro" style={{ background: '#131b2e' }}>Google Gemini 1.5 Pro (Deep reasoning for complex schedules)</option>
          </select>
        </div>

        {/* Feature Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Auto-Categorize Job & Interview Emails
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Automatically tag emails with Jobs, Interviews, and College categories upon arrival
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.auto_categorize} 
              onChange={() => handleToggle('auto_categorize')}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Automatic Interview & Event Extraction
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Extract meeting links, interview dates, and times to populate calendar agenda
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={formData.auto_detect_interviews} 
              onChange={() => handleToggle('auto_detect_interviews')}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onSaveSettings(formData)}
          >
            <Check size={15} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
