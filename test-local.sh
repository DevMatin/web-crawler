#!/bin/bash

echo "=== Lokaler Test für Web Crawler ==="
echo ""
echo "1. Dependencies installieren..."
npm install

echo ""
echo "2. API Server starten (in neuem Terminal):"
echo "   npm run start:api"
echo ""
echo "3. Dann in diesem Terminal testen:"
echo ""
echo "   Health Check:"
echo "   curl http://localhost:3000/health"
echo ""
echo "   Crawling starten:"
echo "   curl -X POST http://localhost:3000/api/crawl -H 'Content-Type: application/json' -d '{\"url\": \"https://gaal-gaal.de/\", \"project_id\": 2, \"max_requests\": 50}'"
echo ""
echo "   Status prüfen:"
echo "   curl 'http://localhost:3000/api/crawl/status?project_id=2'"
echo ""

