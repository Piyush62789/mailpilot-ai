import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import app


client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "greeting" in data
    assert data["stats"]["emails"] >= 124
    assert data["stats"]["job_emails"] >= 18
    assert data["stats"]["interviews"] >= 4
    assert len(data["recent_emails"]) > 0


def test_emails_filter():
    response = client.get("/api/emails?category=interviews")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for email in data["emails"]:
        assert email["category"] == "interviews"


def test_ai_reply():
    response = client.post(
        "/api/emails/email-1/ai-reply",
        json={"tone": "confirm"}
    )
    assert response.status_code == 200
    reply = response.json()
    assert "reply_body" in reply
    assert "confirm" in reply["reply_body"].lower()


def test_toggle_star_and_read():
    star_res = client.post("/api/emails/email-1/toggle-star")
    assert star_res.status_code == 200

    read_res = client.post("/api/emails/email-1/toggle-read")
    assert read_res.status_code == 200


def test_jobs_and_interviews():
    jobs_res = client.get("/api/jobs")
    assert jobs_res.status_code == 200
    assert len(jobs_res.json()["jobs"]) >= 4

    interviews_res = client.get("/api/interviews")
    assert interviews_res.status_code == 200
    assert len(interviews_res.json()["interviews"]) >= 1


def test_auth_login_and_logout():
    # Successful demo login
    res = client.post("/api/auth/login", json={"email": "alex@mailpilot.ai", "password": "demo123"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alex Rivera"
    assert "token" in data

    # Failed login
    fail_res = client.post("/api/auth/login", json={"email": "alex@mailpilot.ai", "password": "wrong"})
    assert fail_res.status_code == 401

    # Me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['token']}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alex@mailpilot.ai"

    # Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200


def test_auth_register():
    res = client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": "sarah@example.com",
        "password": "secretPassword123"
    })
    assert res.status_code == 200
    assert res.json()["name"] == "Sarah Connor"


def test_mail_endpoints():
    # Config check
    cfg_res = client.get("/api/mail/config")
    assert cfg_res.status_code == 200
    assert "imap_host" in cfg_res.json()

    # Connection test (unconfigured returns false safely)
    test_res = client.post("/api/mail/test-connection")
    assert test_res.status_code == 200
    assert "imap_connected" in test_res.json()

    # Simulated dispatch without credentials
    send_res = client.post("/api/mail/send-real", json={
        "to_email": "candidate@example.com",
        "subject": "Follow-up",
        "body": "Hello world"
    })
    assert send_res.status_code == 200
    assert "simulated" in send_res.json()["status"]