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

  // Colors (only same-color variants, not different colors)
  ['alb', 'alba'],
  ['negru', 'neagra'],
  ['gri', 'cenusiu'],
  // Note: 'verde', 'rosu', 'galben', 'albastru' are NOT synonyms of each other
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
 * Expands all keywords in a query with their synonyms
 */
export function expandQueryWithSynonyms(keywords: string[]): string[] {
  const allKeywords = new Set<string>();

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase().trim();
    allKeywords.add(lowerKeyword);

    // Check each synonym group
    for (const group of SYNONYM_GROUPS) {
      if (group.some(word => word === lowerKeyword)) {
        // Add all synonyms from this group
        group.forEach(synonym => {
          if (synonym !== lowerKeyword) {
            allKeywords.add(synonym);
          }
        });
        break; // Found the group, no need to continue
      }
    }

    // Check for abbreviations
    if (ABBREVIATIONS[lowerKeyword as keyof typeof ABBREVIATIONS]) {
      const fullForm = ABBREVIATIONS[lowerKeyword as keyof typeof ABBREVIATIONS];
      allKeywords.add(fullForm);
    }
  }

  return Array.from(allKeywords);
}

