/**
 * Citation Utilities
 *
 * Functions for parsing citation markers from text and enhancing
 * RAG citations with document URLs for the PDF viewer.
 */

import { matchDocumentUrl, ZONING_CODE_DOCS, AREA_PLAN_DOCS } from './documentUrls';

// =============================================================================
// Types
// =============================================================================

/**
 * Raw citation from RAG response (groundingMetadata).
 */
export interface RawCitation {
  sourceId: string;
  sourceName: string;
  excerpt: string;
}

/**
 * Enhanced citation with URL info for display and PDF viewer.
 */
export interface EnhancedCitation {
  index: number;                                    // 1-based index for [N] display
  sourceId: string;                                 // Original source identifier
  sourceName: string;                               // Original filename
  title: string;                                    // Human-readable title
  excerpt: string;                                  // Quoted text from source
  documentUrl: string;                              // URL to PDF in public folder
  pageNumber?: number;                              // Page to open (if available)
  category: 'zoning-codes' | 'area-plans' | 'other';
}

/**
 * Parsed segment from citation text parsing.
 */
export interface CitationSegment {
  type: 'text' | 'citation';
  value: string;
  citationIndex?: number;  // 1-based index if type is 'citation'
}

// =============================================================================
// Citation Text Parsing
// =============================================================================

/**
 * Parse text with [N] citation markers into segments.
 *
 * @example
 * parseCitationMarkers("The zone requires parking [1] per section [2].")
 * // Returns:
 * // [
 * //   { type: 'text', value: 'The zone requires parking ' },
 * //   { type: 'citation', value: '[1]', citationIndex: 1 },
 * //   { type: 'text', value: ' per section ' },
 * //   { type: 'citation', value: '[2]', citationIndex: 2 },
 * //   { type: 'text', value: '.' },
 * // ]
 */
export function parseCitationMarkers(text: string): CitationSegment[] {
  if (!text) return [];

  // Split on citation patterns [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        return {
          type: 'citation' as const,
          value: part,
          citationIndex: parseInt(match[1], 10),
        };
      }
      return {
        type: 'text' as const,
        value: part,
      };
    });
}

/**
 * Check if text contains any citation markers.
 */
export function hasCitationMarkers(text: string): boolean {
  return /\[\d+\]/.test(text);
}

/**
 * Get all citation indices from text.
 */
export function extractCitationIndices(text: string): number[] {
  const matches = text.matchAll(/\[(\d+)\]/g);
  const indices = new Set<number>();
  for (const match of matches) {
    indices.add(parseInt(match[1], 10));
  }
  return Array.from(indices).sort((a, b) => a - b);
}

// =============================================================================
// Citation Enhancement
// =============================================================================

/**
 * Enhance raw RAG citations with document URLs and display info.
 *
 * @param rawCitations - Citations from RAG groundingMetadata
 * @returns Enhanced citations with URLs ready for display
 */
export function enhanceCitations(rawCitations: RawCitation[]): EnhancedCitation[] {
  if (!rawCitations || rawCitations.length === 0) {
    return [];
  }

  return rawCitations.map((citation, index) => {
    // Try to match source to a known document
    const docInfo = matchDocumentUrl(citation.sourceName);

    // Determine category from URL or default
    let category: 'zoning-codes' | 'area-plans' | 'other' = 'other';
    if (docInfo?.url) {
      if (docInfo.url.includes('/zoning-code/')) {
        category = 'zoning-codes';
      } else if (docInfo.url.includes('/area-plans/')) {
        category = 'area-plans';
      }
    }

    return {
      index: index + 1,
      sourceId: citation.sourceId,
      sourceName: citation.sourceName,
      title: docInfo?.title || formatSourceName(citation.sourceName),
      excerpt: citation.excerpt || '',
      documentUrl: docInfo?.url || '#',
      category,
    };
  });
}

/**
 * Format a source name for display when no match is found.
 */
function formatSourceName(sourceName: string): string {
  // Remove file extension
  let name = sourceName.replace(/\.[^.]+$/, '');

  // Replace hyphens/underscores with spaces
  name = name.replace(/[-_]/g, ' ');

  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, (c) => c.toUpperCase());

  return name;
}

/**
 * Get citation by index from enhanced citations array.
 */
export function getCitationByIndex(
  citations: EnhancedCitation[],
  index: number
): EnhancedCitation | undefined {
  return citations.find((c) => c.index === index);
}

/**
 * Group citations by category for display in footer.
 */
export function groupCitationsByCategory(
  citations: EnhancedCitation[]
): Record<string, EnhancedCitation[]> {
  const groups: Record<string, EnhancedCitation[]> = {
    'zoning-codes': [],
    'area-plans': [],
    other: [],
  };

  for (const citation of citations) {
    groups[citation.category].push(citation);
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, arr]) => arr.length > 0)
  );
}

// =============================================================================
// Document Info
// =============================================================================

/**
 * Get all available documents for reference.
 */
export function getAllDocuments() {
  return {
    zoningCodes: Object.values(ZONING_CODE_DOCS),
    areaPlans: Object.values(AREA_PLAN_DOCS),
  };
}

/**
 * Get category display name.
 */
export function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'zoning-codes':
      return 'Zoning Code';
    case 'area-plans':
      return 'Area Plans';
    default:
      return 'Other Sources';
  }
}
