import type { Product } from "../types/Product";
import type { FilialaCode } from "../types/filiala";
import { supabase } from "../lib/supabase";
import { productFromDbRow } from "./productFromDb";

export interface SearchResult {
    product: Product;
    score: number;
    matchType: 'code-exact' | 'code-prefix' | 'token-match';
}

export interface SearchOutput {
    codeResults: SearchResult[];
    tokenResults: SearchResult[];
    total: number;
}

function scoreProduct(product: Product, queryTerms: string[]): number {
    const nameLower = product.name.toLowerCase();
    let score = 0;

    // 1. Specificity: Shorter titles get a bonus (closer to exact matches)
    score += Math.max(0, 1000 - product.name.length);

    // 2. Query word alignment and positioning
    queryTerms.forEach((term) => {
        const pos = nameLower.indexOf(term);
        if (pos === 0) {
            score += 250; // starts with the search term
        } else if (pos > 0) {
            // Check if matches a word boundary
            const prevChar = nameLower.charAt(pos - 1);
            if (/\s|[-/]/.test(prevChar)) {
                score += 150; // starts a word/spec block
            } else {
                score += 50; // matching substring inside a word
            }
            // Closer to the start gets higher score
            score += Math.max(0, 100 - pos);
        }
    });

    // 3. Stock availability: prioritize items with stock
    if (product.stock && product.stock > 0) {
        score += 200;
    }

    return score;
}

export async function searchSupabase(
    query: string,
    options: {
        category?: string | null;
        maxCodeResults?: number;
        maxTokenResults?: number;
        exactCodeOnly?: boolean;
        store?: FilialaCode;
    } = {}
): Promise<SearchOutput> {
    if (!query || query.trim().length === 0) {
        return { codeResults: [], tokenResults: [], total: 0 };
    }

    const { category = null, maxCodeResults = 3, maxTokenResults = 5, exactCodeOnly = false, store } = options;
    const trimmed = query.trim().toLowerCase();
    const isCode = /^\d/.test(trimmed);

    let codeResults: SearchResult[] = [];
    let tokenResults: SearchResult[] = [];

    try {
        if (isCode) {
            let codeQuery = supabase
                .from('products')
                .select('*');
                
            if (exactCodeOnly) {
                codeQuery = codeQuery.eq('code', trimmed);
            } else {
                codeQuery = codeQuery.ilike('code', `${trimmed}%`);
            }
 
            if (store) {
                codeQuery = codeQuery.eq('store', store);
            }
 
            const { data: codeData } = await codeQuery
                .order('stock', { ascending: false })
                .limit(maxCodeResults);
 
            if (codeData) {
                codeResults = codeData.map((p) => ({
                    product: productFromDbRow(p as unknown as Record<string, unknown>),
                    score: p.code.toLowerCase() === trimmed ? 1000 : 500,
                    matchType: p.code.toLowerCase() === trimmed ? 'code-exact' : 'code-prefix'
                }));
            }
        }
 
        const searchTerms = trimmed.split(/\s+/).filter(t => t.length > 1);
        if (searchTerms.length > 0) {
            let tokenQuery = supabase.from('products').select('*');
            
            searchTerms.forEach(term => {
                tokenQuery = tokenQuery.ilike('name', `%${term}%`);
            });
 
            if (category) {
                tokenQuery = tokenQuery.eq('category', category);
            }
 
            if (store) {
                tokenQuery = tokenQuery.eq('store', store);
            }
 
            // Fetch a larger pool of candidates to perform client-side ranking
            const { data: tokenData } = await tokenQuery
                .order('stock', { ascending: false })
                .limit(25);
 
            if (tokenData) {
                const codeSet = new Set(codeResults.map(r => r.product.code));
                const parsedResults = tokenData
                    .filter(p => !codeSet.has(p.code))
                    .map((p) => {
                        const product = productFromDbRow(p as unknown as Record<string, unknown>);
                        return {
                            product,
                            score: scoreProduct(product, searchTerms),
                            matchType: 'token-match' as const
                        };
                    });
                
                // Sort by relevance score descending
                parsedResults.sort((a, b) => b.score - a.score);
                
                // Slice to the requested maxTokenResults (default 5)
                tokenResults = parsedResults.slice(0, maxTokenResults);
            }
        }
 
        return {
            codeResults,
            tokenResults,
            total: codeResults.length + tokenResults.length
        };
    } catch (error) {
        console.error("Supabase search error:", error);
        return { codeResults: [], tokenResults: [], total: 0 };
    }
}

export async function lookupProductByCodeForStore(
    code: string,
    store: FilialaCode,
): Promise<{ product: Product; storageNote?: string } | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;

    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("code", trimmed)
            .eq("store", store)
            .order("stock", { ascending: false })
            .limit(10);

        if (error || !data?.length) return null;

        const products = data.map((p) =>
            productFromDbRow(p as unknown as Record<string, unknown>),
        );
        const product = products[0];

        let storageNote: string | undefined;
        if (products.length > 1) {
            storageNote = products
                .map((p) => `${p.storage}${p.storageDesc ? ` (${p.storageDesc})` : ""}`)
                .join(" · ");
        }

        return { product, storageNote };
    } catch (err) {
        console.error("lookupProductByCodeForStore error:", err);
        return null;
    }
}
