# Test: Projekt hinzufügen

$body = @{
    name = "Ostanes Engineering"
    domain = "ostanes-engineering-new.com"
} | ConvertTo-Json

Write-Host "Teste Projekt hinzufügen..." -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/api/projects `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host "Erfolg!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Fehler:" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    } else {
        Write-Host $_.Exception.Message
    }
}

