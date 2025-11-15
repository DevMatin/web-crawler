import { createHash } from 'crypto';

export function calculateContentHash(html: string): string {
    let cleaned = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/data-[^=]*="[^"]*"/gi, '')
        .replace(/id="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return createHash('sha256').update(cleaned).digest('hex');
}

