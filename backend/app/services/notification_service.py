import requests
import json
from sqlalchemy.orm import Session
from app.models.config import SystemConfig
from app.models.user import User
from app.models.notification import Notification


class NotificationService:

    def create_alert(self, db: Session, transaction):
        """
        Creates a persistent Notification record in the database.
        Called automatically after every transaction scored by the AI.
        """
        score_pct = transaction.fraud_score * 100

        if transaction.status == "Decline":
            notif = Notification(
                title="🚨 Critical Fraud Detected",
                message=(
                    f"Transaction #{transaction.id} at '{transaction.merchant}' "
                    f"was declined — Score: {score_pct:.0f}%"
                ),
                severity="critical",
                transaction_id=transaction.id,
                is_read=False,
            )
            db.add(notif)
            db.commit()

        elif transaction.status == "Escalate":
            notif = Notification(
                title="⚠️ Manual Review Required",
                message=(
                    f"Transaction #{transaction.id} at '{transaction.merchant}' "
                    f"needs review — Score: {score_pct:.0f}%"
                ),
                severity="warning",
                transaction_id=transaction.id,
                is_read=False,
            )
            db.add(notif)
            db.commit()

    def send_slack_alert(self, db: Session, message: str):
        """Sends a message to the configured Slack Webhook."""
        config = db.query(SystemConfig).filter(SystemConfig.key == "slack_webhook_url").first()
        if not config or not config.value:
            return  # No webhook configured

        try:
            payload = {"text": message}
            response = requests.post(config.value, json=payload)
            if response.status_code != 200:
                print(f"❌ Failed to send Slack alert: {response.text}")
        except Exception as e:
            print(f"❌ Error sending Slack alert: {e}")

    def send_email_alert(self, to_email: str, subject: str, content: str):
        """Mock/Placeholder for sending email."""
        print(f"\n📧 [EMAIL MOCK] To: {to_email} | Subject: {subject}")
        print(f"Content: {content}\n")

    def check_and_notify(self, db: Session, transaction, customer_user: User = None):
        """
        Central notification dispatcher. Called after every AI prediction.
        Order: persist alert to DB first, then external channels.
        """
        # 1. Persist in-app alert (drives the red dot)
        self.create_alert(db, transaction)

        fraud_score_percent = transaction.fraud_score * 100

        # 2. Global Slack Alert (System Config)
        if fraud_score_percent > 70:
            self.send_slack_alert(
                db,
                f"🚨 High Verification Alert! Transaction ID: {transaction.id} | Score: {fraud_score_percent:.1f}%",
            )

        # 3. User Email Alerts (Subscribed Users — scores > 90%)
        if fraud_score_percent > 90:
            users = db.query(User).all()
            for user in users:
                try:
                    prefs = json.loads(user.notification_preferences) if user.notification_preferences else {}
                    if prefs.get("email_high_risk"):
                        self.send_email_alert(
                            user.email,
                            "🚨 CRITICAL FRAUD ALERT",
                            f"Transaction {transaction.id} has a score of {fraud_score_percent:.1f}%.",
                        )
                except Exception:
                    continue


notification_service = NotificationService()
