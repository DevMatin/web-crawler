# cURL Beispiele für Web Crawler API

## Projekte hinzufügen

### Linux/Mac (Bash)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mein Projekt",
    "domain": "example.com"
  }'
```

### Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/projects `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"name": "Mein Projekt", "domain": "example.com"}'
```

### Windows (cmd mit curl.exe)
```cmd
curl.exe -X POST http://localhost:3000/api/projects ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Mein Projekt\", \"domain\": \"example.com\"}"
```

## Projekte abrufen

```bash
curl http://localhost:3000/api/projects
```

## Crawling starten

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "project_id": 1,
    "max_requests": 100
  }'
```

## Status prüfen

```bash
curl "http://localhost:3000/api/crawl/status?project_id=1"
```

## Health Check

```bash
curl http://localhost:3000/health
```

