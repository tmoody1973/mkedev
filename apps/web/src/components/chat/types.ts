/**
 * Chat Types for MKE.dev
 *
 * Defines types for generative UI cards, messages, and agent status.
 */

import type { RawCitation } from '@/lib/citations'

// =============================================================================
// Generative Card Types
// =============================================================================

/**
 * All supported generative card types.
 * Each type corresponds to a specific UI component rendered in chat.
 */
export type GenerativeCardType =
  | 'zone-info'
  | 'parcel-info'
  | 'parcel-analysis'
  | 'incentives-summary'
  | 'area-plan-context'
  | 'permit-process'
  | 'code-citation'
  | 'opportunity-list'
  | 'home-listing'
  | 'homes-list'
  | 'commercial-property'
  | 'commercial-properties-list'
  | 'development-site'
  | 'development-sites-list'

/**
 * Generative card type for rendering UI components within messages.
 * Maps to the cards field in the Convex messages schema.
 */
export interface GenerativeCard {
  type: GenerativeCardType
  data: unknown
}

// =============================================================================
// Home Card Data Interfaces
// =============================================================================

/**
 * Data interface for home-listing card type.
 * Matches HomeCardProps from copilot/HomeCard.tsx.
 */
export interface HomeListingCardData {
  // Location
  address: string
  neighborhood?: string
  coordinates?: [number, number] // [lng, lat]

  // Property details
  bedrooms?: number
  fullBaths?: number
  halfBaths?: number
  buildingSqFt?: number
  yearBuilt?: number

  // Listing info
  narrative?: string
  listingUrl?: string

  // Home ID for map highlighting
  homeId?: string
}

/**
 * Home list item for homes-list card.
 * Matches HomeListItem from copilot/HomesListCard.tsx.
 */
export interface HomeListItemData {
  id: string
  address: string
  neighborhood: string
  coordinates: [number, number] // [lng, lat]
  bedrooms: number
  fullBaths: number
  halfBaths: number
}

/**
 * Data interface for homes-list card type.
 * Matches HomesListCardProps from copilot/HomesListCard.tsx.
 */
export interface HomesListCardData {
  homes: HomeListItemData[]
}

// =============================================================================
// Agent Status Types
// =============================================================================

/**
 * Agent status for real-time activity display.
 */
export interface AgentStatus {
  status:
    | 'idle'
    | 'thinking'
    | 'executing_tool'
    | 'generating_response'
    | 'complete'
    | 'error'
  currentTool?: string
  currentToolArgs?: Record<string, unknown>
  toolsCompleted: Array<{ name: string; success: boolean; timestamp: number }>
  statusMessage?: string
  error?: string
}

// =============================================================================
// Message Types
// =============================================================================

/**
 * Message structure for chat display.
 * Supports user, assistant, and system roles with optional generative UI cards.
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  inputMode?: 'text' | 'voice'
  cards?: GenerativeCard[]
  /** Raw citations from RAG response (groundingMetadata) */
  citations?: RawCitation[]
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if card data is HomeListingCardData
 */
export function isHomeListingCardData(
  data: unknown
): data is HomeListingCardData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.address === 'string'
}

/**
 * Type guard to check if card data is HomesListCardData
 */
export function isHomesListCardData(data: unknown): data is HomesListCardData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return Array.isArray(d.homes)
}
