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

function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        urlObj.hash = '';
        urlObj.search = '';
        let pathname = urlObj.pathname;
        if (pathname.endsWith('/') && pathname.length > 1) {
            pathname = pathname.slice(0, -1);
        }
        urlObj.pathname = pathname;
        return urlObj.toString();
    } catch {
        return url;
    }
}

export async function saveToSupabase(
    item: CrawledItem,
    projectId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseClient = getSupabaseClient();
        
        const normalizedUrl = normalizeUrl(item.url);
        
        const { data: pageData, error: pageError } = await supabaseClient
            .from('pages')
            .upsert(
                {
                    project_id: projectId,
                    url: normalizedUrl,
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
            log.error(`Supabase Fehler für ${normalizedUrl}`, { error: pageError });
            return { success: false, error: pageError.message };
        }

        if (!pageData?.id) {
            const { data: existingPage } = await supabaseClient
                .from('pages')
                .select('id')
                .eq('project_id', projectId)
                .eq('url', normalizedUrl)
                .single();
            
            if (!existingPage?.id) {
                log.error(`Konnte page ID nicht finden für ${normalizedUrl}`);
                return { success: false, error: 'Page ID nicht gefunden' };
            }
            pageData.id = existingPage.id;
        }

        if (item.internal_links_with_anchor && item.internal_links_with_anchor.length > 0) {
            log.info(`Speichere ${item.internal_links_with_anchor.length} internal_links für Projekt ${projectId}`, {
                from_page_id: pageData.id,
                from_url: item.url
            });

            const { error: deleteError } = await supabaseClient
                .from('internal_links')
                .delete()
                .eq('project_id', projectId)
                .eq('from_page', pageData.id);

            if (deleteError) {
                log.warning(`Fehler beim Löschen alter internal_links für ${item.url}`, { error: deleteError });
            }

            const linkInserts = [];
            
            for (const link of item.internal_links_with_anchor) {
                const normalizedLinkUrl = normalizeUrl(link.url);
                const { data: toPage, error: toPageError } = await supabaseClient
                    .from('pages')
                    .select('id, project_id')
                    .eq('project_id', projectId)
                    .eq('url', normalizedLinkUrl)
                    .maybeSingle();

                if (toPageError && toPageError.code !== 'PGRST116') {
                    log.warning(`Fehler beim Suchen nach to_page für ${normalizedLinkUrl}`, { error: toPageError });
                }

                if (toPage && toPage.project_id === projectId) {
                    linkInserts.push({
                        project_id: projectId,
                        from_page: pageData.id,
                        to_page: toPage.id,
                        anchor: link.anchor || null,
                    });
                } else {
                    log.debug(`to_page nicht gefunden für ${link.url} in Projekt ${projectId}, Link wird ohne to_page gespeichert`);
                    linkInserts.push({
                        project_id: projectId,
                        from_page: pageData.id,
                        to_page: null,
                        anchor: link.anchor || null,
                    });
                }
            }

            if (linkInserts.length > 0) {
                const { data: insertedLinks, error: linksError } = await supabaseClient
                    .from('internal_links')
                    .insert(linkInserts)
                    .select();

                if (linksError) {
                    log.warning(`Fehler beim Speichern der internal_links für ${item.url}`, { 
                        error: linksError,
                        project_id: projectId,
                        link_count: linkInserts.length
                    });
                } else {
                    log.info(`Erfolgreich ${linkInserts.length} internal_links gespeichert für Projekt ${projectId}`, {
                        from_page_id: pageData.id,
                        inserted_count: insertedLinks?.length || 0
                    });
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

