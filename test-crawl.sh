#!/bin/bash

# Test-Crawling für gaal-gaal.de - Projekt 2

echo "=== 1. Crawling starten ==="
curl -X POST http://85.215.209.209:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gaal-gaal.de/",
    "project_id": 2,
    "max_requests": 50
  }'

echo -e "\n\n=== 2. Status prüfen (warten 5 Sekunden) ==="
sleep 5

curl "http://85.215.209.209:3000/api/crawl/status?project_id=2"

echo -e "\n\n=== 3. Nochmal Status prüfen (nach 10 Sekunden) ==="
sleep 10

curl "http://85.215.209.209:3000/api/crawl/status?project_id=2"

echo -e "\n\n=== Fertig! ==="

