// =============================================================================
// Core Data Types
// =============================================================================

export interface Conversation {
  id: string
  title: string
  isStarred: boolean
  createdAt: string
  updatedAt: string
  messageCount: number
  preview: string
  messages?: Message[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  inputMode?: 'text' | 'voice'
  cards?: GenerativeCard[]
}

// =============================================================================
// Generative UI Card Types
// =============================================================================

export type GenerativeCard =
  | { type: 'zoneInfoCard'; data: ZoneInfoCardData }
  | { type: 'parcelAnalysisCard'; data: ParcelAnalysisCardData }
  | { type: 'incentivesSummaryCard'; data: IncentivesSummaryCardData }
  | { type: 'areaPlanContextCard'; data: AreaPlanContextCardData }
  | { type: 'permitProcessCard'; data: PermitProcessCardData }
  | { type: 'codeCitationCard'; data: CodeCitationCardData }
  | { type: 'opportunityListCard'; data: OpportunityListCardData }

export interface ZoneInfoCardData {
  zoneCode: string
  zoneName: string
  description: string
  maxHeight: string
  minLotSize: string
  maxLotCoverage: string
  frontSetback: string
  sideSetback: string
  rearSetback: string
  aduPermitted: boolean
  codeSection: string
}

export interface ParcelAnalysisCardData {
  address: string
  taxKey: string
  lotSize: string
  currentUse: string
  feasibilityStatus: 'permitted' | 'conditional' | 'prohibited'
  proposedUse: string
  requirements: string[]
  nextSteps: string[]
}

export interface Incentive {
  name: string
  type: string
  amount: string
  description: string
  eligibility: string
  status: 'eligible' | 'not-applicable' | 'requires-review'
}

export interface IncentivesSummaryCardData {
  address: string
  incentives: Incentive[]
  totalPotentialValue: string
  recommendation: string
}

export interface AreaPlanContextCardData {
  planName: string
  adoptedDate: string
  futureLandUse: string
  alignmentScore: number
  communityGoals: string[]
  relevantRecommendations: string[]
  concerns: string[]
}

export interface PermitStep {
  step: number
  name: string
  description: string
  duration: string
  fee: string
  status: 'required' | 'optional' | 'completed'
}

export interface ContactInfo {
  department: string
  phone: string
  email: string
  address: string
}

export interface PermitProcessCardData {
  projectType: string
  totalSteps: number
  estimatedTimeline: string
  steps: PermitStep[]
  contactInfo: ContactInfo
}

export interface CodeCitationCardData {
  codeSection: string
  title: string
  excerpt: string
  sourceDocument: string
  lastUpdated: string
  relevance: string
}

export interface Opportunity {
  id: string
  address: string
  lotSize: string
  zoning: string
  askingPrice: string
  owner: string
  incentives: string[]
  matchScore: number
}

export interface OpportunityListCardData {
  searchCriteria: string
  resultCount: number
  opportunities: Opportunity[]
}

// =============================================================================
// Voice State
// =============================================================================

export interface VoiceState {
  isActive: boolean
  waveformData: number[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface ConversationalInterfaceProps {
  /** List of all conversations for the history sidebar */
  conversations: Conversation[]
  /** The currently active conversation with full message history */
  activeConversation: Conversation | null
  /** Current voice input state */
  voiceState: VoiceState
  /** Called when user sends a text message */
  onSendMessage?: (content: string) => void
  /** Called when user triggers voice input */
  onVoiceInput?: () => void
  /** Called when user stops voice input */
  onVoiceStop?: () => void
  /** Called when user selects a conversation from history */
  onSelectConversation?: (conversationId: string) => void
  /** Called when user stars/unstars a conversation */
  onToggleStar?: (conversationId: string) => void
  /** Called when user deletes a conversation */
  onDeleteConversation?: (conversationId: string) => void
  /** Called when user searches conversations */
  onSearchConversations?: (query: string) => void
  /** Called when user starts a new conversation */
  onNewConversation?: () => void
  /** Called when user clicks a location on the map (triggers context query) */
  onMapClick?: (lat: number, lng: number, address?: string) => void
  /** Called when user interacts with a generative UI card */
  onCardAction?: (cardType: string, action: string, data: unknown) => void
}

export interface ChatPanelProps {
  /** Messages to display in the chat */
  messages: Message[]
  /** Whether the assistant is currently responding */
  isLoading?: boolean
  /** Called when user sends a message */
  onSendMessage?: (content: string) => void
  /** Called when user triggers voice input */
  onVoiceInput?: () => void
  /** Current voice state for visual feedback */
  voiceState?: VoiceState
}

export interface HistorySidebarProps {
  /** All conversations to display */
  conversations: Conversation[]
  /** ID of the currently active conversation */
  activeConversationId?: string
  /** Whether the sidebar is open */
  isOpen: boolean
  /** Called when user closes the sidebar */
  onClose?: () => void
  /** Called when user selects a conversation */
  onSelectConversation?: (conversationId: string) => void
  /** Called when user toggles star on a conversation */
  onToggleStar?: (conversationId: string) => void
  /** Called when user deletes a conversation */
  onDeleteConversation?: (conversationId: string) => void
  /** Called when user searches */
  onSearch?: (query: string) => void
  /** Called when user starts a new conversation */
  onNewConversation?: () => void
}

export interface GenerativeCardProps {
  /** The card data to render */
  card: GenerativeCard
  /** Called when user interacts with the card */
  onAction?: (action: string, data: unknown) => void
}
