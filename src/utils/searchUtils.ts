import type { Product } from "../types/Product";
import {
    SEARCH_SCORES,
    FUZZY_MATCH,
    SEARCHABLE_FIELDS,
    STOCK_THRESHOLDS,
} from "../constants/searchConstants";

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

export function searchProducts(query: string, products: Product[], limit: number = 8): ScoredProduct[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    // Split query into keywords and clean them
    const keywords = query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(k => k.length > 0);

    if (keywords.length === 0) {
        return [];
    }

    const scoredProducts: ScoredProduct[] = [];

    for (const product of products) {
        const score = calculateScore(product, keywords);

        if (score.totalScore > 0) {
            scoredProducts.push({
                product,
                score: score.totalScore,
                matchType: score.matchType,
                matchedKeywords: score.matchedKeywords,
                matchedFields: score.matchedFields
            });
        }
    }

    // Sort by score (descending), then by stock (descending)
    return scoredProducts
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.product["Fără restr."] - a.product["Fără restr."];
        })
        .slice(0, limit);
}

function calculateScore(product: Product, keywords: string[]): {
    totalScore: number;
    matchType: 'exact' | 'start' | 'contains';
    matchedKeywords: string[];
    matchedFields: string[];
} {
    const materialCode = product[SEARCHABLE_FIELDS.MATERIAL].toLowerCase();
    const description = product[SEARCHABLE_FIELDS.DESCRIPTION].toLowerCase();
    const storageLocation = product[SEARCHABLE_FIELDS.STORAGE_LOCATION].toLowerCase();
    const storageDesc = product[SEARCHABLE_FIELDS.STORAGE_DESC].toLowerCase();

    const searchableText = `${materialCode} ${description} ${storageLocation} ${storageDesc}`;

    let totalScore = 0;
    let matchType: 'exact' | 'start' | 'contains' = 'contains';
    const matchedKeywords: string[] = [];
    const matchedFields: string[] = [];

    // Early exit if not all keywords match
    if (!keywords.every(keyword => searchableText.includes(keyword))) {
        return { totalScore: 0, matchType: 'contains', matchedKeywords: [], matchedFields: [] };
    }

    totalScore = SEARCH_SCORES.BASE_SCORE;

    for (const keyword of keywords) {
        let keywordMatched = false;

        // Score product code with fuzzy matching
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

        // Thread type bonus
        if ((keyword === 'fe' || keyword === 'fi' || keyword.includes('filet')) && /\b(FE|FI|filet)\b/i.test(description)) {
            totalScore += SEARCH_SCORES.THREAD_BONUS;
            keywordMatched = true;
            if (!matchedFields.includes(SEARCHABLE_FIELDS.DESCRIPTION)) {
                matchedFields.push(SEARCHABLE_FIELDS.DESCRIPTION);
            }
        }

        // Description matching
        if (description.startsWith(keyword)) {
            totalScore += SEARCH_SCORES.DESCRIPTION_STARTS;
            keywordMatched = true;
            if (matchType === 'contains') matchType = 'start';
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

        if (keywordMatched && !matchedKeywords.includes(keyword)) {
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