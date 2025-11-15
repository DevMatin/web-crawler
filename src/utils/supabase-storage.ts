import { getSupabaseClient } from '../api/supabase.js';
import { log } from 'crawlee';

export interface CrawledItem {
    url: string;
    title: string;
    content_hash: string;
    crawled_at: string;
    technical_data: {
        meta: Record<string, string>;
        headings: Array<{ level: number; text: string }>;
        word_count: number;
        links_count: number;
        images_count: number;
    };
    semantic_data: Record<string, unknown>;
    internal_links: string[];
}

export async function saveToSupabase(
    item: CrawledItem,
    projectId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseClient = getSupabaseClient();
        const { error } = await supabaseClient
            .from('pages')
            .upsert(
                {
                    project_id: projectId,
                    url: item.url,
                    title: item.title,
                    content_hash: item.content_hash,
                    crawled_at: item.crawled_at,
                    technical_data: item.technical_data,
                    semantic_data: item.semantic_data,
                    internal_links: item.internal_links,
                    embedding: null,
                },
                {
                    onConflict: 'url,project_id',
                }
            );

        if (error) {
            log.error(`Supabase Fehler für ${item.url}`, { error });
            return { success: false, error: error.message };
        }

        log.info(`Gespeichert in Supabase: ${item.url}`, { projectId });
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.error('Fehler beim Speichern in Supabase', { error });
        return { success: false, error: errorMessage };
    }
}

