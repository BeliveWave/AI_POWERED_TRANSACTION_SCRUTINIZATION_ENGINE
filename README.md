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

Follow this comprehensive guide to set up and run the project on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** and npm ([Download](https://nodejs.org/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE.git
cd AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
```

---

### Step 2: Database Setup

1. **Start PostgreSQL** service on your machine

2. **Create the database** (using psql or pgAdmin):
   ```sql
   CREATE DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE;
   ```

3. **Create a database user** (optional but recommended):
   ```sql
   CREATE USER bank_app_user WITH PASSWORD 'StrongPassword@123';
   GRANT ALL PRIVILEGES ON DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE TO bank_app_user;
   ```

---

### Step 3: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - **Linux/Mac:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create a `.env` file** in the `backend` directory:
   ```bash
   # Windows
   type nul > .env
   
   # Linux/Mac
   touch .env
   ```

6. **Add the following configuration** to `.env`:
   ```env
   DATABASE_URL=postgresql://bank_app_user:StrongPassword@123@localhost:5432/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
   SECRET_KEY=your-secret-key-here-change-this-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   ALGORITHM=HS256
   ```
   
   **Important:** Replace `your-secret-key-here-change-this-in-production` with a secure random string. Generate one using:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

7. **Initialize the database tables:**
   ```bash
   # From the backend directory
   python -c "from app.core.database import engine, Base; from app.models import user, customer, transaction; Base.metadata.create_all(bind=engine)"
   ```

8. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   
   The backend API will be available at `http://localhost:8000`

---

### Step 4: Frontend Setup

1. **Open a new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173` (Vite default port)

---

### Step 5: Verify Installation

1. **Backend API Documentation:** Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI)

2. **Test Backend Health:** Visit `http://localhost:8000/health` - Should return `{"status": "healthy"}`

3. **Frontend Dashboard:** Visit `http://localhost:5173` - You should see the login page

4. **Create a test user:**
   - Use the API docs at `/docs` or the frontend register page
   - Password must meet security requirements (min 8 chars, uppercase, lowercase, number, special char)

---

### Step 6: Running the Transaction Simulator (Optional)

1. **Navigate to the Simulator directory:**
   ```bash
   cd Simulator
   ```

2. **Run the simulator:**
   ```bash
   python simlulator.py
   ```
   
   Note: The simulator requires the backend to be running.

---

## 🔧 Quick Start (After Initial Setup)

For subsequent runs, you only need to:

1. **Activate virtual environment** (if not already activated):
   ```bash
   cd backend
   .\.venv\Scripts\Activate.ps1  # Windows PowerShell
   ```

2. **Start backend** (in backend directory with venv active):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. **Start frontend** (in a new terminal, from frontend directory):
   ```bash
   npm run dev
   ```

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready` (Linux/Mac) or check Services on Windows
- Check database credentials in `.env` match your PostgreSQL setup
- Ensure the database exists: `psql -l` to list databases

### Module Import Errors
- Ensure virtual environment is activated (you should see `(.venv)` in your terminal)
- Reinstall dependencies: `pip install -r requirements.txt`

### Port Already in Use
- Backend: Change port in uvicorn command: `--port 8001`
- Frontend: Vite will auto-increment if 5173 is busy

### Python Package Installation Fails
- Upgrade pip: `python -m pip install --upgrade pip`
- On Windows, you may need [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) for some packages

---

## 📚 API Documentation

Once the backend is running:
- **Swagger UI:** `http://localhost:8000/docs` - Interactive API testing
- **ReDoc:** `http://localhost:8000/redoc` - Alternative API documentation

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