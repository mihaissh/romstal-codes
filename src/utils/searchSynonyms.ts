/**
 * Romanian product terminology synonyms and aliases
 * Helps users find products even when using different terms
 */

// Synonym groups - words that mean the same thing
const SYNONYM_GROUPS = [
  // Pipe/Tube
  ['teava', 'tub', 'conducta'],

  // Valve/Faucet
  ['robinet', 'ventil', 'vana'],

  // Elbow/Bend
  ['cot', 'curba', 'genunchi'],

  // Reducer
  ['reductie', 'reducere', 'reducator'],

  // Connection/Fitting
  ['imbinare', 'conexiune', 'fitinguri', 'fitting', 'racord'],

  // Tap/Cock
  ['cep', 'robinet', 'kran'],

  // Flange
  ['flansa', 'flanş', 'bride'],

  // Thread
  ['filet', 'filetat'],

  // Ball valve
  ['bila', 'sfera'],

  // Filter
  ['filtru', 'strecuratoare'],

  // Coupling
  ['cuplaj', 'cuplare', 'mufa'],

  // Adapter
  ['adaptor', 'adaptare'],

  // Pipe joint
  ['olandez', 'american', 'niplul'],

  // Cap
  ['capac', 'dop', 'buşon'],

  // Materials
  ['ppr', 'polipropilena'],
  ['pvc', 'policlorura'],
  ['inox', 'otel inoxidabil'],
  ['alama', 'brass'],

  // Colors
  ['alb', 'alba'],
  ['negru', 'neagra'],
  ['gri', 'cenusiu'],
];

// Common abbreviations
const ABBREVIATIONS = {
  'fi': 'filet interior',
  'fe': 'filet exterior',
  'dn': 'diametru nominal',
  'mm': 'milimetri',
  'cm': 'centimetri',
  'm': 'metru',
  'buc': 'bucata',
  'set': 'set',
  'kit': 'kit',
};

/**
 * Expands a search query with synonyms
 * Returns an array of keywords including original and synonyms
 */
export function expandWithSynonyms(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase().trim();
  const expanded = [lowerKeyword];

  // Check each synonym group
  for (const group of SYNONYM_GROUPS) {
    if (group.some(word => word === lowerKeyword)) {
      // Add all synonyms from this group (except the original)
      group.forEach(synonym => {
        if (synonym !== lowerKeyword && !expanded.includes(synonym)) {
          expanded.push(synonym);
        }
      });
      break; // Found the group, no need to continue
    }
  }

  // Check for abbreviations
  if (ABBREVIATIONS[lowerKeyword as keyof typeof ABBREVIATIONS]) {
    const fullForm = ABBREVIATIONS[lowerKeyword as keyof typeof ABBREVIATIONS];
    if (!expanded.includes(fullForm)) {
      expanded.push(fullForm);
    }
  }

  return expanded;
}

/**
 * Expands all keywords in a query with their synonyms
 */
export function expandQueryWithSynonyms(keywords: string[]): string[] {
  const allKeywords = new Set<string>();

  for (const keyword of keywords) {
    const synonyms = expandWithSynonyms(keyword);
    synonyms.forEach(s => allKeywords.add(s));
  }

  return Array.from(allKeywords);
}

/**
 * Get suggestions for a keyword
 * Returns helpful alternatives if the user might be searching for something else
 */
export function getSuggestions(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase().trim();
  const suggestions: string[] = [];

  // Find the synonym group this keyword belongs to
  for (const group of SYNONYM_GROUPS) {
    if (group.some(word => word === lowerKeyword)) {
      // Return other members of the group as suggestions
      group.forEach(synonym => {
        if (synonym !== lowerKeyword) {
          suggestions.push(synonym);
        }
      });
      break;
    }
  }

  return suggestions;
}

/**
 * Get common search terms for autocomplete/help
 */
export function getCommonTerms(): Array<{ term: string; description: string }> {
  return [
    { term: 'teava / tub', description: 'Pipe or tube' },
    { term: 'robinet / ventil', description: 'Valve or faucet' },
    { term: 'cot', description: 'Elbow fitting' },
    { term: 'reductie', description: 'Reducer' },
    { term: 'FI', description: 'Filet Interior (internal thread)' },
    { term: 'FE', description: 'Filet Exterior (external thread)' },
    { term: 'ppr', description: 'Polypropylene pipe' },
    { term: 'inox', description: 'Stainless steel' },
    { term: 'olandez', description: 'American/union joint' },
  ];
}
