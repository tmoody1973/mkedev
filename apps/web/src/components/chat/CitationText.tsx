'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import {
  parseCitationMarkers,
  getCitationByIndex,
  type EnhancedCitation,
} from '@/lib/citations'

// =============================================================================
// Types
// =============================================================================

export interface CitationTextProps {
  /** The text content with [N] citation markers */
  text: string
  /** Enhanced citations with URLs and metadata */
  citations: EnhancedCitation[]
  /** Callback when a citation is clicked */
  onCitationClick: (citation: EnhancedCitation) => void
  /** Additional class names for the container */
  className?: string
}

export interface CitationLinkProps {
  /** The citation index (1-based) */
  index: number
  /** The citation data */
  citation: EnhancedCitation | undefined
  /** Callback when clicked */
  onClick: () => void
  /** Whether this is inside a user message (white text) */
  isUserMessage?: boolean
}

// =============================================================================
// Citation Link Component
// =============================================================================

/**
 * Clickable citation link with hover tooltip.
 */
export function CitationLink({
  index,
  citation,
  onClick,
  isUserMessage = false,
}: CitationLinkProps) {
  if (!citation) {
    // Citation not found - render as plain text
    return (
      <span className="text-stone-400 dark:text-stone-500">[{index}]</span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${citation.title}${citation.excerpt ? `\n\n"${citation.excerpt.slice(0, 150)}..."` : ''}`}
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[1.5rem] px-1 py-0.5 mx-0.5',
        'text-xs font-semibold rounded',
        'transition-all duration-100',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        // Default styling (in assistant messages)
        !isUserMessage && [
          'bg-sky-100 dark:bg-sky-900/40',
          'text-sky-700 dark:text-sky-300',
          'hover:bg-sky-200 dark:hover:bg-sky-800/60',
          'focus:ring-sky-500',
        ],
        // User message styling (needs to be visible on sky-500 background)
        isUserMessage && [
          'bg-white/20',
          'text-white',
          'hover:bg-white/30',
          'focus:ring-white',
        ]
      )}
      aria-label={`Citation ${index}: ${citation.title}`}
    >
      [{index}]
    </button>
  )
}

// =============================================================================
// Citation Text Component
// =============================================================================

/**
 * Renders text with inline clickable citation markers.
 *
 * Parses [N] patterns in the text and renders them as clickable buttons
 * that trigger the onCitationClick callback with the corresponding citation.
 *
 * @example
 * <CitationText
 *   text="Parking requires 1 space per 300 sq ft [1]."
 *   citations={enhancedCitations}
 *   onCitationClick={(citation) => openPdfViewer(citation)}
 * />
 */
export function CitationText({
  text,
  citations,
  onCitationClick,
  className,
}: CitationTextProps) {
  // Parse text into segments
  const segments = parseCitationMarkers(text)

  if (segments.length === 0) {
    return null
  }

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (segment.type === 'citation' && segment.citationIndex !== undefined) {
          const citation = getCitationByIndex(citations, segment.citationIndex)
          return (
            <CitationLink
              key={idx}
              index={segment.citationIndex}
              citation={citation}
              onClick={() => citation && onCitationClick(citation)}
            />
          )
        }

        // Regular text segment
        return <Fragment key={idx}>{segment.value}</Fragment>
      })}
    </span>
  )
}

// =============================================================================
// Sources Footer Component
// =============================================================================

export interface SourcesFooterProps {
  /** Enhanced citations to display */
  citations: EnhancedCitation[]
  /** Callback when a source is clicked */
  onSourceClick: (citation: EnhancedCitation) => void
  /** Additional class names */
  className?: string
}

/**
 * Footer displaying all cited sources below a message.
 */
export function SourcesFooter({
  citations,
  onSourceClick,
  className,
}: SourcesFooterProps) {
  if (citations.length === 0) {
    return null
  }

  // Group citations by category
  const zoningCitations = citations.filter((c) => c.category === 'zoning-codes')
  const areaPlanCitations = citations.filter((c) => c.category === 'area-plans')
  const otherCitations = citations.filter((c) => c.category === 'other')

  return (
    <div
      className={cn(
        'mt-3 pt-3 border-t border-stone-200 dark:border-stone-700',
        className
      )}
    >
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
        Sources:
      </p>

      <div className="flex flex-col gap-2">
        {/* Zoning Code Sources */}
        {zoningCitations.length > 0 && (
          <SourceGroup
            label="Zoning Code"
            citations={zoningCitations}
            onSourceClick={onSourceClick}
          />
        )}

        {/* Area Plan Sources */}
        {areaPlanCitations.length > 0 && (
          <SourceGroup
            label="Area Plans"
            citations={areaPlanCitations}
            onSourceClick={onSourceClick}
          />
        )}

        {/* Other Sources */}
        {otherCitations.length > 0 && (
          <SourceGroup
            label="Other"
            citations={otherCitations}
            onSourceClick={onSourceClick}
          />
        )}
      </div>
    </div>
  )
}

interface SourceGroupProps {
  label: string
  citations: EnhancedCitation[]
  onSourceClick: (citation: EnhancedCitation) => void
}

function SourceGroup({ label, citations, onSourceClick }: SourceGroupProps) {
  return (
    <div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation) => (
          <button
            key={citation.index}
            onClick={() => onSourceClick(citation)}
            className={cn(
              'inline-flex items-center gap-1.5',
              'px-2 py-1 rounded text-xs',
              'bg-stone-100 dark:bg-stone-800',
              'text-stone-700 dark:text-stone-300',
              'hover:bg-stone-200 dark:hover:bg-stone-700',
              'transition-colors duration-100',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1'
            )}
          >
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              [{citation.index}]
            </span>
            <span className="truncate max-w-[200px]">{citation.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CitationText
