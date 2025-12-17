import type { Product } from "../types/Product";

export interface ScoredProduct {
    product: Product;
    score: number;
    matchType: 'exact' | 'start' | 'contains';
    matchedKeywords: string[];
    matchedFields: string[];
}

/**
 * Calculates the Levenshtein distance between two strings
 * Used for fuzzy matching of product codes
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const dp: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    // Initialize base cases
    for (let i = 0; i <= len1; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        dp[0][j] = j;
    }

    // Fill the dp table
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1,     // insertion
                    dp[i - 1][j - 1] + 1  // substitution
                );
            }
        }
    }

    return dp[len1][len2];
}

/**
 * Scores a product code match with fuzzy matching support
 */
function scoreProductCode(code: string, keyword: string): number {
    // Exact match: highest priority
    if (code === keyword) return 1000;

    // Starts with keyword: high priority
    if (code.startsWith(keyword)) return 500;

    // Contains keyword: medium priority
    if (code.includes(keyword)) return 250;

    // Fuzzy match for keywords >= 4 characters
    if (keyword.length >= 4) {
        const distance = levenshteinDistance(code, keyword);
        if (distance <= 2) {
            // Score: 150 for distance 0, 125 for distance 1, 100 for distance 2
            return 150 - (distance * 25);
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
    const materialCode = product.Material.toLowerCase();
    const description = product["Descriere material"].toLowerCase();
    const storageLocation = product["Loc de depozitare"].toLowerCase();
    const storageDesc = product["Descr.loc.depozitare"].toLowerCase();

    const searchableText = `${materialCode} ${description} ${storageLocation} ${storageDesc}`;

    let totalScore = 0;
    let matchType: 'exact' | 'start' | 'contains' = 'contains';
    const matchedKeywords: string[] = [];
    const matchedFields: string[] = [];

    // Check if all keywords match
    const allKeywordsMatch = keywords.every(keyword => searchableText.includes(keyword));

    if (!allKeywordsMatch) {
        return { totalScore: 0, matchType: 'contains', matchedKeywords: [], matchedFields: [] };
    }

    // Base score for matching all keywords
    totalScore = 10;

    for (const keyword of keywords) {
        let keywordMatched = false;

        // Use enhanced product code scoring with fuzzy matching
        const codeScore = scoreProductCode(materialCode, keyword);
        if (codeScore > 0) {
            totalScore += codeScore;
            keywordMatched = true;

            if (!matchedFields.includes('Material')) {
                matchedFields.push('Material');
            }

            // Update match type based on score
            if (codeScore >= 1000) {
                matchType = 'exact';
            } else if (codeScore >= 500 && matchType === 'contains') {
                matchType = 'start';
            }
        }

        // Special bonus for FE/FI thread type matches
        if (keyword === 'fe' || keyword === 'fi' || keyword.includes('filet')) {
            const threadPattern = /\b(FE|FI|filet)\b/gi;
            if (threadPattern.test(description)) {
                totalScore += 75; // Higher priority for thread matches
                keywordMatched = true;
                if (!matchedFields.includes('Descriere material')) {
                    matchedFields.push('Descriere material');
                }
            }
        }

        // Description starts with keyword
        if (description.startsWith(keyword)) {
            totalScore += 50;
            keywordMatched = true;
            if (matchType === 'contains') matchType = 'start';

            if (!matchedFields.includes('Descriere material')) {
                matchedFields.push('Descriere material');
            }
        }
        // Description contains keyword
        else if (description.includes(keyword)) {
            totalScore += 20;
            keywordMatched = true;

            if (!matchedFields.includes('Descriere material')) {
                matchedFields.push('Descriere material');
            }
        }

        // Storage location matches
        if (storageLocation.includes(keyword)) {
            totalScore += 10;
            keywordMatched = true;

            if (!matchedFields.includes('Loc de depozitare')) {
                matchedFields.push('Loc de depozitare');
            }
        }

        // Storage description matches
        if (storageDesc.includes(keyword)) {
            totalScore += 5;
            keywordMatched = true;

            if (!matchedFields.includes('Descr.loc.depozitare')) {
                matchedFields.push('Descr.loc.depozitare');
            }
        }

        // Track which keywords matched
        if (keywordMatched && !matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
        }
    }

    // Bonus for products in stock
    if (product["Fără restr."] > 0) {
        totalScore += 50;

        // Extra bonus for high stock
        if (product["Fără restr."] >= 10) {
            totalScore += 25;
        }
    }

    return { totalScore, matchType, matchedKeywords, matchedFields };
}

export function getStockStatus(stock: number): {
    color: string;
    bgColor: string;
    label: string;
} {
    if (stock === 0) {
        return {
            color: 'text-red-400',
            bgColor: 'bg-red-500',
            label: 'Out of stock'
        };
    } else if (stock < 10) {
        return {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500',
            label: 'Low stock'
        };
    } else {
        return {
            color: 'text-green-400',
            bgColor: 'bg-green-500',
            label: 'In stock'
        };
    }
}