// =============================================================================
// Conversational Interface Components
// =============================================================================

// Main composite component
export { ConversationalInterface } from './ConversationalInterface'

// Chat components
export { EnhancedChatPanel } from './EnhancedChatPanel'
export type { EnhancedChatPanelProps } from './EnhancedChatPanel'

// History sidebar
export { HistorySidebar } from './HistorySidebar'

// Voice components
export { VoiceIndicator, InlineWaveform } from './VoiceIndicator'
export type { VoiceIndicatorProps, InlineWaveformProps } from './VoiceIndicator'

// Generative UI cards
export {
  GenerativeCardRenderer,
  ZoneInfoCard,
  ParcelAnalysisCard,
  IncentivesSummaryCard,
  AreaPlanContextCard,
  PermitProcessCard,
  CodeCitationCard,
  OpportunityListCard,
} from './GenerativeCards'
export type { GenerativeCardRendererProps } from './GenerativeCards'

// Re-export types for convenience
export type {
  Conversation,
  Message,
  VoiceState,
  GenerativeCard,
  ZoneInfoCardData,
  ParcelAnalysisCardData,
  IncentivesSummaryCardData,
  AreaPlanContextCardData,
  PermitProcessCardData,
  CodeCitationCardData,
  OpportunityListCardData,
  ConversationalInterfaceProps,
  ChatPanelProps,
  HistorySidebarProps,
  GenerativeCardProps,
} from '../../../../product/sections/conversational-interface/types'
