import { CheerioCrawler, Dataset, log } from 'crawlee';
import { router } from './routes.js';
import { config } from './config.js';

log.setLevel(config.logLevel as any);

const crawler = new CheerioCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: config.maxRequestsPerCrawl,
    maxConcurrency: config.maxConcurrency,
    requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
    navigationTimeoutSecs: config.navigationTimeoutSecs,
});

log.info('Crawler gestartet', { 
    startUrls: config.startUrls,
    maxRequests: config.maxRequestsPerCrawl 
});

await crawler.run(config.startUrls);

const dataset = await Dataset.open();
const data = await dataset.getData();
log.info(`Crawling abgeschlossen. ${data.items.length} Einträge gespeichert.`);

