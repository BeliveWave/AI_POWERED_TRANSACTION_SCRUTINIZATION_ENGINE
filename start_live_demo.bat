@echo off
title AI Transaction Scrutinization Engine - Launcher
echo ========================================================
echo   AI-POWERED TSE - STARTING ENGINE AND CLOUDFLARE TUNNEL
echo   (This will stay running even if you close VS Code!)
echo ========================================================
echo.

:: 1. Start the FastAPI Backend in a separate window
echo [1/2] Starting FastAPI Backend on port 8000...
cd /d %~dp0\backend
start "TSE-Backend" cmd /k "title TSE-Backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

:: Wait for backend to initialize
timeout /t 5 /nobreak >nul

:: 2. Start Cloudflare Tunnel in a separate window
echo [2/2] Starting Cloudflare Public Tunnel...
cd /d %~dp0
start "TSE-Tunnel" cmd /k "title TSE-Tunnel && echo =================================================== && echo   LOOK FOR THE URL BELOW ENDING WITH: trycloudflare.com && echo   COPY THAT URL INTO VERCEL VITE_API_BASE_URL && echo =================================================== && \"C:\Program Files (x86)\cloudflared\cloudflared.exe\" tunnel --url http://localhost:8000"

echo.
echo ========================================================
echo   SERVICES STARTED SUCCESSFULLY!
echo   You will see two windows on your taskbar:
echo     1. "TSE-Backend"
echo     2. "TSE-Tunnel" (contains your live public URL)
echo.
echo   You can minimize them and safely CLOSE VS Code!
echo   They will keep running in the background.
echo.
echo   To stop everything later, double-click: stop_background.bat
echo ========================================================
echo.
pause
