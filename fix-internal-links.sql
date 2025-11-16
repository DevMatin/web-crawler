-- Script zum Finden und Korrigieren von falsch zugewiesenen internal_links

-- 1. Finde Links, die zu falschen Projekten gehören
-- (Links, deren from_page zu einem anderen Projekt gehört als die project_id des Links)
SELECT 
    il.id,
    il.project_id as link_project_id,
    p_from.project_id as from_page_project_id,
    p_to.project_id as to_page_project_id,
    il.from_page,
    il.to_page
FROM internal_links il
JOIN pages p_from ON il.from_page = p_from.id
LEFT JOIN pages p_to ON il.to_page = p_to.id
WHERE il.project_id != p_from.project_id
   OR (il.to_page IS NOT NULL AND p_to.project_id != il.project_id);

-- 2. Korrigiere Links: Setze project_id auf die project_id der from_page
UPDATE internal_links il
SET project_id = p_from.project_id
FROM pages p_from
WHERE il.from_page = p_from.id
  AND il.project_id != p_from.project_id;

-- 3. Lösche Links, deren to_page zu einem anderen Projekt gehört
DELETE FROM internal_links il
USING pages p_to
WHERE il.to_page = p_to.id
  AND il.project_id != p_to.project_id
  AND p_to.id IS NOT NULL;

-- 4. Prüfe Ergebnis
SELECT 
    project_id,
    COUNT(*) as link_count
FROM internal_links
GROUP BY project_id
ORDER BY project_id;

