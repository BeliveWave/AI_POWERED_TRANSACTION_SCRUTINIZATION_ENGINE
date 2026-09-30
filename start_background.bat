@echo off
cd /d %~dp0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start_background.ps1
pause
