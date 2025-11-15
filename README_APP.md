# Web Crawler Anwendung

Produktionsreife Web-Crawler-Anwendung basierend auf Crawlee.

## Features

- ✅ Konfigurierbar über Umgebungsvariablen
- ✅ Docker & Docker Compose Support
- ✅ REST API für Monitoring und Datenabfrage
- ✅ Strukturiertes Logging
- ✅ Fehlerbehandlung
- ✅ TypeScript Support

## Schnellstart

### Lokal

```bash
npm install
cp .env.example .env
npm run start:dev
```

### Mit Docker

```bash
docker-compose up -d
```

## Konfiguration

Alle Einstellungen können über Umgebungsvariablen konfiguriert werden:

- `START_URLS`: Komma-getrennte Liste von Start-URLs
- `ALLOWED_DOMAINS`: Erlaubte Domains für das Crawling
- `MAX_REQUESTS_PER_CRAWL`: Maximale Anzahl von Requests
- `MAX_CONCURRENCY`: Maximale Parallelität
- `LOG_LEVEL`: Log-Level (DEBUG, INFO, WARNING, ERROR)

Siehe `.env.example` für alle Optionen.

## API Endpoints

- `GET /health` - Health Check
- `GET /api/stats` - Crawling-Statistiken
- `GET /api/data?limit=10&offset=0` - Gespeicherte Daten abrufen

## Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anleitung.

## Erweiterungen

Die Anwendung kann einfach erweitert werden:

1. **Weitere Daten extrahieren**: Bearbeite `src/routes.ts`
2. **Neue Crawler-Typen**: Nutze PlaywrightCrawler oder PuppeteerCrawler
3. **Proxy-Support**: Aktiviere ProxyConfiguration in `src/main.ts`
4. **Datenbank-Integration**: Erweitere die API in `src/api/server.ts`

