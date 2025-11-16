#!/bin/bash

# Template zum Hinzufügen von Projekten
# Verwendung: ./add-project.sh "Projekt Name" "domain.com"

PROJECT_NAME="${1:-Mein Projekt}"
DOMAIN="${2:-example.com}"
API_URL="${3:-http://localhost:3000}"

echo "=== Projekt hinzufügen ==="
echo "Name: $PROJECT_NAME"
echo "Domain: $DOMAIN"
echo "API: $API_URL"
echo ""

curl -X POST "$API_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"domain\": \"$DOMAIN\"
  }"

echo ""
echo ""

