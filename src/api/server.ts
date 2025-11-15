import express from 'express';
import { Dataset, CheerioCrawler, log } from 'crawlee';
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
        const dataset = await Dataset.open();
        const data = await dataset.getData();
        res.json({
            totalItems: data.items.length,
            totalRequests: data.total,
        });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const dataset = await Dataset.open();
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

        const startUrls = urls || (url ? [url] : []);
        if (startUrls.length === 0) {
            return res.status(400).json({ error: 'url oder urls ist erforderlich' });
        }

        const maxRequests = max_requests || config.maxRequestsPerCrawl;

        res.status(202).json({
            status: 'accepted',
            url: startUrls[0],
            urls: startUrls,
            project_id,
        });

        (async () => {
            try {
                log.info('Crawling gestartet', { urls: startUrls, project_id });

                const crawler = new CheerioCrawler({
                    requestHandler: router,
                    maxRequestsPerCrawl: maxRequests,
                    maxConcurrency: config.maxConcurrency,
                    requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
                    navigationTimeoutSecs: config.navigationTimeoutSecs,
                });

                await crawler.run(startUrls);

                const dataset = await Dataset.open<import('../utils/supabase-storage.js').CrawledItem>();
                const data = await dataset.getData();

                log.info(`Crawling abgeschlossen. ${data.items.length} Einträge gefunden.`, {
                    project_id,
                });

                for (const item of data.items) {
                    await saveToSupabase(item, project_id);
                }

                log.info('Alle Daten in Supabase gespeichert', { project_id });
            } catch (error) {
                log.error('Fehler beim asynchronen Crawling', { error });
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

