@echo off
echo ========================================================
echo   Stopping AI Engine and Cloudflare Background Services
echo ========================================================
echo.

taskkill /F /IM cloudflared.exe >nul 2>&1
echo [OK] Cloudflare Tunnel stopped.

powershell -NoProfile -Command "$ports = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($ports) { foreach ($p in $ports) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } }"
echo [OK] Backend Engine (Port 8000) stopped.

echo.
echo ========================================================
echo   All background services have been stopped.
echo ========================================================
echo.
pause
