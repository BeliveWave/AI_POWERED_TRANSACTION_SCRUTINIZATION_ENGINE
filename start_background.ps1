# Stop any existing instances first
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$portProc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProc) { 
    foreach ($p in $portProc) { 
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue 
    }
}

Start-Sleep -Seconds 1

# 1. Start uvicorn detached in background
$rootDir = "c:\Inshaf\AI_POWERED_TRANSACTION_SCRUTINIZATION_ENGINE"
$backendDir = "$rootDir\backend"
$venvPython = "$backendDir\.venv\Scripts\python.exe"

$backendProc = Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn app.main:app --port 8000 --timeout-keep-alive 5" -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru

Write-Host "Starting backend engine in background (PID: $($backendProc.Id))..."
Start-Sleep -Seconds 4

# 2. Start cloudflared detached in background
$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$logFile = "$rootDir\tunnel_live.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

$tunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://localhost:8000" -RedirectStandardError $logFile -WindowStyle Hidden -PassThru

Write-Host "Starting Cloudflare tunnel in background (PID: $($tunnelProc.Id))..."
Start-Sleep -Seconds 4

# 3. Extract the active URL from the log file
$url = ""
for ($i = 0; $i -lt 12; $i++) {
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $url = $matches[1]
            break
        }
    }
    Start-Sleep -Seconds 1
}

$activeFile = "$rootDir\ACTIVE_LIVE_URL.txt"
if ($url) {
    Set-Content -Path $activeFile -Value $url
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! AI ENGINE IS RUNNING IN WINDOWS BACKGROUND" -ForegroundColor Green
    Write-Host "  YOU CAN NOW SAFELY CLOSE VS CODE!" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Live Public URL:  $url" -ForegroundColor Cyan
    Write-Host "  Saved to file:    ACTIVE_LIVE_URL.txt" -ForegroundColor White
    Write-Host "  Local backend:    http://localhost:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "Tunnel is starting. Please check ACTIVE_LIVE_URL.txt in a few seconds." -ForegroundColor Yellow
}
