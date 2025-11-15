# Deployment-Anleitung

## Lokale Entwicklung

1. Abhängigkeiten installieren:
```bash
npm install
```

2. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
```

3. Entwicklungsserver starten:
```bash
npm run start:dev
```

## Docker Deployment

### Mit Docker Compose (empfohlen)

1. Umgebungsvariablen setzen:
```bash
export START_URLS=https://example.com
export ALLOWED_DOMAINS=example.com
```

2. Container starten:
```bash
docker-compose up -d
```

3. Logs anzeigen:
```bash
docker-compose logs -f crawler
```

4. API aufrufen:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/stats
```

### Mit Docker direkt

1. Image bauen:
```bash
docker build -t web-crawler .
```

2. Container starten:
```bash
docker run -d \
  --name web-crawler \
  -e START_URLS=https://example.com \
  -e ALLOWED_DOMAINS=example.com \
  -v $(pwd)/storage:/app/storage \
  web-crawler
```

## Server Deployment

### Voraussetzungen
- Node.js 18+ oder Docker
- Mindestens 2GB RAM
- 10GB freier Speicherplatz

### Option 1: Direkt mit Node.js

1. Code auf Server kopieren:
```bash
scp -r . user@server:/opt/web-crawler
```

2. Auf Server einloggen und installieren:
```bash
cd /opt/web-crawler
npm install
npm run build
```

3. Mit PM2 starten:
```bash
npm install -g pm2
pm2 start dist/main.js --name web-crawler
pm2 save
pm2 startup
```

### Option 2: Mit Docker auf Server

1. Docker installieren (falls nicht vorhanden)
2. Code auf Server kopieren
3. `docker-compose up -d` ausführen

### Option 3: Mit Systemd Service

Erstelle `/etc/systemd/system/web-crawler.service`:

```ini
[Unit]
Description=Web Crawler Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/web-crawler
ExecStart=/usr/bin/node dist/main.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Dann:
```bash
sudo systemctl daemon-reload
sudo systemctl enable web-crawler
sudo systemctl start web-crawler
```

## Monitoring

- Health Check: `GET /health`
- Statistiken: `GET /api/stats`
- Daten abrufen: `GET /api/data?limit=10&offset=0`

## Troubleshooting

- Logs prüfen: `docker-compose logs crawler`
- Storage-Verzeichnis prüfen: `ls -la storage/`
- Container neu starten: `docker-compose restart`

