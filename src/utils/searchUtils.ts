import type { Product } from "../types/Product";
import type { IndexedProduct } from "./searchIndex";
import {
    SEARCH_SCORES,
    FUZZY_MATCH,
    SEARCHABLE_FIELDS,
    STOCK_THRESHOLDS,
} from "../constants/searchConstants";
import { expandQueryWithSynonyms } from "./searchSynonyms";
import { getNormalizedDescription, getNormalizedMaterial } from "./searchIndex";
import { searchCache } from "./searchCache";
import { InvertedIndex } from "./invertedIndex";

export interface ScoredProduct {
    product: Product;
    score: number;
    matchType: 'exact' | 'start' | 'contains';
    matchedKeywords: string[];
    matchedFields: string[];
}

/**
 * Calculates the Levenshtein distance between two strings
 * Used for fuzzy matching of product codes with typo tolerance
 * @param str1 - First string
 * @param str2 - Second string
 * @returns The minimum edit distance between the two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    const dp: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                );
            }
        }
    }

    return dp[len1][len2];
}

/**
 * Calculates dynamic max distance based on keyword length
 * Longer keywords allow more typos proportionally
 */
function getDynamicMaxDistance(keywordLength: number): number {
    if (keywordLength < 3) return 0;
    if (keywordLength < 5) return 2;
    if (keywordLength < 8) return 3;
    return Math.ceil(keywordLength * 0.4);
}

/**
 * Scores a product code match with enhanced fuzzy matching support
 * Allows typos for better UX
 * @param code - The product code to match against
 * @param keyword - The search keyword
 * @returns Score for the match (0 if no match)
 */
function scoreProductCode(code: string, keyword: string): number {
    if (code === keyword) return SEARCH_SCORES.EXACT_MATCH;
    if (code.startsWith(keyword)) return SEARCH_SCORES.STARTS_WITH;
    if (code.includes(keyword)) return SEARCH_SCORES.CONTAINS;

    if (keyword.length >= FUZZY_MATCH.MIN_KEYWORD_LENGTH) {
        const distance = levenshteinDistance(code, keyword);
        const maxDistance = getDynamicMaxDistance(keyword.length);

        if (distance <= maxDistance) {
            const score = SEARCH_SCORES.FUZZY_MATCH_BASE - (distance * SEARCH_SCORES.FUZZY_MATCH_PENALTY);
            return Math.max(score, 50);
        }
    }

    return 0;
}

// Global inverted index instance (one per store)
let globalInvertedIndex: InvertedIndex | null = null;
let lastProductsLength: number = 0;
let lastProductsFirstId: string | null = null;

/**
 * Initialize or update the inverted index when products change
 * Uses length and first product ID to detect changes efficiently
 */
function ensureInvertedIndex(products: Product[] | IndexedProduct[]): InvertedIndex {
    // Check if we need to rebuild the index
    const currentLength = products.length;
    const currentFirstId = products.length > 0 ? products[0].Material : null;
    
    if (!globalInvertedIndex || 
        lastProductsLength !== currentLength || 
        lastProductsFirstId !== currentFirstId) {
        globalInvertedIndex = new InvertedIndex();
        globalInvertedIndex.build(products);
        lastProductsLength = currentLength;
        lastProductsFirstId = currentFirstId;
    }
    return globalInvertedIndex;
}

/**
 * Clear the inverted index (called when store changes)
 */
export function clearInvertedIndex(): void {
    globalInvertedIndex = null;
    lastProductsLength = 0;
    lastProductsFirstId = null;
}

export function searchProducts(query: string, products: Product[] | IndexedProduct[], limit: number = 50): ScoredProduct[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first (only for longer queries to avoid cache pollution)
    if (normalizedQuery.length >= 3) {
        const cached = searchCache.get(normalizedQuery);
        if (cached) {
            // Ensure cached results are limited to the requested limit
            return cached.slice(0, limit);
        }
    }

    // Split query into keywords and clean them
    const keywords = normalizedQuery
        .split(/\s+/)
        .filter(k => k.length > 0);

    if (keywords.length === 0) {
        return [];
    }

    // Expand keywords with synonyms for better search results
    const expandedKeywords = expandQueryWithSynonyms(keywords);

    // Build/ensure inverted index is ready
    const invertedIndex = ensureInvertedIndex(products);

    // Use inverted index to find candidate products (O(1) per keyword lookup)
    // This is MUCH faster than filtering through all products
    let candidateIndices = invertedIndex.findProductsWithAllKeywords(keywords);

    // If no exact matches, try with synonyms (for each keyword, try original OR synonym)
    if (candidateIndices.size === 0 && expandedKeywords.length > keywords.length) {
        // Try finding products where each keyword OR its synonym matches
        // This is more complex but handles synonym expansion
        
        // For each keyword, get products matching it OR its synonyms
        const keywordMatchSets: Set<number>[] = [];
        
        for (const keyword of keywords) {
            const keywordMatches = new Set<number>();
            
            // Add products matching the original keyword
            const originalMatches = invertedIndex.findProductsWithAllKeywords([keyword]);
            originalMatches.forEach(idx => keywordMatches.add(idx));
            
            // Add products matching synonyms of this keyword
            const keywordSynonyms = expandedKeywords.filter(k => k !== keyword);
            for (const synonym of keywordSynonyms) {
                const synonymMatches = invertedIndex.findProductsWithAllKeywords([synonym]);
                synonymMatches.forEach(idx => keywordMatches.add(idx));
            }
            
            keywordMatchSets.push(keywordMatches);
        }
        
        // Intersect all sets: products that match (keyword OR synonym) for ALL keywords
        if (keywordMatchSets.length > 0) {
            candidateIndices = keywordMatchSets[0];
            for (let i = 1; i < keywordMatchSets.length; i++) {
                candidateIndices = new Set(
                    Array.from(candidateIndices).filter(idx => keywordMatchSets[i].has(idx))
                );
                if (candidateIndices.size === 0) break;
            }
        }
    }

    // If still no results, return empty (exact search - all keywords must match)
    if (candidateIndices.size === 0) {
        return [];
    }

    // Score only the candidate products (dramatically fewer than all products)
    const scoredProducts: ScoredProduct[] = [];
    
    for (const productIndex of candidateIndices) {
        const product = invertedIndex.getProduct(productIndex);
        if (!product) continue;

        const score = calculateScore(product, keywords, expandedKeywords, invertedIndex, productIndex);

        if (score.totalScore > 0) {
            scoredProducts.push({
                product,
                score: score.totalScore,
                matchType: score.matchType,
                matchedKeywords: score.matchedKeywords,
                matchedFields: score.matchedFields
            });
        }
        
        // Early termination: if we have enough high-scoring results, we can stop early
        // This helps performance - we only need to score enough to get the top results
        if (scoredProducts.length >= limit * 3) {
            break;
        }
    }

    // Sort by score (descending), then by stock (descending)
    const sortedResults = scoredProducts
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.product["Fără restr."] - a.product["Fără restr."];
        })
        .slice(0, limit);

    // Cache results for future searches
    if (normalizedQuery.length >= 3 && sortedResults.length > 0) {
        searchCache.set(normalizedQuery, sortedResults);
    }

    return sortedResults;
}

function calculateScore(
    product: Product | IndexedProduct, 
    keywords: string[], 
    expandedKeywords: string[],
    invertedIndex?: InvertedIndex,
    productIndex?: number
): {
    totalScore: number;
    matchType: 'exact' | 'start' | 'contains';
    matchedKeywords: string[];
    matchedFields: string[];
} {
    // Use indexed data if available for faster lookups
    const productIsIndexed = '_searchIndex' in product;
    const materialCode = productIsIndexed 
        ? getNormalizedMaterial(product as IndexedProduct)
        : product[SEARCHABLE_FIELDS.MATERIAL].toLowerCase();
    const description = productIsIndexed
        ? getNormalizedDescription(product as IndexedProduct)
        : product[SEARCHABLE_FIELDS.DESCRIPTION].toLowerCase();
    const storageLocation = product[SEARCHABLE_FIELDS.STORAGE_LOCATION].toLowerCase();
    const storageDesc = product[SEARCHABLE_FIELDS.STORAGE_DESC].toLowerCase();

    let totalScore = 0;
    let matchType: 'exact' | 'start' | 'contains' = 'contains';
    const matchedKeywords: string[] = [];
    const matchedFields: string[] = [];

    // Since we're using inverted index, we know all keywords match (or we wouldn't be here)
    // But we still need to verify and score the matches

    totalScore = SEARCH_SCORES.BASE_SCORE;

    for (const keyword of keywords) {
        let keywordMatched = false;
        let synonymMatched = false;

        // Score product code with fuzzy matching (only on original keyword, not synonyms)
        const codeScore = scoreProductCode(materialCode, keyword);
        if (codeScore > 0) {
            totalScore += codeScore;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.MATERIAL)) {
                matchedFields.push(SEARCHABLE_FIELDS.MATERIAL);
            }
            if (codeScore >= SEARCH_SCORES.EXACT_MATCH) {
                matchType = 'exact';
            } else if (codeScore >= SEARCH_SCORES.STARTS_WITH && matchType === 'contains') {
                matchType = 'start';
            }
        }

        // Check synonyms for description matching (only if original keyword didn't match description)
        // Use fast inverted index lookup if available
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const keywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
        
        if (!keywordRegex.test(description)) {
            const keywordSynonyms = expandedKeywords.filter(k => k !== keyword);
            for (const synonym of keywordSynonyms) {
                // Use inverted index for fast synonym check
                if (invertedIndex && productIndex !== undefined) {
                    if (invertedIndex.productHasWord(productIndex, synonym)) {
                        totalScore += SEARCH_SCORES.DESCRIPTION_CONTAINS;
                        synonymMatched = true;
                        if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                            matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
                        }
                        break;
                    }
                } else {
                    // Fallback: regex-based synonym matching
                    const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const synonymRegex = new RegExp(`\\b${escapedSynonym}\\b`, 'i');
                    if (synonymRegex.test(description)) {
                        totalScore += SEARCH_SCORES.DESCRIPTION_CONTAINS;
                        synonymMatched = true;
                        if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                            matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
                        }
                        break; // Only count first matching synonym
                    }
                }
            }
        }

        // Thread type bonus
        if ((keyword === 'fe' || keyword === 'fi' || keyword.includes('filet')) && /\b(FE|FI|filet)\b/i.test(description)) {
            totalScore += SEARCH_SCORES.THREAD_BONUS;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
            }
        }

        // Description matching (original keyword)
        // Use word boundary matching for better accuracy, especially for colors
        const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const hasWordBoundaryMatch = wordBoundaryRegex.test(description);
        
        if (description.startsWith(keyword)) {
            totalScore += SEARCH_SCORES.DESCRIPTION_STARTS;
            keywordMatched = true;
            if (matchType === 'contains') matchType = 'start';
            if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
            }
        } else if (hasWordBoundaryMatch) {
            // Word boundary match gets higher score than simple contains
            totalScore += SEARCH_SCORES.DESCRIPTION_CONTAINS + 10;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
            }
        } else if (description.includes(keyword)) {
            totalScore += SEARCH_SCORES.DESCRIPTION_CONTAINS;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
            }
        }

        // Storage location and description matching
        if (storageLocation.includes(keyword)) {
            totalScore += SEARCH_SCORES.STORAGE_LOCATION;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.STORAGE_LOCATION)) {
                matchedFields.push(SEARCHABLE_FIELDS.STORAGE_LOCATION);
            }
        }

        if (storageDesc.includes(keyword)) {
            totalScore += SEARCH_SCORES.STORAGE_DESC;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.STORAGE_DESC)) {
                matchedFields.push(SEARCHABLE_FIELDS.STORAGE_DESC);
            }
        }

        if ((keywordMatched || synonymMatched) && !matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
        }
    }

    // Stock bonuses
    const stock = product[SEARCHABLE_FIELDS.STOCK];
    if (stock > STOCK_THRESHOLDS.OUT_OF_STOCK) {
        totalScore += SEARCH_SCORES.STOCK_IN;
        if (stock >= STOCK_THRESHOLDS.LOW_STOCK) {
            totalScore += SEARCH_SCORES.STOCK_HIGH;
        }
    }

    return { totalScore, matchType, matchedKeywords, matchedFields };
}

export function getStockStatus(stock: number): {
    color: string;
    bgColor: string;
    label: string;
} {
    if (stock === STOCK_THRESHOLDS.OUT_OF_STOCK) {
        return {
            color: 'text-red-400',
            bgColor: 'bg-red-500',
            label: 'Out of stock'
        };
    }
    if (stock < STOCK_THRESHOLDS.LOW_STOCK) {
        return {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500',
            label: 'Low stock'
        };
    }
    return {
        color: 'text-green-400',
        bgColor: 'bg-green-500',
        label: 'In stock'
    };
}