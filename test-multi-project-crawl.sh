#!/bin/bash

echo "=== Test: Multi-Projekt Crawling ohne Datenvermischung ==="
echo ""

echo "Schritt 1: Crawl Projekt 2 (gaal-gaal.de)"
echo "----------------------------------------"
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gaal-gaal.de",
    "project_id": 2,
    "max_requests": 5
  }'
echo -e "\n"

echo "Warte 10 Sekunden..."
sleep 10

echo ""
echo "Schritt 2: Crawl Projekt 5 (amir-kaffeemann.de)"
echo "-----------------------------------------------"
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amir-kaffeemann.de",
    "project_id": 5,
    "max_requests": 5
  }'
echo -e "\n"

echo "Warte 10 Sekunden..."
sleep 10

echo ""
echo "Schritt 3: Status Projekt 2 prüfen"
echo "-----------------------------------"
curl "http://localhost:3000/api/crawl/status?project_id=2"
echo -e "\n"

echo ""
echo "Schritt 4: Status Projekt 5 prüfen"
echo "-----------------------------------"
curl "http://localhost:3000/api/crawl/status?project_id=5"
echo -e "\n"

echo ""
echo "=== Test abgeschlossen ==="
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe in Supabase, ob Projekt 2 nur gaal-gaal.de Links hat"
echo "2. Prüfe in Supabase, ob Projekt 5 nur amir-kaffeemann.de Links hat"
echo "3. SQL Query zum Testen:"
echo ""
echo "   SELECT project_id, COUNT(*), STRING_AGG(DISTINCT SUBSTRING(url FROM 'https?://([^/]+)'), ', ') as domains"
echo "   FROM pages"
echo "   WHERE project_id IN (2, 5)"
echo "   GROUP BY project_id;"
echo ""

