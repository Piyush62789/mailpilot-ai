# MailPilot AI ✈️

> **Autonomous AI Career & Intelligent Email Co-Pilot**
> Automatically triage job applications, interview requests, and deadlines with executive AI summaries and one-click smart replies.

---

## ✨ Features

- **🎯 Intelligent Email Triage**: Automatically categorizes incoming emails into **Jobs**, **Interviews**, **College / Announcements**, and **General**.
- **📅 Interview & Event Extraction**: Detects dates, times, Google Meet, Zoom, and Teams links to automatically populate an interactive schedule and calendar agenda.
- **⚡ One-Click Smart AI Replies**: Draft context-aware responses with tone toggles (**Confirm Availability**, **Reschedule Politely**, **Enthusiastic**, **Professional**).
- **📬 Real Mailbox Integration (IMAP & SMTP)**: Connect your actual email account (Gmail, Outlook, custom IMAP/SMTP) to fetch live messages and dispatch real replies.
- **🔐 User Authentication**: Modern dark-mode login & registration with 1-click Demo access and session management.
- **📊 Real-time Dashboard**: Live metric counters for **Total Emails**, **Job Communications**, and **Upcoming Interviews**.
- **🚀 Fullstack CI/CD Pipeline**: Automated GitHub Actions testing for Python backend (pytest), Node.js frontend (Vite build), and multi-stage container deployment to Docker Hub and GHCR.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS (Glassmorphism & Obsidian Dark Theme)
- **Backend**: FastAPI, Uvicorn, Pydantic, Python Standard Library (`imaplib`, `smtplib`, `email`)
- **AI & ML**: Google Gemini integration support
- **Testing**: Pytest, FastAPI TestClient, Vite Build verification
- **Containerization & CI/CD**: Docker (multi-stage build), GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.12+
- **Node.js**: 20+
- **npm**: 10+

---

### 1. Clone & Setup

```bash
git clone https://github.com/Piyush62789/mailpilot-ai.git
cd mailpilot-ai
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite
pytest backend/tests -v

# Start FastAPI backend server (port 8000)
uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```

Visit **http://127.0.0.1:5173** in your browser.

---

## 🔐 Demo Credentials

To quickly explore the dashboard without entering real mail credentials:
- **Email**: `alex@mailpilot.ai`
- **Password**: `demo123`
*(Or simply click **1-Click Demo Login** on the login page)*

---

## 📬 Connecting Real Email (Gmail / Outlook)

1. Navigate to **Settings** in the MailPilot AI sidebar.
2. Under **Real Mailbox Sync (IMAP & SMTP)**:
   - **IMAP Host**: `imap.gmail.com` | **Port**: `993`
   - **SMTP Host**: `smtp.gmail.com` | **Port**: `587`
   - **Email**: Your Gmail address
   - **Password**: Your 16-character [Google App Password](https://myaccount.google.com/apppasswords)
3. Click **Test Mailbox Connection** to verify both IMAP and SMTP connections.
4. Click **Fetch Real Emails Now** to pull and triage your live inbox messages!

---

## 🐳 Docker Deployment

Build and run the unified fullstack container:

```bash
# Build multi-stage image
docker build -t mailpilot-ai:latest .

# Run container on port 8000
docker run -p 8000:8000 --env-file .env mailpilot-ai:latest
```

The web application and API will be live at `http://localhost:8000`.

---

## 🔄 CI/CD Pipeline

The repository includes a production-grade GitHub Actions workflow (`.github/workflows/ci.yml`):
- **Backend Tests**: Matrix testing across Python `3.12` and `3.13` with pip caching.
- **Frontend Build**: Matrix compilation across Node `20.x` and `22.x` with npm caching.
- **Container Publishing**: Automatically builds and publishes multi-stage images to Docker Hub and GitHub Container Registry (GHCR) upon merges to `main`.

---

## 📄 License

MIT License. Designed and developed with ❤️ for modern software engineers.
