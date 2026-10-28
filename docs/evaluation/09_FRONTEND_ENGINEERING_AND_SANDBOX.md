# 09. Frontend Engineering & E-Commerce Simulation Sandbox

## 1. Single-Page Application (SPA) Architecture
The frontend of the Sentinel platform is built using **React 18** and bundled with **Vite 5**, delivering an enterprise-grade, responsive user interface designed for financial analysts and risk operations teams.

```
                              [src/main.jsx]
                                     │
                                     ▼
                            [src/App.jsx: Router]
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        ▼                                                         ▼
[Public & Sandbox Routes]                               [Authenticated AppLayout]
• / (Institutional Landing)                              • /dashboard (Live Console)
• /login, /register                                      • /transactions (Audit Table)
• /demo (E-Commerce Sandbox)                             • /investigator (Case Drilldown)
• /agile (Agile Sprint Board)                            • /customers (Customer Profiles)
• /forgot-password, /reset-password                      • /configuration (Engine Thresholds)
                                                         • /reports (Compliance Exports)
```

### Why React 18 + Vite?
* **Sub-Second Hot Module Replacement (HMR):** Vite leverages native browser ES Modules (ESM) and `esbuild` for instantaneous development refresh and ultra-fast production builds.
* **Declarative Component Hierarchy:** Decouples state management, layout rendering, and API communication.
* **Predictable Routing:** Client-side routing powered by `react-router-dom` v6 with route guards protecting authenticated views.

---

## 2. Design System: TailwindCSS, Radix UI Primitives & Dark Mode
Financial fraud analysts spend 8+ hours a day monitoring high-velocity transaction screens. The interface was engineered to minimize visual fatigue while maximizing situational awareness:

1. **Design Tokens & Utility-First Styling:**
   * Customized `tailwind.config.cjs` establishing systematic color palettes, border radii, and typographic hierarchies.
   * Semantic risk coloring: **Emerald (`#10b981`) for Approved**, **Amber (`#f59e0b`) for Escalated**, and **Rose/Red (`#ef4444`) for Declined**.
2. **Headless Radix UI Primitives:**
   * Accessible, keyboard-navigable dialogs, tooltips, dropdowns, and tabs (`frontend/src/components/ui/`).
3. **Comprehensive Theme Provider (`useTheme.jsx`):**
   * Instant toggle between High-Contrast Dark Mode (for low-light analyst security operations centers) and Clean Light Mode (for executive presentation and daytime auditing).
   * Theme state persisted across browser sessions via `localStorage`.

---

## 3. Real-Time Telemetry & State Management
In financial fraud operations, static dashboards that require manual browser reloads are obsolete.

### The 2000ms Real-Time Polling Engine:
* Inside `Dashboard.jsx`, an optimized asynchronous polling hook queries the backend `/api/reports/summary` and `/api/transactions/recent` every 2,000 milliseconds.
* Uses React state diffing to update metric KPI cards (Total Transactions, High Risk Frauds Blocked, Mean Latency, Active Risk Index) and stream new transactions into the live feed with zero screen flickering.
* Sub-second table re-renders ensure the interface remains smooth even under high transaction throughput.

---

## 4. Key Workspaces in the Analyst Console

### A. Executive Risk Dashboard (`/dashboard`)
* **Live KPI Cards:** Displays Total Volume, Blocked Frauds, Approval Ratio, and Average Pipeline Latency.
* **Streaming Live Transaction Feed:** Shows incoming payments in real time with animated status badges.
* **Historical Fraud Distribution Chart:** Visualizes risk score distribution across time windows.

### B. Transaction Audit Ledger (`/transactions`)
* Complete searchable table supporting multi-field filtering by Customer ID, Merchant Name, Status (Approve/Escalate/Decline), Date Range, and Amount Range.
* Formatted currency and masked card identifiers adhering to banking privacy rules.

### C. Investigator Case Drill-Down (`/investigator`)
* Dedicated deep-dive interface for fraud analysts examining flagged or escalated payments.
* **Interactive SHAP Visualizer:** Displays the top 3 feature attributions as horizontal bar charts, showing the analyst exactly why the model elevated the risk score.

### D. Customer Management & Instant Card Freeze (`/customers`)
* Searchable customer directory displaying profile details, card type, historical spend volume, and active card status.
* **Cardholder Freeze Action:** Direct one-click toggle to freeze or unfreeze a customer's card, instantly updating the PostgreSQL database and Redis cache.

### E. Agile Sprint Management Board (`/agile` & `/sprints`)
* Built-in Jira-equivalent Scrum board accessible inside the console or publicly.
* Visualizes Sprints 1 through 4, 82 story points, 16 user stories, and team member assignments.

---

## 5. The E-Commerce Simulation Sandbox (`/demo`)
To demonstrate how the scrutinization engine functions in live commerce without requiring an actual merchant integration, we engineered a realistic **Merchant Store Simulator** at `http://localhost:5173/demo`.

```
┌──────────────────────────────────────────────────────────────┐
│                    THE BOUTIQUE DEMO STORE                   │
│                                                              │
│  [Weekly Groceries $24.50]   [Luxury Electronics $420.00]   │
│  [Quick Gift Cards $45.00]   [Diamond Solitaire $7,850.00]   │
├──────────────────────────────────────────────────────────────┤
│  CARD CHECKOUT FORM:                                         │
│  Card Number: 4242 •••• •••• 4242   Expiry: 12/28   CVC: 123 │
│                                                              │
│  TEST ATTACK SCENARIOS (1-Click Presets):                    │
│  [ Normal Payment ]    [ Rapid Velocity Attack ]             │
│  [ Foreign VPN Jump ]  [ $7,850 High-Ticket Anomaly ]        │
│  [ Stolen/Frozen Card ]                                      │
├──────────────────────────────────────────────────────────────┤
│  LIVE VERDICT OVERLAY (Sub-10ms Feedback):                   │
│  Status: DECLINED (Risk Score: 0.8841 | Latency: 7.15 ms)    │
│  Reasons: HIGH_VELOCITY, FOREIGN_TRANSACTION                 │
│  XGBoost: 0.8420 | Autoencoder MSE: 0.9120                   │
└──────────────────────────────────────────────────────────────┘
```

### The 5 Interactive Preset Attack Scenarios:
1. **Normal Payment (\$24.50):** Typical grocery purchase from a domestic IP (`LK`) with EMV chip mode. Verdict: **APPROVED (Risk Score: 0.12)**.
2. **Rapid Velocity Attack (\$45.00):** Simulates an automated bot script firing 3+ rapid gift card charges in under 60 seconds. Verdict: **DECLINED (High Velocity Burst override applied)**.
3. **Foreign VPN Attack (\$420.00):** Simulates stolen card credentials used through a UK (`GB`) VPN server. Verdict: **DECLINED (Cross-border anomaly flagged)**.
4. **High-Ticket Anomaly (\$7,850.00):** Simulates an unprecedented luxury jewellery purchase that deviates heavily from typical spend. Verdict: **DECLINED / ESCALATED (Autoencoder high reconstruction error)**.
5. **Stolen / Frozen Card (\$12.50):** Cardholder has toggled card freeze in mobile app. Verdict: **DECLINED (Immediate Tier 1 fail-safe, 0ms ML overhead)**.

