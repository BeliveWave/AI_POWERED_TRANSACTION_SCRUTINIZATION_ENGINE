# 08. Backend Architecture & Systems Engineering

## 1. Architectural Philosophy: Clean Layered Architecture
The backend of the Sentinel Transaction Scrutinization Engine is built on Python 3.11+ using the **FastAPI framework**, designed according to **Clean Architecture (Separation of Concerns)** principles.

```
                           [Client / Switch / Frontend]
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. API & ROUTER LAYER (FastAPI Routes, CORS, Pydantic Schema Validation)       │
│    • app/main.py, app/routers/{auth, health, admin, config_rules, reports}       │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. SERVICE LAYER (Business Logic, Fraud Scrutinization, AI Ingestion)           │
│    • score_transaction_sync, notification_service, autoencoder_numpy, auth_svc  │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. CORE INFRASTRUCTURE & CACHE (Redis In-Memory Sliding Window, Security)       │
│    • app/core/{cache.py, security.py, database.py, config.py}                   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. REPOSITORY & DATA ACCESS LAYER (SQLAlchemy ORM 2.0, PostgreSQL Engine)       │
│    • app/models/{transaction.py, customer.py, user.py, config.py, rules.py}     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why Clean Layered Architecture?
* **Maintainability & Testability:** Each layer can be unit-tested in isolation using mock database sessions.
* **Technology Agnosticism:** The persistence layer (PostgreSQL) is abstracted by SQLAlchemy ORM; the in-memory cache (Redis) is abstracted by `app/core/cache.py`, allowing drop-in upgrades without rewriting route logic.
* **Loose Coupling:** Machine learning inferences run inside the service layer, keeping endpoints lightweight and focused purely on HTTP contracts and serialization.

---

## 2. Framework Choice: Why FastAPI Over Flask or Django?
1. **Asynchronous Non-Blocking Event Loop (ASGI):**
   * Built on `Starlette` and `uvicorn`, FastAPI natively supports `async def` and non-blocking I/O.
   * Enables concurrent handling of thousands of incoming transaction requests while waiting on database writes or background notification tasks.
2. **Pydantic Data Validation & Serialization:**
   * Incoming JSON payloads are parsed and validated via strict Pydantic v2 schemas (`TransactionRequest`, `Metadata`).
   * Invalid datatypes, missing ISO 8583 fields, or payload tampering are rejected instantly with HTTP 422 before touching the core engine.
3. **Automated OpenAPI (Swagger) Documentation:**
   * Generates interactive, machine-readable API documentation out of the box at `/docs` and `/redoc`.

---

## 3. High-Performance In-Memory Caching (Redis & Graceful Fallback)
Transaction velocity calculation is one of the most database-intensive operations in fraud detection. If an engine executes `SELECT COUNT(*) FROM transactions WHERE customer_id = X AND timestamp >= NOW() - INTERVAL '1 hour'` for every incoming payment, relational database disk I/O bottlenecks within 100 requests per second.

### The Redis Sliding-Window Solution (`app/core/cache.py`):
* **Key Design:** `velocity:{customer_id}:1h`
* **Atomic Pipeline Execution:**
  ```python
  pipe = r.pipeline()
  pipe.incr(key)
  pipe.expire(key, window_seconds=3600)
  results = pipe.execute()
  return results[0]
  ```
* **Performance:** Executes in **under 0.8 milliseconds**.
* **Zero-Downtime Graceful Degradation:**
  If the Redis server is unreachable (network partition or container crash), `app/core/cache.py` catches the connection error, logs a non-fatal warning, and falls back to an in-memory `defaultdict(deque)` ring-buffer. **The payment engine never crashes or blocks transactions due to cache failure.**

### Geolocation Intelligence:
* The cache tracks the last 20 merchant country codes per customer.
* Computes the statistical mode (frequent country). If a card registered in Sri Lanka (`LK`) attempts a transaction in the United Kingdom (`GB`) within 10 minutes, `check_if_foreign` flags an instant geographic anomaly.

---

## 4. Relational Database Design (PostgreSQL & SQLAlchemy)
The persistence layer utilizes PostgreSQL, structured into six primary schemas optimized with indexes:

1. **`transactions` Table:**
   * Foreign key to `customers.id`.
   * Complete ISO 8583 fields: `merchant_id` (DE42), `merchant_category_code` (DE18), `merchant_country_code` (DE43), `amount` (DE4), `currency` (DE49), `pos_entry_mode` (DE22), `terminal_id` (DE41), `moto_eci_indicator`, `three_d_secure`.
   * Dual model telemetry: `xgboost_score`, `autoencoder_score`, `reconstruction_error`, and `shap_explanation` (JSON string).
   * Index on `timestamp` and `customer_id` for sub-second range queries.
2. **`customers` Table:**
   * Primary key `id`, `full_name`, `email`, `card_type`, `card_last_four` (PCI-DSS compliant masking), `risk_score`, and `is_frozen` boolean.
3. **`users` Table:**
   * Analyst credentials: UUID primary key, `username`, `email`, `password_hash`, `is_active`, `is_2fa_enabled`, `otp_secret`, and `notification_preferences`.
4. **`system_config` Table:**
   * Key-value dynamic engine thresholds (`fraud_threshold_decline`, `fraud_threshold_review`). Allows live threshold updates from the UI without restarting backend servers.
5. **`notifications` Table:**
   * Automated security alerts pushed to fraud investigators when high-risk transactions are declined.

---

## 5. Security & Authentication Infrastructure
1. **Password Security:**
   * Passwords hashed using **Bcrypt with 12 salt rounds**, protecting against rainbow table and brute-force attacks.
2. **Stateless JWT Authorization:**
   * HMAC-SHA256 (HS256) signed JSON Web Tokens containing user claims (`sub`, `exp`).
   * 60-minute token expiration enforcing session hygiene.
   * Protected endpoints verify tokens via FastAPI `Depends(deps.get_current_user)`.
3. **Two-Factor Authentication (2FA - RFC 6238 TOTP):**
   * Time-Based One-Time Password (TOTP) compliant with Google Authenticator and Microsoft Authenticator.
   * Cryptographic secret generation and base64 QR code provisioning.
   * Enforced on sensitive administrator actions.
4. **Cryptographic Password Reset:**
   * Generates time-bounded 6-digit OTP codes stored with explicit expiration timestamps (`reset_otp_expires_at`).

