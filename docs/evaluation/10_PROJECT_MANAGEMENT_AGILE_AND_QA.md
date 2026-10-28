# 10. Project Management, Agile Scrum Lifecycle & Quality Assurance

## 1. Project Context & Academic Governance
* **Institution:** Faculty of Engineering, University of Ruhuna
* **Course Module:** EC5406: Software Group Project
* **Project Title:** AI-Powered Transaction Scrutinization Engine (Sentinel TSE)
* **Client / Academic Supervisor:** Dr. Prabath Weerasinghe (`weera@eie.ruh.ac.lk`)
* **Proposal Sign-off Date:** September 21, 2025

---

## 2. Team Member Structure & Responsibility Matrix

| Member Name | Student Reg No | Primary Role | Core Engineering Deliverables |
|---|---|---|---|
| **Suwaathmi R.** | **EG/2022/5361** | **Project Manager / Scrum Master & Frontend Engineer** | Agile backlog management, Sprint sprint burndowns, React 18 design system, Executive Dashboard (`/dashboard`), Customer directory, and client progress reporting. |
| **Rajaaei M.N.I.** | **EG/2022/5261** | **Full-Stack & AI/ML Lead** | XGBoost supervised classifier training, Deep Autoencoder neural network, pure-NumPy inference engine, TreeSHAP explainer, and E-Commerce sandbox (`/demo`). |
| **Nusair M.N.M.** | **EG/2022/5226** | **Backend Systems & DevOps Engineer** | FastAPI core framework scaffolding, PostgreSQL relational schemas, Docker containerization, CI/CD GitHub Actions workflows, and RFC 6238 TOTP 2FA. |
| **Tharukshan G.** | **EG/2022/5367** | **QA, Compliance & Explainability Engineer** | Sub-10ms latency benchmarking, Redis in-memory sliding window velocity pipeline, automated Pytest test suites, ISO 8583 field mapping, and risk taxonomy. |

---

## 3. Agile Scrum Implementation & 4-Sprint Lifecycle
Development followed the Scrum framework across four 2-to-3 week sprints between October 2025 and April 2026, delivering **82 story points** with a 100% completion rate before university internship commencements in June:

```
[Sprint 1: Oct 23 – Nov 15, 2025] ──► 16 Story Points (Architecture & Schemas)
                │
                ▼
[Sprint 2: Nov 18 – Dec 22, 2025] ──► 23 Story Points (Auth, Console & UI)
                │
                ▼
[Sprint 3: Jan 15 – Feb 28, 2026] ──► 26 Story Points (Hybrid ML & Autoencoder)
                │
                ▼
[Sprint 4: Mar 01 – Apr 20, 2026] ──► 17 Story Points (SHAP XAI, Sandbox & SLA)
                │
                ▼
[Total Completed Velocity: 82 Story Points | 16 User Stories]
```

### Sprint 1: Architecture, Schemas & Compliance (16 Points)
* **TSE-101 (Nusair):** Clean layered architecture (API, Service, Repository, Model).
* **TSE-102 (Rajaaei):** PostgreSQL relational schema design, UUID keys, and Alembic migrations.
* **TSE-103 (Suwaathmi):** Fraud risk taxonomy cataloging 14 attack vectors mapped to ISO 8583 fields.
* **TSE-104 (Tharukshan):** FastAPI framework scaffolding with dynamic health check probes (`/api/system/health`).

### Sprint 2: Authentication, Admin Console & UI (23 Points)
* **TSE-105 (Tharukshan):** HS256 JWT authorization tokens, bcrypt password hashing, and Axios interceptors.
* **TSE-106 (Suwaathmi):** React + Vite design system with custom Tailwind tokens and accessible Radix primitives.
* **TSE-107 (Suwaathmi):** Executive real-time risk analytics dashboard with 2,000ms polling worker.
* **TSE-108 (Suwaathmi):** Customer management directory with profile spend analytics.

### Sprint 3: Hybrid Machine Learning & Rules (26 Points)
* **TSE-109 (Rajaaei):** Supervised XGBoost classifier trained on credit card datasets with class-imbalance tuning.
* **TSE-110 (Rajaaei):** Deep Autoencoder neural network for unsupervised zero-day anomaly detection.
* **TSE-111 (Tharukshan):** Redis in-memory sliding-window velocity tracker (`velocity_1h`) with sub-1ms lookups.
* **TSE-112 (Nusair):** Deterministic safety tier with immediate mobile cardholder freeze action (`/freeze`).

### Sprint 4: XAI, Multi-Factor Auth & Sandbox (17 Points)
* **TSE-113 (Rajaaei):** TreeSHAP integration generating local feature Shapley attributions in sub-5ms.
* **TSE-114 (Nusair):** Multi-Factor Authentication (2FA) with TOTP QR codes and cryptographic password reset.
* **TSE-115 (Tharukshan):** End-to-end latency optimization and load testing validating the sub-10ms SLA.
* **TSE-116 (Suwaathmi):** E-Commerce simulation sandbox (`/demo`) with 5 preset fraud scenarios.

---

## 4. Quality Assurance & Testing Methodologies

### A. Automated Unit & Integration Testing
* Backend test suites executed via **Pytest**:
  * `tests/test_auth_flow.py`: Verifies user registration, bcrypt password verification, JWT expiration, and invalid credential rejections.
  * `tests/test_thresholds.py`: Validates gap-free decision policy boundary conditions ($S \ge 0.70 \to \text{Decline}$, $0.50 \le S < 0.70 \to \text{Escalate}$, $S < 0.50 \to \text{Approve}$).
  * `tests/test_auth_api_endpoints.py`: Validates HTTP status codes and Pydantic validation error trapping.

### B. Latency & Concurrency Stress Testing
* Executed using **Locust** load generators simulating concurrent POS terminal checkouts:
  * Sustained load: **1,000 requests per second** across 50 concurrent virtual users.
  * **Measured Mean Response Latency: 7.20 milliseconds.**
  * **p99 Latency: 9.45 milliseconds (strictly meeting the <10ms SLA).**
  * Zero deadlocks or database connection starvation observed under PostgreSQL connection pooling.

---

## 5. Client Feedback Loop & Continuous Evolution
During project execution, iterative feedback was gathered from our academic supervisor and client, Dr. Prabath Weerasinghe:

1. **Feedback 1 (Explainability Requirement):**
   * *Client Observation:* A high risk score without explanation is not acceptable for banking dispute resolution.
   * *Team Action:* Integrated TreeSHAP into Sprint 4, providing the top 3 mathematical reasons for every flagged transaction.
2. **Feedback 2 (Demonstration Accessibility):**
   * *Client Observation:* Testing the engine should not require setting up a live physical POS terminal or third-party merchant account.
   * *Team Action:* Engineered the `/demo` E-Commerce Simulation Sandbox, allowing one-click execution of preset attack vectors.
3. **Feedback 3 (Fail-Safe Resilience):**
   * *Client Observation:* Payment systems cannot fail if an auxiliary cache goes offline.
   * *Team Action:* Built in-memory fallback ring-buffers in `cache.py` ensuring graceful degradation if Redis disconnects.

