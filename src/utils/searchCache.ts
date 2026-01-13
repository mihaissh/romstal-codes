/**
 * Simple LRU cache for search results
 * Helps avoid re-searching the same queries
 */

interface CacheEntry {
    query: string;
    results: any[];
    timestamp: number;
}

const MAX_CACHE_SIZE = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class SearchCache {
    private cache: Map<string, CacheEntry> = new Map();

    get(query: string): any[] | null {
        const entry = this.cache.get(query);
        if (!entry) return null;

        // Check if cache entry is still valid
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            this.cache.delete(query);
            return null;
        }

        return entry.results;
    }

    set(query: string, results: any[]): void {
        // Remove oldest entries if cache is full
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(query, {
            query,
            results,
            timestamp: Date.now()
        });
    }

    clear(): void {
        this.cache.clear();
    }

    // Invalidate cache when products change
    invalidate(): void {
        this.clear();
    }
}

export const searchCache = new SearchCache();
