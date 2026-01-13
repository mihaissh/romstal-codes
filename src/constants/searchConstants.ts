/**
 * Search algorithm constants for scoring
 */
export const SEARCH_SCORES = {
    EXACT_MATCH: 1000,
    STARTS_WITH: 500,
    CONTAINS: 250,
    FUZZY_MATCH_BASE: 150,
    FUZZY_MATCH_PENALTY: 25,
    THREAD_BONUS: 75,
    DESCRIPTION_STARTS: 50,
    DESCRIPTION_CONTAINS: 20,
    STORAGE_LOCATION: 10,
    STORAGE_DESC: 5,
    BASE_SCORE: 10,
    STOCK_IN: 50,
    STOCK_HIGH: 25,
} as const;

/**
 * Fuzzy matching parameters
 * Allows users to find products even with typos
 */
export const FUZZY_MATCH = {
    MIN_KEYWORD_LENGTH: 3,
} as const;

/**
 * Debounce delays
 */
export const DEBOUNCE_DELAY = 200; // ms

/**
 * Stock status thresholds
 */
export const STOCK_THRESHOLDS = {
    OUT_OF_STOCK: 0,
    LOW_STOCK: 10,
} as const;

/**
 * Field names for scoring
 */
export const SEARCHABLE_FIELDS = {
    MATERIAL: 'Material',
    DESCRIPTION: 'Descriere material',
    STORAGE_LOCATION: 'Loc de depozitare',
    STORAGE_DESC: 'Descr.loc.depozitare',
    STOCK: 'Fără restr.',
} as const;
