import { createCheerioRouter } from 'crawlee';
import { config } from './config.js';
import { calculateContentHash } from './utils/content-hash.js';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, log, request }) => {
    log.info(`Seite gefunden: ${request.url}`);
    
    try {
        const url = new URL(request.url);
        const currentDomain = url.hostname;
        
        const domainsToCrawl = config.allowedDomains.length > 0 
            ? config.allowedDomains 
            : [currentDomain];
        
        await enqueueLinks({
            globs: domainsToCrawl.map(domain => `https://${domain}/**`),
            label: 'detail',
        });
    } catch (error) {
        log.warning(`Konnte Domain nicht extrahieren für ${request.url}`, { error });
    }
});

router.addHandler('detail', async ({ request, $, log, pushData }) => {
    try {
        const url = request.loadedUrl || request.url;
        const title = $('title').text().trim();
        const html = $.html();
        const contentHash = calculateContentHash(html);

        const metaTags: Record<string, string> = {};
        $('meta').each((_, el) => {
            const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('http-equiv');
            const content = $(el).attr('content');
            if (name && content) {
                metaTags[name] = content;
            }
        });

        const headings: Array<{ level: number; text: string }> = [];
        for (let level = 1; level <= 6; level++) {
            $(`h${level}`).each((_, el) => {
                headings.push({
                    level,
                    text: $(el).text().trim(),
                });
            });
        }

        const textContent = $('body').text() || '';
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

        const linksCount = $('a').length;
        const imagesCount = $('img').length;

        const baseUrl = new URL(url);
        const internalLinks: string[] = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                try {
                    const linkUrl = new URL(href, url);
                    if (linkUrl.hostname === baseUrl.hostname) {
                        internalLinks.push(linkUrl.toString());
                    }
                } catch {
                    // Ignore invalid URLs
                }
            }
        });

        const technicalData = {
            meta: metaTags,
            headings,
            word_count: wordCount,
            links_count: linksCount,
            images_count: imagesCount,
        };

        const content = {
            url,
            title,
            content_hash: contentHash,
            crawled_at: new Date().toISOString(),
            technical_data: technicalData,
            semantic_data: {},
            internal_links: [...new Set(internalLinks)],
        };

        await pushData(content);
        log.info(`Daten extrahiert: ${title}`, { url });
    } catch (error) {
        log.error(`Fehler beim Verarbeiten von ${request.url}`, { error });
        throw error;
    }
});

