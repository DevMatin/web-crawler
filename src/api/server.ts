import express from 'express';
import { Dataset, CheerioCrawler, log, Configuration } from 'crawlee';
import { config } from '../config.js';
import { router } from '../routes.js';
import { saveToSupabase } from '../utils/supabase-storage.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', async (req, res) => {
    try {
        const crawlerConfig = new Configuration({
            purgeOnStart: false,
        });
        const dataset = await Dataset.open('crawler-data', { config: crawlerConfig });
        const data = await dataset.getData();
        res.json({
            totalItems: data.items.length,
            totalRequests: data.total,
            datasetId: dataset.id,
        });
    } catch (error) {
        log.error('Fehler beim Abrufen der Statistiken', { error });
        res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const crawlerConfig = new Configuration({
            purgeOnStart: false,
        });
        const dataset = await Dataset.open('crawler-data', { config: crawlerConfig });
        const data = await dataset.getData();
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

        (async () => {
            try {
                log.info('Crawling gestartet', { urls: startUrls, project_id: projectIdNum });

                const crawlerConfig = new Configuration({
                    purgeOnStart: false,
                    defaultDatasetId: 'crawler-data',
                });

                const crawler = new CheerioCrawler({
                    requestHandler: router,
                    maxRequestsPerCrawl: maxRequests,
                    maxConcurrency: config.maxConcurrency,
                    requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
                    navigationTimeoutSecs: config.navigationTimeoutSecs,
                }, crawlerConfig);

                await crawler.run(startUrls);

                const dataset = await crawler.getDataset();
                const data = await dataset.getData();
                
                log.info('Dataset geöffnet', { datasetId: dataset.id });

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
                } else {
                    log.warning('Keine Daten zum Speichern gefunden', { project_id: projectIdNum });
                }
            } catch (error) {
                log.error('Fehler beim asynchronen Crawling', { 
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
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

