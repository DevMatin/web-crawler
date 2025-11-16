-- Verifiziere, dass Projekte korrekt isoliert sind

-- 1. Zeige alle Domains pro Projekt
SELECT 
    project_id,
    COUNT(*) as page_count,
    STRING_AGG(DISTINCT SUBSTRING(url FROM 'https?://([^/]+)'), ', ' ORDER BY SUBSTRING(url FROM 'https?://([^/]+)')) as unique_domains
FROM pages
WHERE project_id IN (1, 2, 4, 5)
GROUP BY project_id
ORDER BY project_id;

-- 2. Detaillierte Ansicht: Welche URLs gehören zu welchem Projekt?
SELECT 
    project_id,
    url,
    title,
    crawled_at
FROM pages
WHERE project_id IN (1, 2, 4, 5)
ORDER BY project_id, crawled_at DESC;

-- 3. Prüfe auf Fehler: URLs die im falschen Projekt gelandet sind
-- Projekt 2 sollte nur gaal-gaal.de haben
SELECT project_id, url
FROM pages
WHERE project_id = 2 
  AND url NOT LIKE '%gaal-gaal.de%';

-- Projekt 5 sollte nur amir-kaffeemann.de haben
SELECT project_id, url
FROM pages
WHERE project_id = 5 
  AND url NOT LIKE '%amir-kaffeemann.de%';

-- 4. Zähle Pages pro Projekt
SELECT 
    p.id as project_id,
    p.name,
    p.domain,
    COUNT(pg.id) as page_count,
    MAX(pg.crawled_at) as last_crawl
FROM projects p
LEFT JOIN pages pg ON p.id = pg.project_id
GROUP BY p.id, p.name, p.domain
ORDER BY p.id;

