/**
 * MailPilot AI - API Client Service
 * Connects Frontend seamlessly with the FastAPI backend (Auth, Real Mail, Dashboard, AI)
 */

const API_BASE = '/api';
const DIRECT_BACKEND = 'http://127.0.0.1:8000/api';

function getAuthHeader() {
  const token = localStorage.getItem('mailpilot_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  // First try the configured proxy (/api)
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // Fallback directly to localhost:8000
    try {
      const fallbackRes = await fetch(`${DIRECT_BACKEND}${endpoint}`, {
        ...options,
        headers,
      });
      if (!fallbackRes.ok) {
        const errData = await fallbackRes.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP error! status: ${fallbackRes.status}`);
      }
      return await fallbackRes.json();
    } catch (fallbackErr) {
      console.warn(`API request to ${endpoint} failed:`, fallbackErr);
      throw fallbackErr;
    }
  }
}

export const api = {
  // Health & Connection
  async checkBackendHealth() {
    try {
      const res = await fetch('/health');
      if (res.ok) return { connected: true, direct: false };
    } catch (_) {}

    try {
      const direct = await fetch('http://127.0.0.1:8000/health');
      if (direct.ok) return { connected: true, direct: true };
    } catch (_) {}

    return { connected: false };
  },

  // Authentication
  async login(credentials) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      localStorage.setItem('mailpilot_token', data.token);
      localStorage.setItem('mailpilot_user', JSON.stringify(data));
    }
    return data;
  },

  async register(details) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    });
    if (data.token) {
      localStorage.setItem('mailpilot_token', data.token);
      localStorage.setItem('mailpilot_user', JSON.stringify(data));
    }
    return data;
  },

  getMe() {
    return request('/auth/me');
  },

  logout() {
    localStorage.removeItem('mailpilot_token');
    localStorage.removeItem('mailpilot_user');
    return request('/auth/logout', { method: 'POST' }).catch(() => ({}));
  },

  // Real Mail Integration (IMAP & SMTP)
  getMailConfig() {
    return request('/mail/config');
  },

  updateMailConfig(creds) {
    return request('/mail/config', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
  },

  testMailConnection(creds) {
    return request('/mail/test-connection', {
      method: 'POST',
      body: JSON.stringify(creds || {}),
    });
  },

  fetchRealEmails(limit = 10) {
    return request(`/mail/fetch-real?limit=${limit}`, { method: 'POST' });
  },

  sendRealEmail(emailData) {
    return request('/mail/send-real', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  },

  // Dashboard stats & recent emails
  getDashboard() {
    return request('/dashboard');
  },

  // Emails
  getEmails(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.unread_only) query.append('unread_only', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/emails${queryString}`);
  },

  getEmailDetail(id) {
    return request(`/emails/${id}`);
  },

  toggleRead(id) {
    return request(`/emails/${id}/toggle-read`, { method: 'POST' });
  },

  toggleStar(id) {
    return request(`/emails/${id}/toggle-star`, { method: 'POST' });
  },

  generateAIReply(id, tone = 'professional', customInstructions = '') {
    return request(`/emails/${id}/ai-reply`, {
      method: 'POST',
      body: JSON.stringify({ tone, custom_instructions: customInstructions }),
    });
  },

  syncMailbox() {
    return request('/emails/sync', { method: 'POST' });
  },

  // Jobs, Interviews, Calendar
  getJobs() {
    return request('/jobs');
  },

  getInterviews() {
    return request('/interviews');
  },

  getCalendarEvents() {
    return request('/calendar');
  },

  // Settings
  getSettings() {
    return request('/settings');
  },

  updateSettings(settings) {
    return request('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },
};
