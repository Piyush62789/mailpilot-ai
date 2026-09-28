import os
import email
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import imaplib
import smtplib
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class MailCredentials(BaseModel):
    imap_host: str = Field(default="imap.gmail.com")
    imap_port: int = Field(default=993)
    imap_user: str = Field(default="")
    imap_password: str = Field(default="")
    smtp_host: str = Field(default="smtp.gmail.com")
    smtp_port: int = Field(default=587)
    smtp_user: str = Field(default="")
    smtp_password: str = Field(default="")
    use_ssl: bool = Field(default=True)
    use_tls: bool = Field(default=True)


class RealMailService:
    def __init__(self):
        # Default config loaded from environment variables if present
        self.config = MailCredentials(
            imap_host=os.getenv("IMAP_HOST", "imap.gmail.com"),
            imap_port=int(os.getenv("IMAP_PORT", "993")),
            imap_user=os.getenv("IMAP_USER", ""),
            imap_password=os.getenv("IMAP_PASSWORD", ""),
            smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_user=os.getenv("SMTP_USER", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
        )

    def update_config(self, creds: MailCredentials):
        self.config = creds

    def is_configured(self) -> bool:
        return bool(self.config.imap_user and self.config.imap_password)

    def test_connection(self, creds: Optional[MailCredentials] = None) -> Dict[str, Any]:
        cfg = creds or self.config
        results = {
            "imap_connected": False,
            "smtp_connected": False,
            "imap_message": "",
            "smtp_message": "",
            "success": False
        }

        if not cfg.imap_user or not cfg.imap_password:
            results["imap_message"] = "IMAP credentials not configured. Please enter your email and password/App Password."
            results["smtp_message"] = "SMTP credentials not configured."
            return results

        # Test IMAP
        try:
            if cfg.use_ssl or cfg.imap_port == 993:
                mail = imaplib.IMAP4_SSL(cfg.imap_host, cfg.imap_port, timeout=10)
            else:
                mail = imaplib.IMAP4(cfg.imap_host, cfg.imap_port, timeout=10)
            mail.login(cfg.imap_user, cfg.imap_password)
            mail.select("INBOX")
            mail.logout()
            results["imap_connected"] = True
            results["imap_message"] = f"Connected successfully to IMAP server ({cfg.imap_host})"
        except Exception as e:
            results["imap_message"] = f"IMAP connection failed: {str(e)}"

        # Test SMTP
        try:
            smtp_user = cfg.smtp_user or cfg.imap_user
            smtp_pass = cfg.smtp_password or cfg.imap_password
            if cfg.smtp_port == 465:
                server = smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=10)
                if cfg.use_tls:
                    server.starttls()
            server.login(smtp_user, smtp_pass)
            server.quit()
            results["smtp_connected"] = True
            results["smtp_message"] = f"Connected successfully to SMTP server ({cfg.smtp_host})"
        except Exception as e:
            results["smtp_message"] = f"SMTP connection failed: {str(e)}"

        results["success"] = results["imap_connected"] and results["smtp_connected"]
        return results

    def _decode_header_str(self, header_val: Optional[str]) -> str:
        if not header_val:
            return ""
        decoded_parts = decode_header(header_val)
        result = []
        for content, encoding in decoded_parts:
            if isinstance(content, bytes):
                try:
                    result.append(content.decode(encoding or "utf-8", errors="replace"))
                except Exception:
                    result.append(content.decode("utf-8", errors="replace"))
            else:
                result.append(str(content))
        return "".join(result)

    def fetch_real_emails(self, limit: int = 15, creds: Optional[MailCredentials] = None) -> List[Dict[str, Any]]:
        cfg = creds or self.config
        if not cfg.imap_user or not cfg.imap_password:
            raise ValueError("IMAP credentials are required to fetch real emails.")

        emails_list = []
        mail = None
        try:
            if cfg.use_ssl or cfg.imap_port == 993:
                mail = imaplib.IMAP4_SSL(cfg.imap_host, cfg.imap_port, timeout=15)
            else:
                mail = imaplib.IMAP4(cfg.imap_host, cfg.imap_port, timeout=15)

            mail.login(cfg.imap_user, cfg.imap_password)
            mail.select("INBOX")

            status, messages = mail.search(None, "ALL")
            if status != "OK" or not messages[0]:
                return []

            mail_ids = messages[0].split()
            # Get latest emails up to limit
            selected_ids = mail_ids[-limit:]
            selected_ids.reverse()

            for msg_id in selected_ids:
                status, msg_data = mail.fetch(msg_id, "(RFC822)")
                if status != "OK":
                    continue

                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        raw_email = response_part[1]
                        msg = email.message_from_bytes(raw_email)

                        subject = self._decode_header_str(msg.get("Subject", "(No Subject)"))
                        sender = self._decode_header_str(msg.get("From", "Unknown Sender"))
                        date_str = msg.get("Date", "")
                        message_id = msg.get("Message-ID", f"real-{msg_id.decode()}")

                        # Extract sender email and clean name
                        sender_email = sender
                        sender_name = sender
                        if "<" in sender and ">" in sender:
                            sender_name = sender.split("<")[0].strip().replace('"', '')
                            sender_email = sender.split("<")[1].split(">")[0].strip()

                        # Extract body
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                content_type = part.get_content_type()
                                content_disposition = str(part.get("Content-Disposition"))
                                if content_type == "text/plain" and "attachment" not in content_disposition:
                                    payload = part.get_payload(decode=True)
                                    if payload:
                                        body = payload.decode(errors="replace")
                                        break
                                elif content_type == "text/html" and not body:
                                    payload = part.get_payload(decode=True)
                                    if payload:
                                        body = payload.decode(errors="replace")
                        else:
                            payload = msg.get_payload(decode=True)
                            if payload:
                                body = payload.decode(errors="replace")

                        body_preview = body.strip()[:200].replace("\n", " ") if body else "No text preview available."

                        # Run MailPilot AI categorization & intelligence on real email
                        email_obj = self._analyze_and_enrich_email(
                            email_id=f"real-{msg_id.decode()}",
                            subject=subject,
                            sender_name=sender_name or sender_email,
                            sender_email=sender_email,
                            body=body or body_preview,
                            snippet=body_preview,
                            raw_date=date_str
                        )
                        emails_list.append(email_obj)

            return emails_list
        finally:
            if mail:
                try:
                    mail.close()
                    mail.logout()
                except Exception:
                    pass

    def _analyze_and_enrich_email(
        self,
        email_id: str,
        subject: str,
        sender_name: str,
        sender_email: str,
        body: str,
        snippet: str,
        raw_date: str
    ) -> Dict[str, Any]:
        combined_text = f"{subject} {sender_name} {body}".lower()

        # Classify Category
        category = "general"
        company = sender_name.split()[0] if sender_name else "Unknown"
        urgency = "Medium"

        # Check for company keywords
        for known in ["google", "amazon", "microsoft", "stripe", "meta", "apple", "netflix", "datadog"]:
            if known in combined_text:
                company = known.capitalize()
                break

        # Check for interview patterns
        if any(term in combined_text for term in ["interview", "round", "technical screen", "onsite", "meet.google", "zoom.us", "assessment"]):
            category = "interviews"
            urgency = "High"
        # Check for job application patterns
        elif any(term in combined_text for term in ["application", "applied", "candidate", "job id", "hiring", "recruitment", "status of your application", "requisition"]):
            category = "jobs"
            urgency = "Medium"
        # Check for college / campus patterns
        elif any(term in combined_text for term in ["university", "college", "campus", "career fair", "student", "faculty", "handshake"]):
            category = "college"
            company = "College" if company == "Unknown" else company
            urgency = "Low"

        # Extract dates or event if found
        detected_event = None
        if category == "interviews" or "meeting" in combined_text:
            detected_event = {
                "title": f"{company} Interview / Discussion",
                "date": "Upcoming",
                "time": "See email thread for details",
                "platform": "Google Meet / Zoom",
                "link": "https://meet.google.com"
            }

        # AI summary & suggestions
        ai_summary = f"Summary: Email from {sender_name} regarding '{subject}'. Categorized as {category.upper()}."
        if category == "interviews":
            ai_summary = f"Interview related communication from {company}. Review discussion topics and confirm availability."
        elif category == "jobs":
            ai_summary = f"Job application update from {company}. Track status and follow up if requested."

        return {
            "id": email_id,
            "sender": sender_name,
            "sender_email": sender_email,
            "company": company,
            "avatar_color": "#6366f1" if category == "interviews" else "#f59e0b" if category == "jobs" else "#8b5cf6",
            "subject": subject,
            "category": category,
            "date": raw_date[:16] if raw_date else "Recent",
            "timestamp": datetime.now().isoformat(),
            "is_read": False,
            "is_starred": category == "interviews",
            "urgency": urgency,
            "snippet": snippet,
            "body": body,
            "is_real": True,
            "ai_analysis": {
                "summary": ai_summary,
                "key_takeaway": f"{category.capitalize()} update from {company}",
                "action_items": [
                    f"Review details in {company} email thread",
                    "Draft and send reply if confirmation or action is requested"
                ],
                "detected_event": detected_event,
                "suggested_replies": [
                    f"Thank you for the update. I have reviewed the details and look forward to connecting.",
                    f"Thank you {sender_name}. Could you please confirm the next steps?",
                    f"Confirmed! Looking forward to our conversation."
                ],
                "sentiment": "Action Required" if urgency == "High" else "Informative"
            }
        }

    def send_real_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        in_reply_to: Optional[str] = None,
        creds: Optional[MailCredentials] = None
    ) -> Dict[str, Any]:
        cfg = creds or self.config
        smtp_user = cfg.smtp_user or cfg.imap_user
        smtp_pass = cfg.smtp_password or cfg.imap_password

        if not smtp_user or not smtp_pass:
            raise ValueError("SMTP credentials are required to send real emails.")

        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Subject"] = subject
        if in_reply_to:
            msg["In-Reply-To"] = in_reply_to
            msg["References"] = in_reply_to

        msg.attach(MIMEText(body, "plain", "utf-8"))

        if cfg.smtp_port == 465:
            server = smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=15)
            if cfg.use_tls:
                server.starttls()

        try:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            return {
                "success": True,
                "message": f"Real email dispatched successfully to {to_email} via SMTP ({cfg.smtp_host})"
            }
        finally:
            try:
                server.quit()
            except Exception:
                pass


# Global singleton instance
mail_service = RealMailService()
