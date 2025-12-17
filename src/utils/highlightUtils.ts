export interface TextSegment {
  text: string;
  isHighlighted: boolean;
  type?: 'search' | 'diameter' | 'code' | 'thread';
}

// Pre-compiled regex patterns for diameter detection
const DIAMETER_PATTERNS = [
  // Fractions with quotes: 3/8", 1/2", 1 1/4"
  /(\d+\s+\d+\/\d+["''])/gi,
  /(\d+\/\d+["''])/gi,
  // Diameter symbol: Ø20, Ø20mm, Ø 20 mm
  /Ø\s*(\d+(?:[.,]\d+)?)\s*(mm)?/gi,
  // DN notation: DN20, DN 20
  /DN\s*(\d+)/gi,
  // Dimensions: 20x30mm, 20 x 30 mm
  /(\d+)\s*x\s*(\d+)\s*mm/gi,
  // Simple mm: 20mm, 20 mm (but be cautious with false positives)
  /\b(\d+)\s*mm\b/gi,
];

// Pre-compiled regex patterns for thread type detection (FE/FI)
const THREAD_PATTERNS = [
  // FE (Filet Exterior - External Thread)
  /\bF[EI]-F[EI]\b/gi,  // FE-FE, FI-FI, FE-FI, FI-FE
  /\bF[EI]\b/gi,        // FE or FI standalone
];

/**
 * Detects diameter values in text and returns both highlighted segments and extracted diameters
 */
export function detectDiameters(text: string): {
  segments: TextSegment[];
  diameters: string[];
} {
  const diameters: string[] = [];
  const matches: Array<{ start: number; end: number; text: string }> = [];

  // Find all diameter matches
  for (const pattern of DIAMETER_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const start = match.index;
      const end = start + matchText.length;

      // Check for overlapping matches
      const overlaps = matches.some(m =>
        (start >= m.start && start < m.end) ||
        (end > m.start && end <= m.end)
      );

      if (!overlaps) {
        matches.push({ start, end, text: matchText });

        // Extract the actual diameter value for the diameters array
        if (!diameters.includes(matchText)) {
          diameters.push(matchText);
        }
      }
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: TextSegment[] = [];
  let currentPos = 0;

  for (const match of matches) {
    // Add text before the match
    if (currentPos < match.start) {
      segments.push({
        text: text.substring(currentPos, match.start),
        isHighlighted: false,
      });
    }

    // Add the highlighted diameter
    segments.push({
      text: match.text,
      isHighlighted: true,
      type: 'diameter',
    });

    currentPos = match.end;
  }

  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      isHighlighted: false,
    });
  }

  // If no matches, return the entire text as a single segment
  if (segments.length === 0) {
    segments.push({
      text,
      isHighlighted: false,
    });
  }

  return { segments, diameters };
}

/**
 * Highlights search keywords in text segments
 * This function can work on plain text or on segments from diameter detection
 */
export function highlightSearchTerms(
  text: string,
  keywords: string[]
): TextSegment[];

export function highlightSearchTerms(
  segments: TextSegment[],
  keywords: string[]
): TextSegment[];

export function highlightSearchTerms(
  input: string | TextSegment[],
  keywords: string[]
): TextSegment[] {
  // Handle empty keywords
  if (!keywords || keywords.length === 0) {
    if (typeof input === 'string') {
      return [{ text: input, isHighlighted: false }];
    }
    return input;
  }

  // Convert string input to segments
  const inputSegments: TextSegment[] = typeof input === 'string'
    ? [{ text: input, isHighlighted: false }]
    : input;

  // Process each segment
  const resultSegments: TextSegment[] = [];

  for (const segment of inputSegments) {
    // Don't highlight within already highlighted diameter segments
    if (segment.isHighlighted && segment.type === 'diameter') {
      resultSegments.push(segment);
      continue;
    }

    // Find all keyword matches in this segment
    const matches: Array<{ start: number; end: number; keyword: string }> = [];
    const lowerText = segment.text.toLowerCase();

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      let index = 0;

      while ((index = lowerText.indexOf(lowerKeyword, index)) !== -1) {
        const end = index + lowerKeyword.length;

        // Check for overlapping matches (prioritize longer matches)
        const overlaps = matches.some(m =>
          (index >= m.start && index < m.end) ||
          (end > m.start && end <= m.end)
        );

        if (!overlaps) {
          matches.push({ start: index, end, keyword: lowerKeyword });
        }

        index = end;
      }
    }

    // If no matches in this segment, keep it as is
    if (matches.length === 0) {
      resultSegments.push(segment);
      continue;
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Build sub-segments with highlights
    let currentPos = 0;
    for (const match of matches) {
      // Add text before the match
      if (currentPos < match.start) {
        resultSegments.push({
          text: segment.text.substring(currentPos, match.start),
          isHighlighted: false,
        });
      }

      // Add the highlighted keyword
      resultSegments.push({
        text: segment.text.substring(match.start, match.end),
        isHighlighted: true,
        type: 'search',
      });

      currentPos = match.end;
    }

    // Add remaining text
    if (currentPos < segment.text.length) {
      resultSegments.push({
        text: segment.text.substring(currentPos),
        isHighlighted: false,
      });
    }
  }

  return resultSegments;
}

/**
 * Checks if a text matches the product code format (8-digit numeric string)
 */
export function isProductCode(text: string): boolean {
  return /^\d{8}$/.test(text.trim());
}

/**
 * Detects thread types (FE/FI) in text
 */
export function detectThreadTypes(text: string): {
  segments: TextSegment[];
  threads: string[];
} {
  const threads: string[] = [];
  const matches: Array<{ start: number; end: number; text: string }> = [];

  // Find all thread matches
  for (const pattern of THREAD_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const start = match.index;
      const end = start + matchText.length;

      // Check for overlapping matches
      const overlaps = matches.some(m =>
        (start >= m.start && start < m.end) ||
        (end > m.start && end <= m.end)
      );

      if (!overlaps) {
        matches.push({ start, end, text: matchText });

        if (!threads.includes(matchText.toUpperCase())) {
          threads.push(matchText.toUpperCase());
        }
      }
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: TextSegment[] = [];
  let currentPos = 0;

  for (const match of matches) {
    // Add text before the match
    if (currentPos < match.start) {
      segments.push({
        text: text.substring(currentPos, match.start),
        isHighlighted: false,
      });
    }

    // Add the highlighted thread type
    segments.push({
      text: match.text,
      isHighlighted: true,
      type: 'thread',
    });

    currentPos = match.end;
  }

  // Add remaining text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      isHighlighted: false,
    });
  }

  // If no matches, return the entire text as a single segment
  if (segments.length === 0) {
    segments.push({
      text,
      isHighlighted: false,
    });
  }

  return { segments, threads };
}

/**
 * Combines diameter detection, thread detection, and search term highlighting
 * First detects diameters and threads, then highlights search terms in the remaining text
 */
export function highlightTextWithDiameters(
  text: string,
  searchKeywords: string[]
): {
  segments: TextSegment[];
  diameters: string[];
  threads: string[];
} {
  // First, detect and highlight diameters
  const { segments: diameterSegments, diameters } = detectDiameters(text);

  // Then, detect and highlight thread types on the diameter segments
  let threadSegments: TextSegment[] = [];
  const threads: string[] = [];

  for (const segment of diameterSegments) {
    if (segment.isHighlighted && segment.type === 'diameter') {
      // Keep diameter segments as is
      threadSegments.push(segment);
    } else {
      // Check for thread types in non-diameter segments
      const { segments: newSegments, threads: foundThreads } = detectThreadTypes(segment.text);
      threadSegments = threadSegments.concat(newSegments);
      foundThreads.forEach(t => {
        if (!threads.includes(t)) threads.push(t);
      });
    }
  }

  // Finally, highlight search terms
  const finalSegments = highlightSearchTerms(threadSegments, searchKeywords);

  return { segments: finalSegments, diameters, threads };
}
