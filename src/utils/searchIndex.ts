import type { Product } from "../types/Product";

/**
 * Pre-processed product data for faster searching
 */
export interface IndexedProduct extends Product {
    _searchIndex?: {
        normalizedDescription: string;
        normalizedMaterial: string;
        searchableText: string;
        words: Set<string>;
    };
}

/**
 * Creates a search index for products to improve search performance
 * This pre-processes products once instead of processing them on every search
 */
export function createSearchIndex(products: Product[]): IndexedProduct[] {
    return products.map(product => {
        const description = product["Descriere material"].toLowerCase();
        const material = product.Material.toLowerCase();
        const storageLocation = product["Loc de depozitare"].toLowerCase();
        const storageDesc = product["Descr.loc.depozitare"].toLowerCase();
        
        // Normalize text: remove special characters, normalize spaces
        const normalizedDescription = normalizeText(description);
        const normalizedMaterial = normalizeText(material);
        const searchableText = `${normalizedMaterial} ${normalizedDescription} ${normalizeText(storageLocation)} ${normalizeText(storageDesc)}`;
        
        // Extract words for faster word boundary matching
        const words = new Set<string>();
        const wordRegex = /\b\w+\b/g;
        let match;
        
        while ((match = wordRegex.exec(searchableText)) !== null) {
            words.add(match[0]);
        }
        
        // Also extract numbers separately (they might appear as "20", "D.20", "20mm", etc.)
        const numberRegex = /\b\d+\b/g;
        while ((match = numberRegex.exec(searchableText)) !== null) {
            words.add(match[0]); // Add "20" as a word
            // Also add variations like "20mm", "20x", etc. for better matching
            const num = match[0];
            const numIndex = match.index;
            // Check if number is followed by common suffixes
            const afterNum = searchableText.substring(numIndex + num.length, numIndex + num.length + 3);
            if (afterNum.match(/^(mm|cm|m|"|'|x|\s)/i)) {
                words.add(num); // Already added, but ensure it's there
            }
        }
        
        // Also add full description and material for exact matching
        words.add(normalizedDescription);
        words.add(normalizedMaterial);
        
        return {
            ...product,
            _searchIndex: {
                normalizedDescription,
                normalizedMaterial,
                searchableText,
                words
            }
        };
    });
}

/**
 * Normalizes text for better searching
 * - Converts to lowercase
 * - Removes diacritics (ă, â, î, ș, ț)
 * - Normalizes spaces
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Fast word boundary check using pre-indexed words
 */
export function hasWord(indexedProduct: IndexedProduct, word: string): boolean {
    if (!indexedProduct._searchIndex) return false;
    const normalizedWord = normalizeText(word);
    
    // Check if word exists in the index
    if (indexedProduct._searchIndex.words.has(normalizedWord)) {
        return true;
    }
    
    // Special handling for numbers: check if number appears in description
    // Numbers like "20" might appear as "D.20", "20mm", "20x", etc.
    if (/^\d+$/.test(normalizedWord)) {
        const desc = indexedProduct._searchIndex.normalizedDescription;
        const material = indexedProduct._searchIndex.normalizedMaterial;
        // Check for number with various patterns
        const numberPattern = new RegExp(`\\b${normalizedWord}\\b|\\D${normalizedWord}(?:mm|cm|m|"|'|x|\\s)`, 'i');
        return numberPattern.test(desc) || numberPattern.test(material);
    }
    
    return false;
}

/**
 * Fast substring check using pre-indexed searchable text
 */
export function containsText(indexedProduct: IndexedProduct, text: string): boolean {
    if (!indexedProduct._searchIndex) return false;
    const normalizedText = normalizeText(text);
    return indexedProduct._searchIndex.searchableText.includes(normalizedText);
}

/**
 * Get normalized description for word boundary matching
 */
export function getNormalizedDescription(indexedProduct: IndexedProduct): string {
    return indexedProduct._searchIndex?.normalizedDescription || 
           indexedProduct["Descriere material"].toLowerCase();
}

/**
 * Get normalized material code
 */
export function getNormalizedMaterial(indexedProduct: IndexedProduct): string {
    return indexedProduct._searchIndex?.normalizedMaterial || 
           indexedProduct.Material.toLowerCase();
}
