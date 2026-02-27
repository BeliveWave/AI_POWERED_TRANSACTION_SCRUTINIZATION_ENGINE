# 🚀 Complete Setup Guide

This guide provides step-by-step instructions for setting up the AI-Powered Transaction Scrutinization Engine on your local machine.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Optional: Simulator Setup](#optional-simulator-setup)
8. [Quick Reference Commands](#quick-reference-commands)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure the following software is installed on your machine:

| Software | Version | Download Link |
|----------|---------|---------------|
| Python | 3.8+ | https://www.python.org/downloads/ |
| Node.js | 16+ | https://nodejs.org/ |
| PostgreSQL | 12+ | https://www.postgresql.org/download/ |
| Git | Latest | https://git-scm.com/downloads |

### Verify Installations

```bash
# Check Python version
python --version

# Check Node.js and npm
node --version
npm --version

# Check PostgreSQL
psql --version

# Check Git
git --version
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE.git
cd AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
```

---

## Database Setup

### 2. Start PostgreSQL Service

**Windows:**
- Open Services (`services.msc`) and start "PostgreSQL" service
- Or use: `pg_ctl start`

**Linux:**
```bash
sudo systemctl start postgresql
```

**Mac:**
```bash
brew services start postgresql
```

### 3. Create Database and User

Open PostgreSQL command line:
```bash
# Windows/Mac/Linux
psql -U postgres
```

Run the following SQL commands:
```sql
-- Create the database
CREATE DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE;

-- Create database user (optional but recommended)
CREATE USER bank_app_user WITH PASSWORD 'StrongPassword@123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE TO bank_app_user;

-- Exit psql
\q
```

---

## Backend Setup

### 4. Navigate to Backend Directory

```bash
cd backend
```

### 5. Create Virtual Environment

**Windows:**
```powershell
python -m venv .venv
```

**Linux/Mac:**
```bash
python3 -m venv .venv
```

### 6. Activate Virtual Environment

**Windows PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**
```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

✅ **Verification:** Your terminal prompt should now show `(.venv)`

### 7. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 8. Create Environment Configuration

**Copy the example file:**
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**Edit `.env` file with your configuration:**
```env
DATABASE_URL=postgresql://bank_app_user:StrongPassword@123@localhost:5432/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
SECRET_KEY=<GENERATE_A_SECRET_KEY>
ACCESS_TOKEN_EXPIRE_MINUTES=15
ALGORITHM=HS256
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and replace `<GENERATE_A_SECRET_KEY>` in your `.env` file.

### 9. Initialize Database Tables

```bash
python -c "from app.core.database import engine, Base; from app.models import user, customer, transaction; Base.metadata.create_all(bind=engine)"
```

✅ **Verification:** You should see database tables created without errors.

---

## Frontend Setup

### 10. Open New Terminal

Keep the backend terminal open, and open a **new terminal window**.

### 11. Navigate to Frontend Directory

```bash
cd frontend
```

### 12. Install Node.js Dependencies

```bash
npm install
```

This may take a few minutes.

---

## Running the Application

### 13. Start Backend Server

In the **backend terminal** (with virtual environment activated):

```bash
# Simple command (when venv is active)
uvicorn app.main:app --reload --port 8000

# Or full path (works without activation)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

✅ **Verification:** 
- Backend should start on `http://localhost:8000`
- Visit `http://localhost:8000/health` - Should return `{"status": "healthy"}`
- Visit `http://localhost:8000/docs` - Should show API documentation

### 14. Start Frontend Server

In the **frontend terminal**:

```bash
npm run dev
```

✅ **Verification:**
- Frontend should start on `http://localhost:5173`
- Visit `http://localhost:5173` - Should show the login page

---

## Optional: Simulator Setup

### 15. Run Transaction Simulator

**Open a third terminal:**

```bash
cd Simulator

# Activate virtual environment (Windows PowerShell)
..\.venv\Scripts\Activate.ps1

# Run simulator
python simlulator.py
```

**Note:** The filename is `simlulator.py` (typo in original filename).

---

## Quick Reference Commands

### Daily Startup (After Initial Setup)

**Terminal 1 - Backend:**
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Stopping the Application

- Press `Ctrl + C` in each terminal to stop the servers

### Updating Dependencies

**Backend:**
```bash
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## Troubleshooting

### ❌ Database Connection Error

**Error:** `FATAL: database "AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE" does not exist`

**Solution:**
```sql
-- Connect to PostgreSQL and run:
CREATE DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE;
```

---

### ❌ Virtual Environment Not Activating

**Windows PowerShell Error:** "Execution of scripts is disabled"

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### ❌ Port Already in Use

**Error:** `Address already in use: 8000`

**Solution 1:** Kill the process using the port
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Solution 2:** Use a different port
```bash
uvicorn app.main:app --reload --port 8001
```

---

### ❌ Module Not Found Error

**Error:** `ModuleNotFoundError: No module named 'X'`

**Solution:**
1. Ensure virtual environment is activated (`(.venv)` should show in prompt)
2. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

### ❌ Frontend Build Errors

**Error:** `Cannot find module` or dependency errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json  # Linux/Mac
# OR
rmdir /s node_modules                  # Windows
del package-lock.json                  # Windows

npm install
```

---

### ❌ PostgreSQL Not Running

**Check if PostgreSQL is running:**

**Windows:**
```powershell
Get-Service postgresql*
```

**Linux:**
```bash
sudo systemctl status postgresql
```

**Mac:**
```bash
brew services list
```

**Start PostgreSQL:**
```bash
# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql

# Windows - Start from Services or:
pg_ctl start
```

---

### ❌ Permission Issues with Python Packages

**Windows users may need:**
- Install [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

**Linux users may need:**
```bash
sudo apt-get install python3-dev libpq-dev
```

**Mac users may need:**
```bash
brew install postgresql
```

---

## 🎯 Verification Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Python 3.8+ installed and verified
- [ ] Node.js 16+ installed and verified
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Repository cloned
- [ ] Virtual environment created and activated
- [ ] Backend dependencies installed
- [ ] `.env` file created with proper configuration
- [ ] Database tables initialized
- [ ] Frontend dependencies installed
- [ ] Backend server starts without errors (`http://localhost:8000/health` returns OK)
- [ ] API documentation accessible (`http://localhost:8000/docs`)
- [ ] Frontend starts without errors (`http://localhost:5173`)
- [ ] Can register and login a test user

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the error message carefully
2. Search for the error in the project issues
3. Verify all prerequisites are installed correctly
4. Ensure you're in the correct directory for each command
5. Check that virtual environment is activated for Python commands

---

## 🎉 Success!

If you've completed all steps, you should now have:

- ✅ Backend API running on `http://localhost:8000`
- ✅ Frontend dashboard running on `http://localhost:5173`
- ✅ PostgreSQL database configured and connected
- ✅ Ability to register users and test the system

**Next Steps:**
- Explore the API documentation at `/docs`
- Register a test user via the frontend
- Run the transaction simulator to generate test data
- Review the codebase and start contributing!
