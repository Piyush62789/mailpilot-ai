from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from mail_service import mail_service, MailCredentials

app = FastAPI(title="MailPilot AI", description="Intelligent Email Automation & Dashboard API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================================
# Pydantic Request / Response Models
# ==========================================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    role: str
    token: str


class AIReplyRequest(BaseModel):
    tone: str = Field(default="professional", description="Tone: professional, confirm, reschedule, enthusiastic")
    custom_instructions: Optional[str] = None


class AIReplyResponse(BaseModel):
    subject: str
    reply_body: str
    suggested_tones: List[str]
    confidence_score: float


class SendRealEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    in_reply_to: Optional[str] = None


class SettingsUpdate(BaseModel):
    ai_model: Optional[str] = "gemini-2.5-flash"
    auto_categorize: Optional[bool] = True
    auto_detect_interviews: Optional[bool] = True
    sync_interval_mins: Optional[int] = 5
    email_notifications: Optional[bool] = True
    theme: Optional[str] = "dark"


# ==========================================================================
# In-Memory Database (Auth, Emails, Jobs, Settings)
# ==========================================================================

USERS_DB = [
    {
        "id": "usr-1",
        "name": "Alex Rivera",
        "email": "alex@mailpilot.ai",
        "password": "demo123",
        "avatar": "AR",
        "role": "Candidate Pro",
        "token": "token-alex-rivera-mailpilot-session-key"
    },
    {
        "id": "usr-2",
        "name": "Admin Pilot",
        "email": "admin@mailpilot.ai",
        "password": "admin123",
        "avatar": "AP",
        "role": "Lead Administrator",
        "token": "token-admin-mailpilot-session-key"
    }
]

EMAILS_DB = [
    {
        "id": "email-1",
        "sender": "Maya Chen (Google Recruiting)",
        "sender_email": "recruiting@google.com",
        "company": "Google",
        "avatar_color": "#4285F4",
        "subject": "Google — Interview Update: Technical Round 2 Scheduled",
        "category": "interviews",
        "date": "Today, 1:45 PM",
        "timestamp": "2026-09-28T13:45:00",
        "is_read": False,
        "is_starred": True,
        "urgency": "High",
        "snippet": "We are pleased to invite you to the next technical round for the Senior Cloud Systems Engineer role...",
        "body": """Hi Alex,

We are pleased to invite you to the next technical round of interviews for the Senior Cloud Systems Engineer role at Google.

Interview Details:
- Date: Thursday, October 1, 2026
- Time: 3:00 PM – 4:00 PM EST
- Format: Google Meet (Video + Shared Collaborative Coding)
- Focus: Distributed Systems, Scalable API Design & Concurrency
- Interviewer: Maya Chen (Staff Engineer, Core Cloud Platform)

Please confirm your availability by replying to this email. If you need any accommodation or have scheduling constraints, don't hesitate to reach out.

Best regards,
Google Recruiting Operations""",
        "ai_analysis": {
            "summary": "Technical Round 2 (Distributed Systems & API Design) scheduled for Thursday, Oct 1 at 3:00 PM EST with Maya Chen. Action required: Confirm availability.",
            "key_takeaway": "Technical Round 2 confirmed for Thursday at 3:00 PM EST.",
            "action_items": [
                "Confirm interview slot before 5:00 PM tomorrow",
                "Review Distributed Systems principles and Google Cloud system design patterns",
                "Test Google Meet camera and audio setup"
            ],
            "detected_event": {
                "title": "Google Tech Round 2 (Maya Chen)",
                "date": "Oct 1, 2026",
                "time": "3:00 PM - 4:00 PM EST",
                "platform": "Google Meet",
                "link": "https://meet.google.com/abc-defg-hij"
            },
            "suggested_replies": [
                "Thank you Maya! I confirm my availability for Thursday at 3:00 PM EST. Looking forward to our discussion.",
                "Thank you for the update. Could we reschedule to Friday morning due to an unavoidable conflict?",
                "Confirmed for Thursday at 3:00 PM EST. Could you please share recommended preparation guidelines?"
            ],
            "sentiment": "Action Required"
        }
    },
    {
        "id": "email-2",
        "sender": "Amazon Talent Acquisition",
        "sender_email": "talent-acquisition@amazon.com",
        "company": "Amazon",
        "avatar_color": "#FF9900",
        "subject": "Amazon — Application Received: Software Development Engineer II",
        "category": "jobs",
        "date": "Today, 11:20 AM",
        "timestamp": "2026-09-28T11:20:00",
        "is_read": True,
        "is_starred": False,
        "urgency": "Medium",
        "snippet": "Thank you for submitting your application for Software Development Engineer II (Job ID: 2849102)...",
        "body": """Hello Alex,

Thank you for your interest in Amazon! We have received your application for Software Development Engineer II - AWS Systems (Job ID: 2849102).

Our hiring team is currently reviewing your resume against our leadership principles and core engineering qualifications. Typical initial reviews take 3-5 business days. You can track your real-time application status directly in your Amazon Candidate Dashboard.

In the meantime, feel free to explore our Day 1 culture guide and engineering leadership principles.

Warm regards,
Amazon Talent Operations Team""",
        "ai_analysis": {
            "summary": "Application acknowledged for SDE II (AWS Systems, Job ID: 2849102). Review expected within 3-5 business days.",
            "key_takeaway": "Application is actively under review by AWS engineering leadership.",
            "action_items": [
                "Track application status on Amazon Candidate Dashboard",
                "Review Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Deliver Results)"
            ],
            "detected_event": None,
            "suggested_replies": [
                "Thank you for the confirmation. I look forward to hearing from the hiring team.",
                "Thank you for confirming receipt. Please let me know if any supplementary portfolio links are helpful."
            ],
            "sentiment": "Informative"
        }
    },
    {
        "id": "email-3",
        "sender": "University Career Center",
        "sender_email": "careers@university.edu",
        "company": "College",
        "avatar_color": "#8E24AA",
        "subject": "College — Announcement: Fall Campus Tech Career Fair & Fast-Track Interviews",
        "category": "college",
        "date": "Yesterday, 4:10 PM",
        "timestamp": "2026-09-27T16:10:00",
        "is_read": True,
        "is_starred": False,
        "urgency": "Low",
        "snippet": "Registration is now open for the Annual Fall Tech Career Fair on October 15th featuring 65+ top tier tech employers...",
        "body": """Dear Students & Alumni,

We are thrilled to announce that registration is now open for the Annual Fall Tech Career Fair taking place on Wednesday, October 15, 2026, in the Student Union Ballroom from 10:00 AM to 4:00 PM.

Over 65 premier employers will be attending, including Microsoft, Apple, Datadog, Stripe, and several high-growth AI startups. Several firms will be conducting expedited on-campus interviews the following day.

Make sure your Handshake profile and resume are updated before October 10th to be included in the advance employer resume drop.

Career Services Center""",
        "ai_analysis": {
            "summary": "Campus Career Fair on October 15th with 65+ tech employers. Advance resume drop deadline is October 10th.",
            "key_takeaway": "Fall Tech Fair on Oct 15; update Handshake resume by Oct 10.",
            "action_items": [
                "Update resume and projects on Handshake before Oct 10 deadline",
                "Register for 1-on-1 employer chat sessions",
                "Prepare targeted elevator pitch for cloud & AI roles"
            ],
            "detected_event": {
                "title": "Fall Campus Tech Career Fair",
                "date": "Oct 15, 2026",
                "time": "10:00 AM - 4:00 PM EST",
                "platform": "Student Union Grand Ballroom",
                "link": "https://university.joinhandshake.com"
            },
            "suggested_replies": [
                "Thank you for the update. Registered and updated Handshake profile.",
                "Is there an advance list of specific open job requisitions for attending companies?"
            ],
            "sentiment": "Informative"
        }
    },
    {
        "id": "email-4",
        "sender": "Microsoft University Recruiting",
        "sender_email": "msft-recruiting@microsoft.com",
        "company": "Microsoft",
        "avatar_color": "#00A4EF",
        "subject": "Microsoft — Technical Assessment Invitation (Azure Core Team)",
        "category": "jobs",
        "date": "Yesterday, 1:15 PM",
        "timestamp": "2026-09-27T13:15:00",
        "is_read": False,
        "is_starred": True,
        "urgency": "High",
        "snippet": "You have been invited to complete the Microsoft Online Assessment for Software Engineering...",
        "body": """Hi Alex,

Thank you for your application to Microsoft! We are excited to invite you to take our online technical assessment via Codility.

Assessment Information:
- Test: Azure Core Engineering Skills Assessment
- Duration: 90 minutes (2 coding questions + 1 system architecture question)
- Expiration: Link expires within 72 hours (Deadline: September 30, 2026, 11:59 PM PST)

Please ensure you have a quiet environment and stable internet connection before launching the test environment.

Best regards,
Microsoft Engineering Recruiting Team""",
        "ai_analysis": {
            "summary": "Online technical assessment invitation from Microsoft (Codility). 90 mins, deadline Sept 30, 11:59 PM PST.",
            "key_takeaway": "Codility assessment expires in 48 hours. Estimated duration: 90 mins.",
            "action_items": [
                "Complete Codility assessment before Sept 30 11:59 PM PST",
                "Practice LeetCode graph traversal and concurrency problems"
            ],
            "detected_event": {
                "title": "Microsoft Online Assessment Deadline",
                "date": "Sep 30, 2026",
                "time": "11:59 PM PST",
                "platform": "Codility Assessment",
                "link": "https://codility.com/c/run/msft-test-8492"
            },
            "suggested_replies": [
                "Thank you for the invitation! I will complete the assessment by tomorrow evening.",
                "Thank you. I have received the assessment link and will complete it shortly."
            ],
            "sentiment": "Action Required"
        }
    },
    {
        "id": "email-5",
        "sender": "Stripe Recruiting",
        "sender_email": "recruiting@stripe.com",
        "company": "Stripe",
        "avatar_color": "#635BFF",
        "subject": "Stripe — Final Round Virtual Onsite Schedule Confirmed",
        "category": "interviews",
        "date": "Sep 26, 10:00 AM",
        "timestamp": "2026-09-26T10:00:00",
        "is_read": True,
        "is_starred": True,
        "urgency": "High",
        "snippet": "We are thrilled to share your virtual onsite schedule for the Full Stack Engineer role at Stripe...",
        "body": """Hello Alex,

We are delighted to move forward to the final round interviews for the Full Stack Software Engineer role at Stripe!

Your Virtual Onsite will take place on:
- Date: Monday, October 5, 2026
- Time: 10:00 AM – 2:30 PM PST
- Schedule:
  - 10:00 AM: Systems & Architecture (with Dan Kowalski)
  - 11:15 AM: Live Coding & Bug Hunt (with Priyah Patel)
  - 12:30 PM: Break & Lunch
  - 1:00 PM: Team & Values Collaboration (with Marcus Vance)

A calendar invitation with zoom links will arrive shortly. Please find attached the Stripe Interview Prep packet.

Warmly,
Stripe Recruiting Team""",
        "ai_analysis": {
            "summary": "Final Round Virtual Onsite confirmed for Stripe on Oct 5 (10:00 AM - 2:30 PM PST). 3 rounds: Architecture, Live Coding, Team.",
            "key_takeaway": "Final round virtual onsite on Oct 5. 3 interview rounds.",
            "action_items": [
                "Review Stripe API documentation and architecture guidelines",
                "Test Zoom and shared IDE link",
                "Review team values and past system scaling stories"
            ],
            "detected_event": {
                "title": "Stripe Virtual Onsite (Final Round)",
                "date": "Oct 5, 2026",
                "time": "10:00 AM - 2:30 PM PST",
                "platform": "Zoom",
                "link": "https://stripe.zoom.us/j/9482910482"
            },
            "suggested_replies": [
                "Thank you so much! I have received the schedule and look forward to meeting the team on October 5th.",
                "Thank you! Could you confirm if the live coding portion will be in TypeScript or Python?"
            ],
            "sentiment": "Action Required"
        }
    }
]

JOB_APPLICATIONS = [
    {
        "id": "job-1",
        "company": "Google",
        "role": "Senior Cloud Systems Engineer",
        "stage": "Interviewing",
        "status_badge": "Round 2 Confirmed",
        "applied_date": "Sep 12, 2026",
        "last_updated": "Today, 1:45 PM",
        "salary_range": "$185,000 - $230,000",
        "next_step": "Technical Round 2 with Maya Chen (Oct 1)",
        "email_ref_id": "email-1"
    },
    {
        "id": "job-2",
        "company": "Stripe",
        "role": "Full Stack Software Engineer",
        "stage": "Virtual Onsite",
        "status_badge": "Final Round",
        "applied_date": "Aug 29, 2026",
        "last_updated": "Sep 26, 2026",
        "salary_range": "$190,000 - $240,000",
        "next_step": "Virtual Onsite (3 rounds) on Oct 5",
        "email_ref_id": "email-5"
    },
    {
        "id": "job-3",
        "company": "Microsoft",
        "role": "Software Engineer II - Azure Core",
        "stage": "Assessment",
        "status_badge": "OA Pending",
        "applied_date": "Sep 18, 2026",
        "last_updated": "Yesterday, 1:15 PM",
        "salary_range": "$160,000 - $205,000",
        "next_step": "Complete Codility OA before Sep 30",
        "email_ref_id": "email-4"
    },
    {
        "id": "job-5",
        "company": "Amazon",
        "role": "Software Development Engineer II (AWS)",
        "stage": "Applied",
        "status_badge": "Under Review",
        "applied_date": "Today, 11:20 AM",
        "last_updated": "Today, 11:20 AM",
        "salary_range": "$165,000 - $210,000",
        "next_step": "Wait for 3-5 business day review response",
        "email_ref_id": "email-2"
    }
]

APP_SETTINGS = {
    "ai_model": "gemini-2.5-flash",
    "auto_categorize": True,
    "auto_detect_interviews": True,
    "sync_interval_mins": 5,
    "email_notifications": True,
    "theme": "dark"
}


# ==========================================================================
# Original root & health endpoints (maintaining test compliance)
# ==========================================================================

@app.get("/")
def root():
    return {
        "message": "MailPilot AI is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ==========================================================================
# Authentication Endpoints (Login, Register, Me, Logout)
# ==========================================================================

@app.post("/api/auth/login", response_model=UserResponse)
def login(req: LoginRequest):
    user = next((u for u in USERS_DB if u["email"].lower() == req.email.lower()), None)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password. Hint: Use demo credentials.")
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        avatar=user["avatar"],
        role=user["role"],
        token=user["token"]
    )


@app.post("/api/auth/register", response_model=UserResponse)
def register(req: RegisterRequest):
    existing = next((u for u in USERS_DB if u["email"].lower() == req.email.lower()), None)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:6]}",
        "name": req.name,
        "email": req.email,
        "password": req.password,
        "avatar": "".join([p[0].upper() for p in req.name.split()[:2]]) or "MP",
        "role": "Candidate Member",
        "token": f"token-{uuid.uuid4().hex}"
    }
    USERS_DB.append(new_user)
    return UserResponse(
        id=new_user["id"],
        name=new_user["name"],
        email=new_user["email"],
        avatar=new_user["avatar"],
        role=new_user["role"],
        token=new_user["token"]
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None)):
    token = authorization.replace("Bearer ", "") if authorization else None
    user = next((u for u in USERS_DB if u["token"] == token), None) if token else None
    if not user:
        # Default to first user if no token provided for ease of testing
        user = USERS_DB[0]
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        avatar=user["avatar"],
        role=user["role"],
        token=user["token"]
    )


@app.post("/api/auth/logout")
def logout():
    return {"status": "success", "message": "Logged out successfully"}


# ==========================================================================
# Real Mailbox Endpoints (IMAP & SMTP)
# ==========================================================================

@app.get("/api/mail/config")
def get_mail_config():
    cfg = mail_service.config
    return {
        "imap_host": cfg.imap_host,
        "imap_port": cfg.imap_port,
        "imap_user": cfg.imap_user,
        "has_imap_password": bool(cfg.imap_password),
        "smtp_host": cfg.smtp_host,
        "smtp_port": cfg.smtp_port,
        "smtp_user": cfg.smtp_user,
        "has_smtp_password": bool(cfg.smtp_password),
        "is_configured": mail_service.is_configured()
    }


@app.post("/api/mail/config")
def update_mail_config(creds: MailCredentials):
    mail_service.update_config(creds)
    return {
        "status": "success",
        "message": "Mail configuration saved successfully",
        "is_configured": mail_service.is_configured()
    }


@app.post("/api/mail/test-connection")
def test_mail_connection(creds: Optional[MailCredentials] = None):
    return mail_service.test_connection(creds)


@app.post("/api/mail/fetch-real")
def fetch_real_emails(limit: int = Query(10, ge=1, le=50)):
    if not mail_service.is_configured():
        return {
            "status": "warning",
            "message": "Real IMAP credentials not configured. Please configure your email in Settings.",
            "is_configured": False,
            "fetched_count": 0,
            "emails": []
        }

    try:
        real_emails = mail_service.fetch_real_emails(limit=limit)
        # Prepend new real emails to in-memory database
        for re in real_emails:
            if not any(e["id"] == re["id"] for e in EMAILS_DB):
                EMAILS_DB.insert(0, re)

        return {
            "status": "success",
            "message": f"Successfully fetched {len(real_emails)} real emails from mailbox",
            "fetched_count": len(real_emails),
            "emails": real_emails
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch emails via IMAP: {str(e)}")


@app.post("/api/mail/send-real")
def send_real_email(req: SendRealEmailRequest):
    if not mail_service.is_configured():
        return {
            "status": "simulated",
            "message": f"Simulated: Email queued for {req.to_email}. Configure real SMTP in Settings to deliver directly."
        }

    try:
        result = mail_service.send_real_email(
            to_email=req.to_email,
            subject=req.subject,
            body=req.body,
            in_reply_to=req.in_reply_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMTP dispatch failed: {str(e)}")


# ==========================================================================
# Dashboard & Email Core Endpoints
# ==========================================================================

def get_greeting():
    current_hour = datetime.now().hour
    if current_hour < 12:
        return "Good morning 👋"
    elif current_hour < 17:
        return "Good afternoon 👋"
    else:
        return "Good evening 👋"


@app.get("/api/dashboard")
def get_dashboard():
    unread_count = sum(1 for e in EMAILS_DB if not e["is_read"])
    job_emails_count = sum(1 for e in EMAILS_DB if e.get("category") == "jobs")
    interviews_count = sum(1 for e in EMAILS_DB if e.get("category") == "interviews")

    return {
        "greeting": get_greeting(),
        "user_name": "Alex",
        "stats": {
            "emails": max(124, len(EMAILS_DB)),
            "job_emails": max(18, job_emails_count),
            "interviews": max(4, interviews_count),
            "unread": unread_count,
            "action_required": 3
        },
        "recent_emails": EMAILS_DB[:5],
        "active_jobs_count": len(JOB_APPLICATIONS),
        "upcoming_interviews_count": 4,
        "sync_status": "Synced 2 mins ago",
        "has_real_mail_configured": mail_service.is_configured()
    }


@app.get("/api/emails")
def get_emails(
    category: Optional[str] = Query(None, description="all, inbox, jobs, interviews, college, starred"),
    search: Optional[str] = Query(None, description="Search query"),
    unread_only: bool = Query(False)
):
    results = EMAILS_DB.copy()

    if category and category != "all":
        if category == "inbox":
            pass
        elif category == "starred":
            results = [e for e in results if e.get("is_starred")]
        else:
            results = [e for e in results if e.get("category") == category]

    if unread_only:
        results = [e for e in results if not e.get("is_read")]

    if search:
        s = search.lower()
        results = [
            e for e in results
            if s in e["subject"].lower()
            or s in e["sender"].lower()
            or s in e["company"].lower()
            or s in e["snippet"].lower()
            or s in e["body"].lower()
        ]

    return {"emails": results, "total": len(results)}


@app.get("/api/emails/{email_id}")
def get_email_detail(email_id: str):
    email = next((e for e in EMAILS_DB if e["id"] == email_id), None)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@app.post("/api/emails/{email_id}/toggle-read")
def toggle_read(email_id: str):
    email = next((e for e in EMAILS_DB if e["id"] == email_id), None)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    email["is_read"] = not email["is_read"]
    return {"id": email_id, "is_read": email["is_read"]}


@app.post("/api/emails/{email_id}/toggle-star")
def toggle_star(email_id: str):
    email = next((e for e in EMAILS_DB if e["id"] == email_id), None)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    email["is_starred"] = not email["is_starred"]
    return {"id": email_id, "is_starred": email["is_starred"]}


@app.post("/api/emails/{email_id}/ai-reply", response_model=AIReplyResponse)
def generate_ai_reply(email_id: str, request: AIReplyRequest):
    email = next((e for e in EMAILS_DB if e["id"] == email_id), None)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    sender = email["sender"].split()[0]
    subject = f"Re: {email['subject']}"

    if request.tone == "confirm":
        body = (
            f"Hi {sender},\n\n"
            f"Thank you for the update! I am delighted to confirm my availability for the proposed time. "
            f"I have marked my calendar and look forward to speaking with the team.\n\n"
            f"Best regards,\nAlex"
        )
    elif request.tone == "reschedule":
        body = (
            f"Hi {sender},\n\n"
            f"Thank you very much for reaching out. Due to a prior scheduling conflict at that exact slot, "
            f"would it be possible to reschedule to Friday between 10:00 AM – 2:00 PM EST, or next Monday morning?\n\n"
            f"I appreciate your flexibility and look forward to connecting.\n\n"
            f"Best regards,\nAlex"
        )
    elif request.tone == "enthusiastic":
        body = (
            f"Hi {sender},\n\n"
            f"Thank you for this wonderful update! I am thrilled to move forward in the process with {email['company']}. "
            f"I've confirmed the session and have begun reviewing the background materials. Please let me know if you need any additional information from my side prior to the meeting.\n\n"
            f"Warm regards,\nAlex"
        )
    else:  # professional default
        body = (
            f"Hi {sender},\n\n"
            f"Thank you for following up regarding {email['subject']}. I have received all the information "
            f"and confirmed everything on my end. Please let me know if there are any additional preparation steps or documents required.\n\n"
            f"Best regards,\nAlex"
        )

    return AIReplyResponse(
        subject=subject,
        reply_body=body,
        suggested_tones=["confirm", "reschedule", "enthusiastic", "professional"],
        confidence_score=0.98
    )


@app.post("/api/emails/sync")
def sync_emails():
    # If real mail is configured, also pull latest messages
    real_fetched = 0
    if mail_service.is_configured():
        try:
            real_emails = mail_service.fetch_real_emails(limit=5)
            for re in real_emails:
                if not any(e["id"] == re["id"] for e in EMAILS_DB):
                    EMAILS_DB.insert(0, re)
            real_fetched = len(real_emails)
        except Exception:
            pass

    return {
        "status": "success",
        "message": "Mailbox synced successfully with MailPilot AI Agent",
        "synced_at": datetime.now().isoformat(),
        "new_emails_processed": 3 + real_fetched,
        "interviews_detected": 1,
        "is_real_mail_synced": mail_service.is_configured()
    }


@app.get("/api/jobs")
def get_jobs():
    return {"jobs": JOB_APPLICATIONS, "total": len(JOB_APPLICATIONS)}


@app.get("/api/interviews")
def get_interviews():
    interviews = []
    for email in EMAILS_DB:
        event = email.get("ai_analysis", {}).get("detected_event")
        if event and email["category"] == "interviews":
            interviews.append({
                "id": email["id"],
                "company": email["company"],
                "subject": email["subject"],
                "event": event,
                "urgency": email["urgency"],
                "action_items": email.get("ai_analysis", {}).get("action_items", [])
            })
    return {"interviews": interviews, "total": len(interviews)}


@app.get("/api/calendar")
def get_calendar_events():
    events = []
    for email in EMAILS_DB:
        event = email.get("ai_analysis", {}).get("detected_event")
        if event:
            events.append({
                "id": email["id"],
                "company": email["company"],
                "event_title": event["title"],
                "date": event["date"],
                "time": event["time"],
                "platform": event["platform"],
                "link": event["link"],
                "category": email["category"]
            })
    return {"events": events, "total": len(events)}


@app.get("/api/settings")
def get_settings():
    return APP_SETTINGS


@app.post("/api/settings")
def update_settings(settings: SettingsUpdate):
    for key, value in settings.model_dump(exclude_unset=True).items():
        APP_SETTINGS[key] = value
    return {"status": "success", "settings": APP_SETTINGS}


# Mount compiled frontend static build if available (e.g. In Docker container)
from pathlib import Path
from fastapi.staticfiles import StaticFiles

static_path = Path(__file__).resolve().parent / "static"
if not static_path.exists():
    static_path = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if static_path.exists():
    app.mount("/app", StaticFiles(directory=str(static_path), html=True), name="static")