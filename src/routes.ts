import { createCheerioRouter } from 'crawlee';
import { config } from './config.js';
import { calculateContentHash } from './utils/content-hash.js';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, log, request, $, pushData }) => {
    log.info(`Seite gefunden: ${request.url}`);
    
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
        const internalLinksWithAnchor: Array<{ url: string; anchor: string }> = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                try {
                    const linkUrl = new URL(href, url);
                    if (linkUrl.hostname === baseUrl.hostname) {
                        const linkUrlString = linkUrl.toString();
                        internalLinks.push(linkUrlString);
                        const anchor = $(el).text().trim() || '';
                        internalLinksWithAnchor.push({ url: linkUrlString, anchor });
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

        const uniqueLinks = [...new Set(internalLinks)];
        const linksMap = new Map<string, string>();
        internalLinksWithAnchor.forEach(({ url: linkUrl, anchor }) => {
            if (!linksMap.has(linkUrl) || (anchor && !linksMap.get(linkUrl))) {
                linksMap.set(linkUrl, anchor);
            }
        });

        const content = {
            url,
            title,
            content_hash: contentHash,
            crawled_at: new Date().toISOString(),
            technical_data: technicalData,
            semantic_data: {},
            internal_links: uniqueLinks,
            internal_links_with_anchor: Array.from(linksMap.entries()).map(([url, anchor]) => ({ url, anchor })),
        };

        await pushData(content);
        log.info(`Daten extrahiert: ${title}`, { url });

        const currentDomain = baseUrl.hostname;
        const domainsToCrawl = config.allowedDomains.length > 0 
            ? config.allowedDomains 
            : [currentDomain];
        
        log.info(`Enqueue Links für Domain: ${currentDomain}`, { 
            domainsToCrawl, 
            foundLinks: uniqueLinks.length,
            links: uniqueLinks.slice(0, 5) 
        });
        
        if (uniqueLinks.length > 0) {
            await enqueueLinks({
                urls: uniqueLinks,
                label: 'default',
            });
            log.info(`${uniqueLinks.length} Links zur Queue hinzugefügt`);
        } else {
            log.warning('Keine internen Links gefunden');
        }
    } catch (error) {
        log.warning(`Konnte Domain nicht extrahieren für ${request.url}`, { error });
    }
});

