// =============================================================================
// MKE.dev Core Data Model Types
// =============================================================================

// -----------------------------------------------------------------------------
// Parcel — A specific piece of property
// -----------------------------------------------------------------------------

export interface Parcel {
  id: string
  taxKey: string
  address: string
  city: string
  state: string
  zipCode: string
  coordinates: [number, number] // [longitude, latitude]
  lotSize: number // square feet
  zoningDistrictId: string
  incentiveZoneIds: string[]
  areaPlanId?: string
  owner?: string
  assessedValue?: number
  landUse?: string
}

// -----------------------------------------------------------------------------
// ZoningDistrict — Classification defining permitted uses
// -----------------------------------------------------------------------------

export interface ZoningDistrict {
  id: string
  code: string // e.g., "RS6", "LB2", "RM4"
  name: string
  category: 'residential' | 'commercial' | 'industrial' | 'mixed-use' | 'special'
  description: string
  permittedUses: string[]
  conditionalUses: string[]
  dimensionalStandards: DimensionalStandards
  color: string // for map display
}

export interface DimensionalStandards {
  maxHeight: number // feet
  maxStories?: number
  minLotSize: number // square feet
  minLotWidth: number // feet
  maxLotCoverage: number // percentage (0-100)
  setbacks: {
    front: number
    side: number
    rear: number
  }
  maxFAR?: number // Floor Area Ratio
}

// -----------------------------------------------------------------------------
// IncentiveZone — Geographic area with financial incentives
// -----------------------------------------------------------------------------

export interface IncentiveZone {
  id: string
  name: string
  type: 'tif' | 'opportunity-zone' | 'bid' | 'nid' | 'empowerment-zone' | 'other'
  description: string
  benefits: string[]
  expirationDate?: string
  totalInvestment?: number
  boundaryGeojson?: string // GeoJSON polygon
}

// -----------------------------------------------------------------------------
// AreaPlan — Neighborhood planning document
// -----------------------------------------------------------------------------

export interface AreaPlan {
  id: string
  name: string
  neighborhood: string
  adoptedDate: string
  summary: string
  goals: string[]
  landUseRecommendations: string[]
  documentUrl?: string
  boundaryGeojson?: string
}

// -----------------------------------------------------------------------------
// Conversation & Query — Chat interactions
// -----------------------------------------------------------------------------

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  starred: boolean
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  inputMode?: 'text' | 'voice'
  parcelId?: string
  cards?: GenerativeCard[]
  agentContributions?: AgentContribution[]
}

export interface Query {
  id: string
  conversationId: string
  messageId: string
  text: string
  timestamp: string
  parcelId?: string
  queryType: 'zoning' | 'incentives' | 'feasibility' | 'permit' | 'general'
}

// -----------------------------------------------------------------------------
// Generative UI Cards
// -----------------------------------------------------------------------------

export type GenerativeCardType =
  | 'zone-info'
  | 'parcel-analysis'
  | 'incentives-summary'
  | 'area-plan-context'
  | 'permit-process'
  | 'code-citation'
  | 'opportunity-list'

export interface GenerativeCard {
  type: GenerativeCardType
  data: Record<string, unknown>
}

export interface ZoneInfoCardData {
  zoningDistrict: ZoningDistrict
  parcel?: Parcel
}

export interface ParcelAnalysisCardData {
  parcel: Parcel
  zoningDistrict: ZoningDistrict
  incentiveZones: IncentiveZone[]
  areaPlan?: AreaPlan
  feasibilityScore?: number
}

export interface IncentivesSummaryCardData {
  incentiveZones: IncentiveZone[]
  totalPotentialBenefits?: string
}

export interface AreaPlanContextCardData {
  areaPlan: AreaPlan
  relevantGoals: string[]
  alignmentScore?: number
}

export interface PermitProcessCardData {
  requiredPermits: Permit[]
  estimatedTimeline: string
  totalFees?: number
}

export interface Permit {
  name: string
  department: string
  description: string
  estimatedDays: number
  fee?: number
}

export interface CodeCitationCardData {
  citations: CodeCitation[]
}

export interface CodeCitation {
  source: string
  section: string
  excerpt: string
  documentId: string
  pageNumber?: number
}

export interface OpportunityListCardData {
  opportunities: ParcelOpportunity[]
  searchCriteria: string
}

export interface ParcelOpportunity {
  parcel: Parcel
  matchScore: number
  highlights: string[]
}

// -----------------------------------------------------------------------------
// Agent Intelligence
// -----------------------------------------------------------------------------

export type AgentId =
  | 'zoning-interpreter'
  | 'incentives-navigator'
  | 'feasibility-analyst'
  | 'design-advisor'
  | 'permit-pathfinder'
  | 'compliance-checker'

export interface Agent {
  id: AgentId
  name: string
  icon: string
  description: string
  specialty: string
  status: 'idle' | 'active' | 'completed' | 'error'
}

export interface AgentContribution {
  agentId: AgentId
  agentName: string
  finding: string
  confidence: number
  sources: SourceCitation[]
  processingTime: number // milliseconds
}

export interface SourceCitation {
  documentId: string
  documentTitle: string
  excerpt: string
  pageNumber?: number
  url?: string
}

// -----------------------------------------------------------------------------
// FeasibilityReport
// -----------------------------------------------------------------------------

export interface FeasibilityReport {
  id: string
  parcelId: string
  parcel: Parcel
  createdAt: string
  projectType: string
  zoningCompliance: ComplianceStatus
  incentivesAvailable: IncentiveZone[]
  areaPlanAlignment?: {
    areaPlan: AreaPlan
    alignmentScore: number
    recommendations: string[]
  }
  permitsRequired: Permit[]
  overallFeasibility: 'high' | 'medium' | 'low'
  summary: string
  agentContributions: AgentContribution[]
}

export interface ComplianceStatus {
  isCompliant: boolean
  issues: string[]
  variancesNeeded: string[]
}

// -----------------------------------------------------------------------------
// ArchitecturalPreview
// -----------------------------------------------------------------------------

export interface ArchitecturalPreview {
  id: string
  parcelId: string
  parcel: Parcel
  conversationId?: string
  createdAt: string
  prompt: string
  buildingType: 'adu' | 'duplex' | 'mixed-use' | 'single-family' | 'multi-family' | 'commercial'
  style: 'cream-city-brick' | 'modern' | 'industrial' | 'victorian' | 'contemporary'
  stories: number
  squareFootage: number
  imageUrl: string
  beforeImageUrl?: string
  complianceCheck: ArchitecturalComplianceCheck
}

export interface ArchitecturalComplianceCheck {
  heightCompliant: boolean
  maxHeight: number
  proposedHeight: number
  setbacksCompliant: boolean
  setbacks: {
    front: { required: number; proposed: number; compliant: boolean }
    side: { required: number; proposed: number; compliant: boolean }
    rear: { required: number; proposed: number; compliant: boolean }
  }
  lotCoverageCompliant: boolean
  maxLotCoverage: number
  proposedLotCoverage: number
  designOverlayCompliant?: boolean
  designOverlayNotes?: string
}

// -----------------------------------------------------------------------------
// Document (Knowledge Base)
// -----------------------------------------------------------------------------

export interface Document {
  id: string
  title: string
  category: 'zoning-codes' | 'area-plans' | 'policies' | 'ordinances' | 'guides'
  sourceUrl: string
  sourceDomain: string
  content: string
  contentPreview: string
  lastCrawled: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'stale' | 'error'
  wordCount: number
  pageCount?: number
}

export interface DocumentSource {
  id: string
  name: string
  domain: string
  url: string
  status: 'synced' | 'syncing' | 'error' | 'stale'
  lastSync: string
  documentCount: number
  errorMessage?: string
}

export interface CorpusStats {
  totalDocuments: number
  totalSources: number
  lastSync: string
  totalWordCount: number
  categoryCounts: Record<string, number>
}
