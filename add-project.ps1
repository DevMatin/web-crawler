# PowerShell Template zum Hinzufügen von Projekten
# Verwendung: .\add-project.ps1 -Name "Projekt Name" -Domain "domain.com" -ApiUrl "http://localhost:3000"

param(
    [string]$Name = "Mein Projekt",
    [string]$Domain = "example.com",
    [string]$ApiUrl = "http://localhost:3000"
)

Write-Host "=== Projekt hinzufügen ===" -ForegroundColor Green
Write-Host "Name: $Name" -ForegroundColor Cyan
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "API: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

$body = @{
    name = $Name
    domain = $Domain
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/projects" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host "✓ Erfolg!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Fehler:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

