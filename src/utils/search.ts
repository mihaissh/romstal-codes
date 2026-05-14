import type { Product } from "../types/Product";
import { supabase } from "../lib/supabase";

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

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export async function searchSupabase(
    query: string,
    options: {
        category?: string | null;
        maxCodeResults?: number;
        maxTokenResults?: number;
    } = {}
): Promise<SearchOutput> {
    if (!query || query.trim().length === 0) {
        return { codeResults: [], tokenResults: [], total: 0 };
    }

    const { category = null, maxCodeResults = 5, maxTokenResults = 20 } = options;
    const trimmed = query.trim().toLowerCase();
    const isCode = /^\d/.test(trimmed);

    let codeResults: SearchResult[] = [];
    let tokenResults: SearchResult[] = [];

    try {
        if (isCode) {
            // 1. Search by code prefix
            const { data: codeData } = await supabase
                .from('products')
                .select('*')
                .ilike('code', `${trimmed}%`)
                .order('stock', { ascending: false })
                .limit(maxCodeResults);

            if (codeData) {
                codeResults = codeData.map(p => ({
                    product: {
                        ...p,
                        productMaterial: p.productmaterial,
                        storeName: p.storename,
                        storageDesc: p.storagedesc
                    } as Product,
                    score: p.code.toLowerCase() === trimmed ? 1000 : 500,
                    matchType: p.code.toLowerCase() === trimmed ? 'code-exact' : 'code-prefix'
                }));
            }
        }

        // 2. Search by tokens (Full Text Search)
        // We use the 'tokens' array column with the 'overlaps' operator or similar
        // For better performance, we can use a simple ilike on the name for now
        // or a more complex RPC if needed. Let's start with a smart ILIKE.
        
        const searchTerms = trimmed.split(/\s+/).filter(t => t.length > 1);
        if (searchTerms.length > 0) {
            let tokenQuery = supabase.from('products').select('*');
            
            // Apply all tokens as filters (AND logic)
            searchTerms.forEach(term => {
                tokenQuery = tokenQuery.ilike('name', `%${term}%`);
            });

            if (category) {
                tokenQuery = tokenQuery.eq('category', category);
            }

            const { data: tokenData } = await tokenQuery
                .order('stock', { ascending: false })
                .limit(maxTokenResults);

            if (tokenData) {
                // Filter out results already in codeResults
                const codeSet = new Set(codeResults.map(r => r.product.code));
                tokenResults = tokenData
                    .filter(p => !codeSet.has(p.code))
                    .map(p => ({
                        product: {
                            ...p,
                            productMaterial: p.productmaterial,
                            storeName: p.storename,
                            storageDesc: p.storagedesc
                        } as Product,
                        score: 100,
                        matchType: 'token-match'
                    }));
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
