import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../config.js';

export async function readDatasetFromFilesystem(): Promise<{
    items: any[];
    total: number;
}> {
    const storageDir = config.storageDir || './storage';
    const datasetDir = join(storageDir, 'datasets', 'default');

    try {
        const files = await readdir(datasetDir);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort();

        const items = [];
        for (const file of jsonFiles) {
            try {
                const content = await readFile(join(datasetDir, file), 'utf-8');
                const item = JSON.parse(content);
                items.push(item);
            } catch (error) {
                // Ignore invalid JSON files
            }
        }

        return {
            items,
            total: items.length,
        };
    } catch (error) {
        return {
            items: [],
            total: 0,
        };
    }
}

