import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
    startUrls: process.env.START_URLS ? process.env.START_URLS.split(',').filter(url => url.trim()) : [],
    allowedDomains: process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',').filter(domain => domain.trim()) : [],
    maxRequestsPerCrawl: parseInt(process.env.MAX_REQUESTS_PER_CRAWL || '100', 10),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10', 10),
    requestHandlerTimeoutSecs: parseInt(process.env.REQUEST_HANDLER_TIMEOUT_SECS || '60', 10),
    navigationTimeoutSecs: parseInt(process.env.NAVIGATION_TIMEOUT_SECS || '30', 10),
    logLevel: (process.env.LOG_LEVEL || 'INFO') as 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
    port: parseInt(process.env.PORT || '3000', 10),
    storageDir: process.env.STORAGE_DIR || './storage',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

