# Setup-Anleitung

## Schnellstart

1. Dependencies installieren:
```bash
npm install
```

2. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
```

3. Supabase-Konfiguration in `.env` eintragen:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Anwendung starten:
```bash
npm run start:api
```

## n8n Integration

### Webhook konfigurieren

1. HTTP Request Node in n8n erstellen
2. Method: POST
3. URL: `http://your-server:3000/api/crawl`
4. Body (JSON):
```json
{
  "url": "https://example.com",
  "project_id": 1,
  "max_requests": 100
}
```

### Response

Der Endpoint antwortet sofort mit HTTP 202:
```json
{
  "status": "accepted",
  "url": "https://example.com",
  "project_id": 1
}
```

Das Crawling läuft asynchron im Hintergrund und speichert die Daten automatisch in Supabase.

## Docker Deployment

```bash
docker-compose up -d
```

Die API ist dann unter `http://localhost:3000` erreichbar.

