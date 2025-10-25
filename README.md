# AI-Powered Transaction Scrutinization Engine (TSE)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

A real-time, AI-driven middleware service for detecting and preventing fraudulent financial transactions.

---

## 🎯 Core Concept: The "Why"

Traditional fraud detection systems rely on static, hard-coded rules (e.g., "block transactions over $1000"). These systems are brittle, easy for fraudsters to bypass, and often block legitimate customers (high false positives).

Our project moves beyond this outdated model by creating an intelligent, adaptive "detective" that understands context and behavior.

| Traditional Rule-Based System | Our AI-Powered TSE (Middleware) |
| :------------------------------ | :---------------------------------- |
| Asks: "Did this break a rule?" | Asks: "How normal is this behavior?" |
| Static and rigid | Dynamic and adaptive |
| Easily bypassed by fraudsters | Learns new fraud patterns over time |
| High rate of false positives | Nuanced risk scoring to reduce errors|

**Our system is not a consumer-facing app.** It is a **middleware API service** that banks, payment gateways, and e-commerce platforms integrate into their payment processing flow to get an intelligent fraud score for every transaction in real-time.

---

## ✨ Key Features

-   **Real-Time Fraud Scoring:** Analyzes transactions in under 200ms and returns a fraud probability score (0.0 to 1.0).
-   **Explainable AI (XAI):** Provides human-readable "reason codes" for every decision (e.g., `Unusual geolocation`, `High transaction amount`).
-   **Admin Dashboard:** A comprehensive web interface to monitor live transactions, review flagged cases, analyze fraud trends, and configure system settings.
-   **Behavioral Profiling:** Creates dynamic profiles for customers to detect anomalies against their normal spending patterns.
-   **Continuous Learning:** The model is designed to be retrained on new data to adapt to emerging fraud tactics.
-   **Configurable Rules & Thresholds:** Allows administrators to fine-tune the fraud sensitivity and add custom rules alongside the AI model.

---

## 🛠️ Technology Stack

-   **Backend:** Python, FastAPI
-   **AI / Machine Learning:** Scikit-learn, XGBoost, Pandas, NumPy
-   **Frontend (Dashboard):** React.js, Chart.js, TailwindCSS
-   **Database:** PostgreSQL (for transaction records), Redis (for real-time feature caching)
-   **DevOps:** Docker, GitHub Actions for CI/CD

---

## 🚀 Getting Started

This project is containerized using Docker for easy setup and a consistent development environment.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository.git
    cd your-repository
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root directory and copy the contents of `.env.example`.

3.  **Run the application:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the application:**
    -   **Frontend Dashboard:** `http://localhost:3000`
    -   **Backend API Docs:** `http://localhost:8000/docs`

---

## 🧑‍💻 Our Team

This project is being developed as part of the EC5406 curriculum by:

| Member | Role | GitHub Profile |
| :--- | :--- | :--- |
| **Suwaathmi** | Project Manager & Frontend Lead | `[Link]` |
| **Rajaaie** | AI/ML Lead & Backend Developer | `[Link]` |
| **Nusair** | Full-Stack & API Lead | `[Link]` |
| **Tharukshan**| Backend & ML Engineer | `[Link]` |

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.