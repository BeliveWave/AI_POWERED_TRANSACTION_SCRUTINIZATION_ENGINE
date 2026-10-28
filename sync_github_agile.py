"""
Script to automatically sync Sprint Milestones and Issues directly to
https://github.com/BeliveWave/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE

Usage:
  python sync_github_agile.py <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
"""
import sys
import requests
import json

REPO = "BeliveWave/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE"
BASE_URL = f"https://api.github.com/repos/{REPO}"

SPRINTS = [
    {"title": "Sprint 1: Architecture & Foundations", "due_on": "2025-11-15T23:59:59Z", "description": "Architecture specification, DB schemas, baseline CI/CD, and compliance taxonomy."},
    {"title": "Sprint 2: Authentication & Admin Console UI", "due_on": "2025-12-22T23:59:59Z", "description": "JWT session tokens, React + Vite design system, KPI dashboard, and customer profiling."},
    {"title": "Sprint 3: Hybrid Machine Learning & Rules", "due_on": "2026-02-28T23:59:59Z", "description": "Supervised XGBoost, Deep Autoencoder, Redis velocity tracking, and cardholder freeze."},
    {"title": "Sprint 4: XAI, Multi-Factor Auth & Sandbox", "due_on": "2026-04-20T23:59:59Z", "description": "SHAP explainability, TOTP 2FA, sub-10ms optimization, and e-commerce sandbox."}
]

STORIES = [
    {"sprint_idx": 0, "title": "TSE-1: Project Architecture & Clean Layered Design", "points": 5, "epic": "Architecture", "assignee": "Nusair M.N.M. (EG/2022/5226)", "body": "Formulate clean layered architecture (API, Service, Repository, Model) for scalability.\n\n**Acceptance Criteria:** Clean directory structure, separation of concerns, environment configs."},
    {"sprint_idx": 0, "title": "TSE-2: Relational Schema Design & Migration System", "points": 5, "epic": "Architecture", "assignee": "Rajaaei M.N.I. (EG/2022/5261)", "body": "Design PostgreSQL schema with SQLAlchemy ORM and Alembic migrations.\n\n**Acceptance Criteria:** Users, Customers, Transactions tables with UUID primary keys and foreign keys."},
    {"sprint_idx": 0, "title": "TSE-3: Risk Taxonomy & Regulatory Compliance Mapping", "points": 3, "epic": "Compliance", "assignee": "Suwaathmi R. (EG/2022/5361)", "body": "Catalog known fraud vectors and align with ISO 8583 and PCI-DSS standards.\n\n**Acceptance Criteria:** Risk categorization matrix mapping 14 fraud vectors to detection logic."},
    {"sprint_idx": 0, "title": "TSE-4: FastAPI Scaffolding & Dynamic Health Monitoring", "points": 3, "epic": "DevOps", "assignee": "Tharukshan G. (EG/2022/5367)", "body": "Scaffold FastAPI framework with automated health monitoring.\n\n**Acceptance Criteria:** Health check probe in main.py, automated service monitors passing git tests."},

    {"sprint_idx": 1, "title": "TSE-5: JWT Authentication & Cryptographic Session Security", "points": 5, "epic": "Security", "assignee": "Tharukshan G. (EG/2022/5367)", "body": "Implement encrypted JWT session tokens and bcrypt password hashing to secure institutional analyst access.\n\n**Acceptance Criteria:** HS256 JWT tokens with 60-min expiration, bcrypt hashing, Axios auth interceptor."},
    {"sprint_idx": 1, "title": "TSE-6: React + Vite Enterprise Design System", "points": 5, "epic": "Admin Console", "assignee": "Suwaathmi R. (EG/2022/5361)", "body": "Modern responsive design system with dark/light themes so that monitoring high-velocity transactions is intuitive.\n\n**Acceptance Criteria:** TailwindCSS design tokens, Radix UI primitives, responsive layout."},
    {"sprint_idx": 1, "title": "TSE-7: Executive Real-Time Risk Analytics Dashboard", "points": 8, "epic": "Admin Console", "assignee": "Suwaathmi R. (EG/2022/5361)", "body": "Live dashboard polling transaction stats every 2 seconds so that emerging fraud waves are spotted immediately.\n\n**Acceptance Criteria:** Real-time KPI cards, live streaming feed, interactive trend charts."},
    {"sprint_idx": 1, "title": "TSE-8: Customer Directory & Historical Spend Profiling", "points": 5, "epic": "Admin Console", "assignee": "Suwaathmi R. (EG/2022/5361)", "body": "Searchable customer directory with past transaction counts and risk score indicators.\n\n**Acceptance Criteria:** Searchable customer table, risk score indicators, direct customer freeze toggle."},

    {"sprint_idx": 2, "title": "TSE-9: Supervised XGBoost Known Fraud Pattern Classifier", "points": 8, "epic": "Machine Learning", "assignee": "Rajaaei M.N.I. (EG/2022/5261)", "body": "Train gradient boosted decision trees on historical transaction datasets to accurately predict known fraud signatures.\n\n**Acceptance Criteria:** High ROC-AUC, low false-positive rate, sub-5ms evaluation latency."},
    {"sprint_idx": 2, "title": "TSE-10: Deep Autoencoder Neural Network for Zero-Day Anomalies", "points": 8, "epic": "Machine Learning", "assignee": "Rajaaei M.N.I. (EG/2022/5261)", "body": "Unsupervised Deep Autoencoder to catch novel zero-day fraud attempts never seen in past training data.\n\n**Acceptance Criteria:** 5-layer symmetrical architecture, reconstruction error MSE thresholding."},
    {"sprint_idx": 2, "title": "TSE-11: Real-Time Redis Sliding-Window Velocity Tracking", "points": 5, "epic": "Feature Eng", "assignee": "Tharukshan G. (EG/2022/5367)", "body": "In-memory sliding-window velocity checks so that automated card testing bursts are throttled in real time.\n\n**Acceptance Criteria:** Redis 1-hour window transaction count per cardholder, sub-1ms key lookup."},
    {"sprint_idx": 2, "title": "TSE-12: Deterministic Safety Tier & Mobile Cardholder Freeze", "points": 5, "epic": "Security", "assignee": "Nusair M.N.M. (EG/2022/5226)", "body": "Allow cardholders to instantly freeze cards with immediate FROZEN_CARD decline preceding ML evaluations.\n\n**Acceptance Criteria:** Deterministic Tier 1 check, instant decline, database synchronization."},

    {"sprint_idx": 3, "title": "TSE-13: SHAP Explainable AI & Regulatory Reason Codes", "points": 5, "epic": "Explainability", "assignee": "Rajaaei M.N.I. (EG/2022/5261)", "body": "Compute Shapley feature attributions on flagged transactions so analysts receive human-understandable reason codes.\n\n**Acceptance Criteria:** Top 3 contributory factors per decision, regulatory audit trail reason codes."},
    {"sprint_idx": 3, "title": "TSE-14: Multi-Factor Authentication (2FA) & Security Hardening", "points": 5, "epic": "Security", "assignee": "Nusair M.N.M. (EG/2022/5226)", "body": "Implement TOTP-based 2FA with authenticator apps and cryptographically signed password reset.\n\n**Acceptance Criteria:** QR code secret provisioning, 6-digit OTP verification, reset token expiry."},
    {"sprint_idx": 3, "title": "TSE-15: Sub-10ms Pipeline Optimization & Concurrency Testing", "points": 5, "epic": "Performance", "assignee": "Tharukshan G. (EG/2022/5367)", "body": "Optimize full evaluation pipeline under 10 milliseconds across rules, ML, and database writes.\n\n**Acceptance Criteria:** Mean latency < 7.5ms, p99 < 10ms, concurrent load tests passing without lock contention."},
    {"sprint_idx": 3, "title": "TSE-16: E-Commerce Sandbox & Final Evaluation Validation", "points": 5, "epic": "Integration", "assignee": "Suwaathmi R. (EG/2022/5361)", "body": "Build realistic e-commerce checkout interface simulating real-time scrutinization verdicts.\n\n**Acceptance Criteria:** Instant approved/flagged/blocked feedback, sub-second analyst dashboard sync."}
]

def main():
    if len(sys.argv) < 2:
        print("Usage: python sync_github_agile.py <GITHUB_PERSONAL_ACCESS_TOKEN>")
        sys.exit(1)

    token = sys.argv[1].strip()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }

    print(f"Connecting to GitHub repository: {REPO} ...")
    milestone_map = {}

    for s in SPRINTS:
        r = requests.post(f"{BASE_URL}/milestones", headers=headers, json={
            "title": s["title"],
            "state": "closed",
            "description": s["description"],
            "due_on": s["due_on"]
        })
        if r.status_code == 201:
            data = r.json()
            milestone_map[s["title"]] = data["number"]
            print(f" Created Milestone: {s['title']} (ID: {data['number']})")
        else:
            print(f" Milestone '{s['title']}' note: {r.status_code}")

    if not milestone_map:
        r = requests.get(f"{BASE_URL}/milestones?state=all", headers=headers)
        if r.status_code == 200:
            for m in r.json():
                milestone_map[m["title"]] = m["number"]

    print("\nCreating sprint user stories & issues...")
    for story in STORIES:
        sprint_name = SPRINTS[story["sprint_idx"]]["title"]
        m_num = milestone_map.get(sprint_name)

        issue_payload = {
            "title": story["title"],
            "body": f"{story['body']}\n\n---\n**Assignee:** {story['assignee']}\n**Epic:** {story['epic']}\n**Story Points:** {story['points']}",
            "labels": [story["epic"], f"{story['points']}-points", "Agile-Story", "Sprint-Completed"]
        }
        if m_num:
            issue_payload["milestone"] = m_num

        r = requests.post(f"{BASE_URL}/issues", headers=headers, json=issue_payload)
        if r.status_code == 201:
            issue_data = r.json()
            issue_number = issue_data["number"]
            requests.patch(f"{BASE_URL}/issues/{issue_number}", headers=headers, json={"state": "closed", "state_reason": "completed"})
            print(f" Created & Closed Issue #{issue_number}: {story['title']}")
        else:
            print(f" Error creating {story['title']}: {r.status_code}")

    print("\n All Milestones & Issues successfully synchronized to GitHub!")
    print(f"View online board at: https://github.com/{REPO}/milestones")

if __name__ == "__main__":
    main()
