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
    internal_links_with_anchor?: Array<{ url: string; anchor: string }>;
}

export async function saveToSupabase(
    item: CrawledItem,
    projectId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseClient = getSupabaseClient();
        
        const { data: pageData, error: pageError } = await supabaseClient
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
            )
            .select('id')
            .single();

        if (pageError) {
            log.error(`Supabase Fehler für ${item.url}`, { error: pageError });
            return { success: false, error: pageError.message };
        }

        if (!pageData?.id) {
            const { data: existingPage } = await supabaseClient
                .from('pages')
                .select('id')
                .eq('project_id', projectId)
                .eq('url', item.url)
                .single();
            
            if (!existingPage?.id) {
                log.error(`Konnte page ID nicht finden für ${item.url}`);
                return { success: false, error: 'Page ID nicht gefunden' };
            }
            pageData.id = existingPage.id;
        }

        if (item.internal_links_with_anchor && item.internal_links_with_anchor.length > 0) {
            const linkInserts = [];
            
            for (const link of item.internal_links_with_anchor) {
                const { data: toPage } = await supabaseClient
                    .from('pages')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('url', link.url)
                    .single();

                linkInserts.push({
                    project_id: projectId,
                    from_page: pageData.id,
                    to_page: toPage?.id || null,
                    anchor: link.anchor || null,
                });
            }

            if (linkInserts.length > 0) {
                for (const linkInsert of linkInserts) {
                    const { error: linksError } = await supabaseClient
                        .from('internal_links')
                        .insert(linkInsert);

                    if (linksError) {
                        if (linksError.code === '23505') {
                            // Duplikat - ignorieren
                        } else {
                            log.warning(`Fehler beim Speichern eines internal_link für ${item.url}`, { error: linksError });
                        }
                    }
                }
            }
        }

        log.info(`Gespeichert in Supabase: ${item.url}`, { projectId, pageId: pageData.id });
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log.error('Fehler beim Speichern in Supabase', { error });
        return { success: false, error: errorMessage };
    }
}

