# 01. AI / ML Architecture Overview & Design Rationale

## 1. System Objective & The Core Challenge
The **Sentinel AI-Powered Transaction Scrutinization Engine** is engineered for mission-critical banking and payment authorization networks. 

In high-throughput financial switches (such as Visa Base I/II, Mastercard Banknet, or national switches like LankaPay):
* **Transaction Latency Budget:** Authorization verdicts must be returned within **sub-10 milliseconds (p99 < 10ms)** to prevent point-of-sale timeout.
* **The Asymmetric Cost of Errors:**
  * **False Negatives (Missed Fraud):** Direct financial loss, chargeback fees, and reputational damage.
  * **False Positives (Declining Legitimate Customers):** "Customer Insult" — 40% of customers abandon merchants after an erroneous card decline, and 32% switch card issuers entirely.
* **The Evolving Adversary:** Fraudsters constantly invent novel vectors (zero-day fraud) that have never been seen before in historical labeled training data.

---

## 2. Why a Dual Hybrid Architecture?
Most academic projects make the mistake of using a **single model** (either a standalone classifier or a basic rule engine). In industrial banking systems, this creates severe blind spots:

| Detection Paradigm | Model Used | Primary Strength | Critical Weakness |
|---|---|---|---|
| **Supervised Learning** | **XGBoost (Classifier)** | Extremely high precision on **known fraud patterns** (e.g., card testing, stolen credentials, abnormal amounts). | **Blind to Zero-Day Attacks.** If an attacker uses an unseen tactic not in historical training labels, supervised models assign a low score. |
| **Unsupervised Learning** | **Deep Autoencoder (Neural Net)** | **Catches Zero-Day Novel Anomalies** without requiring any historical fraud labels. | Can have higher false-positive rates on legitimate but unusual customer behavior (e.g., buying luxury goods once a year). |
| **Deterministic Rules** | **Tier 1 Hard Rules & Redis Cache** | Zero-latency instant safety (cardholder freeze, rapid velocity throttle). | Inflexible and easily bypassed once attackers figure out the static thresholds. |

### The Sentinel Hybrid Solution
We fuse all three tiers into a hierarchical evaluation pipeline:
$$\text{Final Hybrid Score} = (0.65 \times S_{\text{XGBoost}}) + (0.35 \times S_{\text{Autoencoder}})$$
* **Deterministic Tier 1:** If customer card is marked `is_frozen = True`, immediate `Decline` without compute overhead.
* **XGBoost (65% weight):** Anchors the score against mathematically confirmed historical fraud signatures.
* **Autoencoder (35% weight):** Elevates the risk score whenever feature combinations violate the learned normal manifold.
* **Active Threat Overrides:** High velocity bursts ($\ge 3$ transactions/hour) or sudden foreign country jumps automatically raise the risk floor to enforce security.

---

## 3. Real-World Banking Use Cases
Where does this engine sit in an actual banking infrastructure?

```
[POS Terminal / E-Commerce Gateway]
               │
               ▼
   [Payment Switch / ISO 8583]
               │
               ▼ (JSON Payload via REST / gRPC)
┌───────────────────────────────────────────────┐
│     SENTINEL TRANSACTION SCRUTINIZATION      │
│                                               │
│  1. In-Memory Redis Sliding Velocity (<1ms)   │
│  2. Rule Filter (Freeze / Blacklist) (<0.5ms) │
│  3. XGBoost GBDT Inference (<2ms)             │
│  4. NumPy Autoencoder Reconstruction (<1.5ms) │
│  5. TreeSHAP Feature Attribution (<3ms)       │
│  6. Configurable Threshold Decision           │
└───────────────────────────────────────────────┘
               │
               ▼
[Verdict: Approve | Escalate | Decline] ──► [Back to Switch in ~7ms]
               │
               ▼ (Asynchronous Audit Stream)
 [PostgreSQL DB & Real-Time Analyst Dashboard]
```

1. **Card-Not-Present (CNP) E-Commerce Protection:** Real-time scrutiny during web checkout before 3D-Secure challenge or payment settlement.
2. **ATM / POS Velocity Throttling:** Detecting automated bot script attacks attempting 50 small authorizations in 2 minutes across random merchants.
3. **Cardholder Self-Defense:** Instant card freeze initiated from mobile banking applications acting as an instant deterministic kill-switch.
4. **Analyst Case Investigation:** Real-time explanation codes presented directly to fraud officers, eliminating the "black-box" dilemma.
