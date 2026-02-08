/**
 * Query Complexity Classifier
 *
 * Classifies user queries into thinking levels using regex-based heuristics.
 * Used to show the ThinkingIndicator UI in the chat panel and optionally
 * set the Gemini thinkingConfig.thinkingLevel.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Thinking level for Gemini API and UI display.
 */
export type ThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Configuration for each thinking level: label, color, and icon name.
 */
export interface ThinkingLevelConfig {
  label: string
  color: string
  icon: 'Zap' | 'MessageCircle' | 'Search' | 'Brain'
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Thinking level display configuration.
 * Maps each level to a human-readable label, Tailwind color name, and lucide icon.
 */
export const THINKING_LEVEL_CONFIG: Record<ThinkingLevel, ThinkingLevelConfig> = {
  MINIMAL: { label: 'Quick Lookup', color: 'green', icon: 'Zap' },
  LOW: { label: 'Standard', color: 'blue', icon: 'MessageCircle' },
  MEDIUM: { label: 'Analyzing', color: 'amber', icon: 'Search' },
  HIGH: { label: 'Deep Analysis', color: 'purple', icon: 'Brain' },
}

// =============================================================================
// Patterns
// =============================================================================

/**
 * MINIMAL: Quick lookups, simple factual questions.
 */
const MINIMAL_PATTERNS = /^(what is|what's|is .+ allowed|show me|list|what are the|where is|how much|how many)\b/i

/**
 * HIGH: Complex analysis, feasibility studies, compliance checks.
 */
const HIGH_PATTERNS = /\b(can i build|analyze|feasibility|compliance|compare|what if|should i|is it possible to|evaluate|assess|review my|check if|deep dive)\b/i

/**
 * MEDIUM: Explanatory questions requiring moderate reasoning.
 */
const MEDIUM_PATTERNS = /\b(how|why|explain|requirements for|process for|what happens if|tell me about the rules|walk me through|describe the)\b/i

/**
 * Word count threshold for bumping LOW to MEDIUM on longer queries.
 */
const MEDIUM_WORD_COUNT_THRESHOLD = 20

// =============================================================================
// Classifier
// =============================================================================

/**
 * Classify a user query into a thinking level based on regex heuristics.
 *
 * Priority order:
 * 1. HIGH patterns (analysis, feasibility, compliance)
 * 2. MINIMAL patterns (quick lookups, simple facts)
 * 3. MEDIUM patterns (explanatory how/why questions)
 * 4. Fallback: word count > 20 -> MEDIUM, else LOW
 */
export function classifyQueryComplexity(query: string): ThinkingLevel {
  const trimmed = query.trim()

  if (!trimmed) {
    return 'LOW'
  }

  // Check HIGH patterns first (most specific intent)
  if (HIGH_PATTERNS.test(trimmed)) {
    return 'HIGH'
  }

  // Check MINIMAL patterns (simple lookups)
  if (MINIMAL_PATTERNS.test(trimmed)) {
    return 'MINIMAL'
  }

  // Check MEDIUM patterns (explanatory questions)
  if (MEDIUM_PATTERNS.test(trimmed)) {
    return 'MEDIUM'
  }

  // Fallback: use word count as a proxy for complexity
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > MEDIUM_WORD_COUNT_THRESHOLD) {
    return 'MEDIUM'
  }

  return 'LOW'
}
