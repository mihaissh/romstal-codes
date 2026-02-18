import type { Product } from "../types/Product";

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

// ─── Token Index: maps each token → Set of product indices ───
const tokenMap = new Map<string, Set<number>>();
// ─── Code prefix index: maps code prefixes → product indices ───
const codePrefixMap = new Map<string, number[]>();

let indexedProducts: Product[] = [];
let isBuilt = false;

function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// ─── Abbreviation / alias expansion ───
// Maps short forms to all equivalent terms they should match
const ALIASES: Record<string, string[]> = {
    // Materials
    'pp':           ['ppr', 'polipropilena'],
    'ppr':          ['pp'],
    'polipropilena':['pp', 'ppr'],
    'cu':           ['cupru'],
    'cupru':        ['cu'],
    'inx':          ['inox'],
    'inox':         ['inx'],
    'al':           ['alama'],
    'alama':        ['al'],
    'brz':          ['bronz'],
    'bronz':        ['brz'],
    // Fittings
    'rob':          ['robinet'],
    'red':          ['reductie'],
    'rac':          ['racord'],
    // Thread types
    'fi':           ['filet interior'],
    'fe':           ['filet exterior'],
    // Angle
    'gr':           ['grade', 'grd'],
    'grade':        ['gr', 'grd'],
    'grd':          ['gr', 'grade'],
    // Dimensions
    'dn':           ['diametru nominal'],
    'd':            ['diametru'],
    // Colors
    'alb':          ['alba', 'albe'],
    'neg':          ['negru', 'neagra'],
    'vrd':          ['verde'],
    // Units
    'buc':          ['bucata', 'bucati'],
    'ml':           ['mililitri'],
    'mm':           ['milimetri'],
};

/**
 * Expand a query token into itself + all its aliases
 */
function expandToken(token: string): string[] {
    const aliases = ALIASES[token];
    return aliases ? [token, ...aliases] : [token];
}

export function buildIndex(products: Product[]): void {
    tokenMap.clear();
    codePrefixMap.clear();
    indexedProducts = products;

    products.forEach((product, idx) => {
        // Index tokens
        product.tokens.forEach(token => {
            const normToken = normalize(token);
            if (!tokenMap.has(normToken)) {
                tokenMap.set(normToken, new Set());
            }
            tokenMap.get(normToken)!.add(idx);
        });

        // Index code prefixes (for autocomplete: "6390" → products starting with "6390")
        const code = product.code.toLowerCase();
        for (let len = 1; len <= code.length; len++) {
            const prefix = code.substring(0, len);
            if (!codePrefixMap.has(prefix)) {
                codePrefixMap.set(prefix, []);
            }
            codePrefixMap.get(prefix)!.push(idx);
        }
    });

    isBuilt = true;
}

export function clearIndex(): void {
    tokenMap.clear();
    codePrefixMap.clear();
    indexedProducts = [];
    isBuilt = false;
}

function isCodeQuery(query: string): boolean {
    return /^\d/.test(query.trim());
}

// Find products by code prefix
function searchByCode(query: string, limit: number): SearchResult[] {
    const prefix = query.trim().toLowerCase();
    const indices = codePrefixMap.get(prefix);
    if (!indices) return [];

    return indices
        .slice(0, limit)
        .map(idx => {
            const product = indexedProducts[idx];
            const isExact = product.code.toLowerCase() === prefix;
            return {
                product,
                score: isExact ? 1000 : 500 + (1 / product.code.length),
                matchType: isExact ? 'code-exact' as const : 'code-prefix' as const,
            };
        })
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.product.stock - a.product.stock;
        });
}

// Find products where ALL query tokens match
function searchByTokens(
    query: string,
    limit: number,
    categoryFilter?: string | null
): SearchResult[] {
    const normalized = normalize(query);
    const queryTokens = normalized.split(/\s+/).filter(t => t.length > 0);

    if (queryTokens.length === 0) return [];

    // For each query token, find matching product indices
    // Expand each token with its aliases (pp → ppr, polipropilena, etc.)
    const matchSets: Set<number>[] = queryTokens.map(qt => {
        const matches = new Set<number>();
        const expanded = expandToken(qt);

        for (const term of expanded) {
            // Exact token match
            const exactSet = tokenMap.get(term);
            if (exactSet) {
                exactSet.forEach(idx => matches.add(idx));
            }

            // Prefix token match (for partial words like "rob" matching "robinet")
            if (term.length >= 2) {
                tokenMap.forEach((productIndices, token) => {
                    if (token.startsWith(term) && token !== term) {
                        productIndices.forEach(idx => matches.add(idx));
                    }
                });
            }
        }

        // Number matching: if query token is a number, also match tokens containing it
        if (/^\d+$/.test(qt) && qt.length >= 2) {
            tokenMap.forEach((productIndices, token) => {
                if (token.includes(qt) && token !== qt) {
                    productIndices.forEach(idx => matches.add(idx));
                }
            });
        }

        return matches;
    });

    // Intersect all sets (AND logic): product must match ALL query tokens
    let candidates = matchSets[0];
    for (let i = 1; i < matchSets.length; i++) {
        const next = matchSets[i];
        candidates = new Set([...candidates].filter(idx => next.has(idx)));
        if (candidates.size === 0) return [];
    }

    // Apply category filter
    if (categoryFilter) {
        candidates = new Set(
            [...candidates].filter(idx => indexedProducts[idx].category === categoryFilter)
        );
    }

    // Score results
    const results: SearchResult[] = [];
    for (const idx of candidates) {
        const product = indexedProducts[idx];
        let score = 0;

        for (const qt of queryTokens) {
            const nameNorm = normalize(product.name);

            // Exact word boundary match in name
            const wordRegex = new RegExp(`\\b${qt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            if (wordRegex.test(nameNorm)) {
                score += 100;
            } else if (nameNorm.includes(qt)) {
                score += 50;
            } else {
                score += 20; // token-only match
            }
        }

        // Bonus for stock
        if (product.stock > 0) score += 10;
        if (product.stock > 10) score += 5;

        // Bonus: name starts with first query token
        if (normalize(product.name).startsWith(queryTokens[0])) {
            score += 50;
        }

        results.push({
            product,
            score,
            matchType: 'token-match',
        });

        if (results.length >= limit * 3) break;
    }

    return results
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.product.stock - a.product.stock;
        })
        .slice(0, limit);
}

export function search(
    query: string,
    options: {
        category?: string | null;
        maxCodeResults?: number;
        maxTokenResults?: number;
    } = {}
): SearchOutput {
    if (!isBuilt || !query || query.trim().length === 0) {
        return { codeResults: [], tokenResults: [], total: 0 };
    }

    const { category = null, maxCodeResults = 5, maxTokenResults = 20 } = options;
    const trimmed = query.trim();

    let codeResults: SearchResult[] = [];
    let tokenResults: SearchResult[] = [];

    if (isCodeQuery(trimmed)) {
        // Code-first: show code prefix matches prominently
        codeResults = searchByCode(trimmed, maxCodeResults);

        // Also search by tokens for description matches
        tokenResults = searchByTokens(trimmed, maxTokenResults, category);

        // Remove duplicates between code and token results
        const codeSet = new Set(codeResults.map(r => r.product.code));
        tokenResults = tokenResults.filter(r => !codeSet.has(r.product.code));
    } else {
        // Text search: token matching
        tokenResults = searchByTokens(trimmed, maxTokenResults, category);
    }

    return {
        codeResults,
        tokenResults,
        total: codeResults.length + tokenResults.length,
    };
}

export function getCategories(products: Product[]): string[] {
    const counts = new Map<string, number>();
    products.forEach(p => {
        counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    // Sort by count descending, filter out tiny categories
    return [...counts.entries()]
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat);
}
