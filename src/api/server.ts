import express from 'express';
import { Dataset, CheerioCrawler, log, Configuration, RequestQueue } from 'crawlee';
import { config } from '../config.js';
import { router } from '../routes.js';
import { saveToSupabase } from '../utils/supabase-storage.js';
import { readDatasetFromFilesystem } from '../utils/dataset-reader.js';
import { getSupabaseClient } from './supabase.js';

const app = express();
app.use(express.json());

Configuration.getGlobalConfig().set('purgeOnStart', true);

if (config.storageDir) {
    process.env.CRAWLEE_STORAGE_DIR = config.storageDir;
}

let sharedDataset: Dataset | null = null;

const runningCrawls = new Map<number, { startTime: Date; urls: string[] }>();

async function getSharedDataset(): Promise<Dataset> {
    if (!sharedDataset) {
        sharedDataset = await Dataset.open();
    }
    return sharedDataset;
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', async (req, res) => {
    try {
        const data = await readDatasetFromFilesystem();
        log.info('Stats abgerufen', { items: data.items.length, total: data.total });
        res.json({
            totalItems: data.items.length,
            totalRequests: data.total,
            datasetId: 'default',
        });
    } catch (error) {
        log.error('Fehler beim Abrufen der Statistiken', { error });
        res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const data = await readDatasetFromFilesystem();
        const limit = parseInt(req.query.limit as string || '100', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);
        
        res.json({
            items: data.items.slice(offset, offset + limit),
            total: data.items.length,
            limit,
            offset,
        });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
});

app.get('/api/crawl/status', async (req, res) => {
    try {
        const projectId = req.query.project_id;
        
        if (!projectId) {
            return res.status(400).json({ error: 'project_id ist erforderlich' });
        }

        const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : Number(projectId);
        if (isNaN(projectIdNum)) {
            return res.status(400).json({ error: 'project_id muss eine Zahl sein' });
        }

        const supabaseClient = getSupabaseClient();
        
        const { count, error } = await supabaseClient
            .from('pages')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectIdNum);

        if (error) {
            log.error('Fehler beim Abrufen des Status', { error });
            return res.status(500).json({ error: 'Fehler beim Abrufen des Status' });
        }

        const { data: recentPages } = await supabaseClient
            .from('pages')
            .select('crawled_at')
            .eq('project_id', projectIdNum)
            .order('crawled_at', { ascending: false })
            .limit(1)
            .single();

        const isRunning = runningCrawls.has(projectIdNum);
        const lastCrawledAt = recentPages?.crawled_at ? new Date(recentPages.crawled_at) : null;
        const now = new Date();
        
        let status: 'pending' | 'running' | 'completed' = 'pending';
        
        if (isRunning) {
            status = 'running';
        } else if (count && count > 0) {
            if (lastCrawledAt && (now.getTime() - lastCrawledAt.getTime()) < 300000) {
                status = 'running';
            } else {
                status = 'completed';
            }
        }

        res.json({
            project_id: projectIdNum,
            total_pages: count || 0,
            last_crawled_at: recentPages?.crawled_at || null,
            status,
            is_running: isRunning
        });
    } catch (error) {
        log.error('Fehler im /api/crawl/status Endpoint', { error });
        res.status(500).json({
            error: 'Fehler beim Abrufen des Status',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name, domain } = req.body;

        if (!name || !domain) {
            return res.status(400).json({ error: 'name und domain sind erforderlich' });
        }

        let normalizedDomain = domain.trim();
        
        try {
            const url = new URL(normalizedDomain.startsWith('http') ? normalizedDomain : `https://${normalizedDomain}`);
            normalizedDomain = url.hostname;
        } catch {
            normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
        }

        const supabaseClient = getSupabaseClient();
        
        const { data, error } = await supabaseClient
            .from('projects')
            .insert({
                name,
                domain: normalizedDomain,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                log.warning('Domain existiert bereits', { domain: normalizedDomain, error });
                return res.status(409).json({ 
                    error: 'Domain existiert bereits',
                    domain: normalizedDomain,
                    hint: 'Prüfe bestehende Projekte mit GET /api/projects'
                });
            }
            log.error('Fehler beim Anlegen des Projekts', { error, domain: normalizedDomain });
            return res.status(500).json({ 
                error: 'Fehler beim Anlegen des Projekts',
                details: error.message 
            });
        }

        res.status(201).json({
            success: true,
            project: data,
        });
    } catch (error) {
        log.error('Fehler im /api/projects Endpoint', { error });
        res.status(500).json({
            error: 'Fehler beim Anlegen des Projekts',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

app.get('/api/projects', async (req, res) => {
    try {
        const supabaseClient = getSupabaseClient();
        
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            log.error('Fehler beim Abrufen der Projekte', { error });
            return res.status(500).json({ error: 'Fehler beim Abrufen der Projekte' });
        }

        res.json({
            projects: data || [],
        });
    } catch (error) {
        log.error('Fehler im /api/projects GET Endpoint', { error });
        res.status(500).json({
            error: 'Fehler beim Abrufen der Projekte',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

app.post('/api/crawl', async (req, res) => {
    try {
        const { url, urls, project_id, max_requests } = req.body;

        if (!project_id) {
            return res.status(400).json({ error: 'project_id ist erforderlich' });
        }

        const projectIdNum = typeof project_id === 'string' ? parseInt(project_id, 10) : project_id;
        if (isNaN(projectIdNum)) {
            return res.status(400).json({ error: 'project_id muss eine Zahl sein' });
        }

        const startUrls = urls || (url ? [url] : []);
        if (startUrls.length === 0) {
            return res.status(400).json({ error: 'url oder urls ist erforderlich' });
        }

        const maxRequests = max_requests || config.maxRequestsPerCrawl;

        res.status(202).json({
            status: 'accepted',
            url: startUrls[0],
            urls: startUrls,
            project_id: projectIdNum,
        });

        runningCrawls.set(projectIdNum, { startTime: new Date(), urls: startUrls });

        (async () => {
            try {
                log.info('Crawling gestartet', { urls: startUrls, project_id: projectIdNum });

                const requestQueue = await RequestQueue.open();
                await requestQueue.drop();
                log.info('Request Queue gelöscht');

                const oldDataset = await Dataset.open();
                await oldDataset.drop();
                log.info('Dataset gelöscht');

                const crawler = new CheerioCrawler({
                    requestHandler: router,
                    maxRequestsPerCrawl: maxRequests,
                    maxConcurrency: config.maxConcurrency,
                    requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
                    navigationTimeoutSecs: config.navigationTimeoutSecs,
                });

                await crawler.run(startUrls);

                const dataset = await crawler.getDataset();
                const data = await dataset.getData();
                
                log.info('Dataset geöffnet', { datasetId: dataset.id, itemsCount: data.items.length });

                log.info(`Crawling abgeschlossen. ${data.items.length} Einträge gefunden.`, {
                    project_id: projectIdNum,
                    datasetId: dataset.id,
                });

                if (data.items.length > 0) {
                    for (const item of data.items) {
                        const result = await saveToSupabase(item as import('../utils/supabase-storage.js').CrawledItem, projectIdNum);
                        if (!result.success) {
                            log.error(`Fehler beim Speichern von ${item.url}`, { error: result.error });
                        }
                    }
                    log.info('Alle Daten in Supabase gespeichert', { project_id: projectIdNum });
                    
                    await dataset.drop();
                    log.info('Dataset nach Speicherung gelöscht');
                } else {
                    log.warning('Keine Daten zum Speichern gefunden', { project_id: projectIdNum });
                }
            } catch (error) {
                log.error('Fehler beim asynchronen Crawling', { 
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
            } finally {
                runningCrawls.delete(projectIdNum);
                log.info('Crawling-Job beendet', { project_id: projectIdNum });
            }
        })();
    } catch (error) {
        log.error('Fehler im /api/crawl Endpoint', { error });
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Fehler beim Starten des Crawlings',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
});

app.listen(config.port, () => {
    console.log(`API-Server läuft auf Port ${config.port}`);
});

