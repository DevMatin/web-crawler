# Lokaler Test für Web Crawler

Write-Host "=== Lokaler Test für Web Crawler ===" -ForegroundColor Green
Write-Host ""

# Prüfe ob .env existiert
if (-not (Test-Path ".env")) {
    Write-Host "WARNUNG: .env Datei nicht gefunden!" -ForegroundColor Yellow
    Write-Host "Erstelle .env mit SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "1. API Server starten (in neuem Terminal/PowerShell):" -ForegroundColor Cyan
Write-Host "   npm run start:api" -ForegroundColor White
Write-Host ""
Write-Host "2. Dann in diesem Terminal testen:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Health Check:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host "   Crawling starten:" -ForegroundColor Yellow
Write-Host '   curl -X POST http://localhost:3000/api/crawl -H "Content-Type: application/json" -d ''{\"url\": \"https://gaal-gaal.de/\", \"project_id\": 2, \"max_requests\": 50}''' -ForegroundColor White
Write-Host ""
Write-Host "   Status prüfen:" -ForegroundColor Yellow
Write-Host "   curl 'http://localhost:3000/api/crawl/status?project_id=2'" -ForegroundColor White
Write-Host ""

