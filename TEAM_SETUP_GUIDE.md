# 🚀 Quick Team Member Setup Guide

**For Sprint 3 - AI-Powered Transaction Scrutinization Engine**

This is a simplified guide for team members to get the project running on their machine.

---

## ⚡ Quick Setup (15 minutes)

### Prerequisites Checklist
- [ ] Python 3.8 or higher installed
- [ ] Node.js 16 or higher installed  
- [ ] PostgreSQL 12 or higher installed
- [ ] Git installed

---

## 🔧 Step-by-Step Setup

### **STEP 1: Clone the Repository**

```bash
git clone <repository-url>
cd AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
```

---

### **STEP 2: Database Setup (5 minutes)**

#### A. Start PostgreSQL

**Windows:** Open Services → Start PostgreSQL service  
**Mac/Linux:** `sudo systemctl start postgresql` or `brew services start postgresql`

#### B. Create Database

Open PostgreSQL terminal:
```bash
psql -U postgres
```

Then run these commands:
```sql
CREATE DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE;
CREATE USER bank_app_user WITH PASSWORD 'YourPassword123';
GRANT ALL PRIVILEGES ON DATABASE AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE TO bank_app_user;
\q
```

**✅ Done!** Database is ready.

---

### **STEP 3: Backend Setup (5 minutes)**

Open Terminal 1:

```bash
# 1. Go to backend folder
cd backend

# 2. Create virtual environment
python -m venv .venv

# 3. Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env
```

#### Edit `.env` file:
Update these lines in the `.env` file:
```env
DATABASE_URL=postgresql://bank_app_user:YourPassword123@localhost:5432/AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE
SECRET_KEY=your-secret-key-here-change-this-to-random-string
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste it as your SECRET_KEY in `.env`

#### Initialize Database Tables:
```bash
python -c "from app.core.database import engine, Base; from app.models import user, customer, transaction; Base.metadata.create_all(bind=engine)"
```

**✅ Done!** Backend is configured.

---

### **STEP 4: Frontend Setup (3 minutes)**

Open Terminal 2:

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install
```

**✅ Done!** Frontend is configured.

---

### **STEP 5: Run the Application**

#### Terminal 1 - Backend:
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Activate venv if not already active
uvicorn app.main:app --reload --port 8000
```

**Expected output:** `Uvicorn running on http://127.0.0.1:8000`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Expected output:** `Local: http://localhost:5173/`

---

## ✅ Verification

### Check if everything works:

1. **Backend Health Check:**
   - Open browser: `http://localhost:8000/health`
   - Should show: `{"status": "healthy"}`

2. **API Documentation:**
   - Open browser: `http://localhost:8000/docs`
   - Should show Swagger API docs

3. **Frontend:**
   - Open browser: `http://localhost:5173`
   - Should show Login page

4. **Create Test User:**
   - Click "Register" on login page
   - Fill in the form and create account
   - Login with your credentials
   - You should see the Dashboard

---

## 🎯 Quick Commands Reference

### Daily Startup

**Terminal 1 (Backend):**
```bash
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Stop Servers
Press `Ctrl + C` in each terminal

---

## 🆘 Common Issues & Solutions

### ❌ Issue: "Database does not exist"
**Solution:** Go to STEP 2B and create the database

### ❌ Issue: "Port 8000 already in use"
**Solution:** 
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <number> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### ❌ Issue: "Cannot activate virtual environment"
**Solution (Windows PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Issue: "ModuleNotFoundError"
**Solution:**
1. Make sure virtual environment is activated `(.venv)` should appear in terminal
2. Run: `pip install -r requirements.txt`

### ❌ Issue: Frontend errors after `npm install`
**Solution:**
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📂 Project Structure

```
AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # Main application
│   │   ├── models/      # Database models
│   │   ├── routers/     # API endpoints
│   │   └── ...
│   ├── .env             # Configuration (create this)
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Dashboard, Login, etc.
│   │   ├── components/  # Reusable components
│   │   └── ...
│   └── package.json     # Node dependencies
├── docs/                # Documentation
├── Simulator/           # Transaction simulator
└── README.md
```

---

## 🔑 Key Features Implemented

### Sprint 3 Features:
✅ **Session Management**
- 15-minute automatic timeout
- Activity tracking (mouse, keyboard, scroll)
- Warning modal 2 minutes before logout
- Fresh login required on browser restart

✅ **Security**
- JWT authentication
- 2FA support
- Password hashing
- Role-based access

✅ **Documentation**
- UML Class Diagrams
- Use Case Diagrams
- ER Diagrams
- Sequence Diagrams
- System Architecture

---

## 📖 Additional Documentation

For detailed information, check:
- `SETUP.md` - Comprehensive setup guide
- `README.md` - Project overview
- `docs/` - Technical documentation
- `SPRINT_3_QUICK_REFERENCE.md` - Sprint 3 features

---

## 🎉 You're Ready!

Once you complete all steps:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`

**Happy Coding! 🚀**

If you encounter any issues not listed here, check `SETUP.md` for more detailed troubleshooting or ask the team.
