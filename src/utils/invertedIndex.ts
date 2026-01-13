import type { Product } from "../types/Product";
import type { IndexedProduct } from "./searchIndex";
import { normalizeText } from "./searchIndex";

/**
 * Inverted index for fast product search
 * Maps words to product indices for O(1) lookups
 * This is the standard approach used by search engines for large datasets
 */
export class InvertedIndex {
    private wordToProducts: Map<string, Set<number>> = new Map();
    private products: (Product | IndexedProduct)[] = [];
    private productWords: Map<number, Set<string>> = new Map();

    /**
     * Build inverted index from products
     * This is called once when products are loaded
     */
    build(products: (Product | IndexedProduct)[]): void {
        this.products = products;
        this.wordToProducts.clear();
        this.productWords.clear();

        products.forEach((product, index) => {
            const words = this.extractWords(product);
            this.productWords.set(index, words);

            words.forEach(word => {
                if (!this.wordToProducts.has(word)) {
                    this.wordToProducts.set(word, new Set());
                }
                this.wordToProducts.get(word)!.add(index);
            });
        });
    }

    /**
     * Extract all searchable words from a product
     * Handles numbers specially (e.g., "20" matches "D.20", "20mm", etc.)
     */
    private extractWords(product: Product | IndexedProduct): Set<string> {
        const words = new Set<string>();
        
        if ('_searchIndex' in product && product._searchIndex) {
            // Use pre-indexed words if available
            product._searchIndex.words.forEach(word => words.add(word));
        } else {
            // Extract words manually
            const description = product["Descriere material"].toLowerCase();
            const material = product.Material.toLowerCase();
            
            // Normalize and extract words
            const normalizedDesc = normalizeText(description);
            const normalizedMaterial = normalizeText(material);
            const searchableText = `${normalizedMaterial} ${normalizedDesc}`;
            
            // Extract words with word boundaries
            const wordRegex = /\b\w+\b/g;
            let match;
            
            while ((match = wordRegex.exec(searchableText)) !== null) {
                words.add(match[0]);
            }
            
            // Extract numbers separately (for "20", "D.20", "20mm", etc.)
            const numberRegex = /\b\d+\b/g;
            while ((match = numberRegex.exec(searchableText)) !== null) {
                words.add(match[0]);
            }
        }
        
        return words;
    }

    /**
     * Find products that contain ALL keywords (AND search)
     * Uses set intersection for O(n) performance where n is the smallest set
     * Returns set of product indices
     */
    findProductsWithAllKeywords(keywords: string[]): Set<number> {
        if (keywords.length === 0) {
            return new Set();
        }

        // Normalize keywords
        const normalizedKeywords = keywords
            .map(k => normalizeText(k))
            .filter(k => k.length > 0);
        
        if (normalizedKeywords.length === 0) {
            return new Set();
        }

        // Start with products matching the first keyword
        const firstKeyword = normalizedKeywords[0];
        let candidateIndices = this.wordToProducts.get(firstKeyword);
        
        if (!candidateIndices || candidateIndices.size === 0) {
            return new Set();
        }

        // Intersect with products matching subsequent keywords (AND operation)
        // This ensures ALL keywords must match
        for (let i = 1; i < normalizedKeywords.length; i++) {
            const keyword = normalizedKeywords[i];
            const matchingIndices = this.wordToProducts.get(keyword);
            
            if (!matchingIndices || matchingIndices.size === 0) {
                return new Set(); // No products match all keywords
            }
            
            // Intersection: keep only products that match this keyword too
            candidateIndices = new Set(
                Array.from(candidateIndices).filter(idx => matchingIndices.has(idx))
            );

            // Early exit if no candidates left
            if (candidateIndices.size === 0) {
                break;
            }
        }

        return candidateIndices;
    }

    /**
     * Find products that contain ANY keyword (OR search) - for fallback
     */
    findProductsWithAnyKeyword(keywords: string[]): Set<number> {
        const normalizedKeywords = keywords
            .map(k => normalizeText(k))
            .filter(k => k.length > 0);
        const result = new Set<number>();

        normalizedKeywords.forEach(keyword => {
            const indices = this.wordToProducts.get(keyword);
            if (indices) {
                indices.forEach(idx => result.add(idx));
            }
        });

        return result;
    }

    /**
     * Check if a product contains a specific word (for synonym matching)
     */
    productHasWord(productIndex: number, word: string): boolean {
        const words = this.productWords.get(productIndex);
        if (!words) return false;
        return words.has(normalizeText(word));
    }

    /**
     * Get product by index
     */
    getProduct(index: number): Product | IndexedProduct | undefined {
        return this.products[index];
    }

    /**
     * Get all products
     */
    getAllProducts(): (Product | IndexedProduct)[] {
        return this.products;
    }

    /**
     * Get number of products
     */
    getProductCount(): number {
        return this.products.length;
    }
}
