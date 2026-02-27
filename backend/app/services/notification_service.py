import requests
import json
from sqlalchemy.orm import Session
from app.models.config import SystemConfig
from app.models.user import User

class NotificationService:
    def send_slack_alert(self, db: Session, message: str):
        """Sends a message to the configured Slack Webhook."""
        config = db.query(SystemConfig).filter(SystemConfig.key == "slack_webhook_url").first()
        if not config or not config.value:
            return # No webhook configured
            
        try:
            payload = {"text": message}
            response = requests.post(config.value, json=payload)
            if response.status_code != 200:
                print(f"❌ Failed to send Slack alert: {response.text}")
        except Exception as e:
            print(f"❌ Error sending Slack alert: {e}")

    def send_email_alert(self, to_email: str, subject: str, content: str):
        """Mock/Placeholder for sending email."""
        # In production -> use fastapi-mail
        print(f"\n📧 [EMAIL MOCK] To: {to_email} | Subject: {subject}")
        print(f"Content: {content}\n")

    def check_and_notify(self, db: Session, transaction, customer_user: User = None):
        """
        Checks triggers and sends notifications.
        customer_user: The User account associated with the customer (if any). 
                       (In this system, 'Customer' and 'User' are distinct. 
                        User = Bank Staff/Admin. Customer = Card holder.
                        The requirement says 'Profile Settings' controls notifications. 
                        This implies the *User* (Admin/Analyst) wants to be notified about high fraud?
                        
                        Re-reading Requirement:
                        'Notification Preferences section in Profile Settings.'
                        'Email for High Severity... if fraud_score > 90... backend triggers email.'
                        
                        If this setting is in the *Logged In User's* profile, it means the *Analyst* wants alerts.
                        But which analyst? All of them? Or just the admin?
                        
                        Let's assume for now we notify ALL users who have 'notify_high_severity' enabled.
                        Or simpler: Just notify the 'System Admin' or users with a specific role.
                        
                        Given 'Profile Settings' is generic for any user, we might need to loop through users 
                        who subscribed to alerts.
                        
                        Validation: "Profile Settings... Notification Preferences"
                        
                        Let's implement: Find users with preference 'email_high_risk' = True.
        """
        
        fraud_score_percent = transaction.fraud_score * 100
        
        # 1. Global Slack Alert (System Config)
        if fraud_score_percent > 70: # Configurable threshold? Using hardcoded 70 for 'High' for now
            self.send_slack_alert(db, f"🚨 High Verification Alert! Transaction ID: {transaction.id} | Score: {fraud_score_percent:.1f}%")

        # 2. User Email Alerts (Subscribed Users)
        # Verify specific condition: "If fraud_score > 90"
        if fraud_score_percent > 90:
            # Find users who opted in
            # This logic might be heavy if many users, but fine for this scale
            users = db.query(User).all()
            for user in users:
                try:
                    prefs = json.loads(user.notification_preferences) if user.notification_preferences else {}
                    if prefs.get("email_high_risk"):
                        self.send_email_alert(
                            user.email, 
                            "🚨 CRITICAL FRAUD ALERT", 
                            f"Transaction {transaction.id} has a score of {fraud_score_percent:.1f}%."
                        )
                except:
                    continue

notification_service = NotificationService()
