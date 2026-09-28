import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import InboxView from './views/InboxView';
import JobsView from './views/JobsView';
import InterviewsView from './views/InterviewsView';
import CalendarView from './views/CalendarView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import EmailDetailModal from './components/EmailDetailModal';
import Toast from './components/Toast';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mailpilot_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [emails, setEmails] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    try {
      const health = await api.checkBackendHealth();
      setBackendConnected(health.connected);

      const [dashRes, emailsRes, jobsRes, interviewsRes, calRes, setRes] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getEmails().catch(() => ({ emails: [] })),
        api.getJobs().catch(() => ({ jobs: [] })),
        api.getInterviews().catch(() => ({ interviews: [] })),
        api.getCalendarEvents().catch(() => ({ events: [] })),
        api.getSettings().catch(() => null),
      ]);

      if (dashRes) {
        setDashboardData(dashRes);
        setBackendConnected(true);
      }
      if (emailsRes?.emails) setEmails(emailsRes.emails);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (interviewsRes?.interviews) setInterviews(interviewsRes.interviews);
      if (calRes?.events) setCalendarEvents(calRes.events);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const health = await api.checkBackendHealth();
      setBackendConnected(health.connected);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncMailbox();
      await loadData();
      if (res.is_real_mail_synced) {
        showToast('Real IMAP mailbox synced with MailPilot AI Agent! ✨');
      } else {
        showToast('Mailbox synced with MailPilot AI Agent! ✨');
      }
    } catch (err) {
      showToast('Synced (cached state updated)');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleStar = async (emailId) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_starred: !e.is_starred } : e));
    setDashboardData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        recent_emails: prev.recent_emails.map(e => e.id === emailId ? { ...e, is_starred: !e.is_starred } : e)
      };
    });
    if (selectedEmail && selectedEmail.id === emailId) {
      setSelectedEmail(prev => ({ ...prev, is_starred: !prev.is_starred }));
    }

    try {
      await api.toggleStar(emailId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRead = async (emailId) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: !e.is_read } : e));
    setDashboardData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        recent_emails: prev.recent_emails.map(e => e.id === emailId ? { ...e, is_read: !e.is_read } : e)
      };
    });
    if (selectedEmail && selectedEmail.id === emailId) {
      setSelectedEmail(prev => ({ ...prev, is_read: !prev.is_read }));
    }

    try {
      await api.toggleRead(emailId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEmailById = (emailId) => {
    const found = emails.find(e => e.id === emailId) || dashboardData?.recent_emails?.find(e => e.id === emailId);
    if (found) {
      setSelectedEmail(found);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await api.updateSettings(newSettings);
      setSettings(res.settings);
      showToast('Settings saved successfully! ⚙️');
    } catch (err) {
      setSettings(newSettings);
      showToast('Settings saved locally.');
    }
  };

  const searchedEmails = emails.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.subject.toLowerCase().includes(q) ||
      e.sender.toLowerCase().includes(q) ||
      e.company.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q)
    );
  });

  // If not logged in, render the Login View!
  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} onShowToast={showToast} />
        <Toast message={toastMessage} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Background ambient lighting */}
      <div className="ambient-glow-top-left" />
      <div className="ambient-glow-bottom-right" />

      {/* Left Sidebar */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        stats={dashboardData?.stats} 
      />

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* Top Header */}
        <Header
          currentView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          backendConnected={backendConnected}
          onSync={handleSync}
          isSyncing={isSyncing}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Scrollable View Content */}
        <div className="view-content-scrollable">
          {activeView === 'dashboard' && (
            <DashboardView
              dashboardData={dashboardData}
              onSelectEmail={setSelectedEmail}
              onToggleStar={handleToggleStar}
              onToggleRead={handleToggleRead}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'inbox' && (
            <InboxView
              emails={searchedEmails}
              onSelectEmail={setSelectedEmail}
              onToggleStar={handleToggleStar}
              onToggleRead={handleToggleRead}
            />
          )}

          {activeView === 'jobs' && (
            <JobsView
              jobs={jobs}
              onSelectJobEmail={handleSelectEmailById}
            />
          )}

          {activeView === 'interviews' && (
            <InterviewsView
              interviews={interviews}
              onSelectInterviewEmail={handleSelectEmailById}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              onSelectEventEmail={handleSelectEmailById}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              backendConnected={backendConnected}
              onTestBackend={api.checkBackendHealth}
              onShowToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Email Detail Modal / AI Drawer */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onToggleStar={handleToggleStar}
          onToggleRead={handleToggleRead}
          onShowToast={showToast}
        />
      )}

      {/* Global Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
