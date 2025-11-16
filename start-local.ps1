# Lokaler Server Start

Write-Host "Stoppe laufende Server..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Starte API Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run start:api"

Write-Host ""
Write-Host "Server startet in neuem Fenster..." -ForegroundColor Cyan
Write-Host "Warte 5 Sekunden..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Teste Health Check:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/health -ErrorAction Stop
    Write-Host "✓ Server läuft!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Server antwortet nicht" -ForegroundColor Red
}

Write-Host ""
Write-Host "Teste Status Endpoint:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/crawl/status?project_id=2" -ErrorAction Stop
    Write-Host "✓ Status Endpoint funktioniert!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Status Endpoint nicht verfügbar" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

