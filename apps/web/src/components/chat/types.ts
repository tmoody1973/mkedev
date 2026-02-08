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
  | 'vacant-lot'
  | 'vacant-lots-list'
  | 'permit-forms-list'
  | 'permit-recommendations'
  | 'permit-form-details'
  | 'design-guidelines-list'
  | 'design-guideline-details'
  | 'document-upload'
  | 'compliance-report'
  | 'site-analysis'

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
// Permit Form Card Data Interfaces
// =============================================================================

/**
 * Permit form item for permit-forms-list card.
 */
export interface PermitFormListItem {
  id: string
  officialName: string
  purpose: string
  category: string
  subcategory: string
  url: string
  estimatedCompletionTime?: string
  fees?: string | null
}

/**
 * Data interface for permit-forms-list card type.
 */
export interface PermitFormsListCardData {
  forms: PermitFormListItem[]
  query?: string
  totalResults?: number
}

/**
 * Data interface for permit-recommendations card type.
 */
export interface PermitRecommendationsCardData {
  recommendations: PermitFormListItem[]
  projectDescription?: string
  projectType?: string
}

/**
 * Data interface for permit-form-details card type.
 */
export interface PermitFormDetailsCardData {
  id: string
  officialName: string
  purpose: string
  category: string
  subcategory: string
  url: string
  filename: string
  whenRequired: string[]
  prerequisites: string[]
  relatedForms: string[]
  estimatedCompletionTime: string
  submissionMethod: string[]
  fees: string | null
  applicableProjectTypes: string[]
  zoningDistricts: string[]
  triggers: string[]
}

// =============================================================================
// Design Guideline Card Data Interfaces
// =============================================================================

/**
 * Design guideline item for design-guidelines-list card.
 */
export interface DesignGuidelineListItem {
  id: string
  title: string
  topic: string
  summary: string
  category: string
  subcategory: string
  url: string
}

/**
 * Data interface for design-guidelines-list card type.
 */
export interface DesignGuidelinesListCardData {
  guidelines: DesignGuidelineListItem[]
  query?: string
  totalResults?: number
}

/**
 * Design requirement in guideline details.
 */
export interface DesignRequirementData {
  rule: string
  isRequired: boolean
  codeReference?: string | null
}

/**
 * Data interface for design-guideline-details card type.
 */
export interface DesignGuidelineDetailsCardData {
  id: string
  title: string
  topic: string
  summary: string
  category: string
  subcategory: string
  url: string
  filename: string
  applicableZoningDistricts: string[]
  requirements: DesignRequirementData[]
  bestPractices: string[]
  illustrations: string[]
  relatedTopics: string[]
  triggers: string[]
}

// =============================================================================
// Document Upload Card Data Interfaces
// =============================================================================

/**
 * Classification result for an uploaded document.
 */
export interface DocumentClassification {
  type:
    | 'site_plan'
    | 'floor_plan'
    | 'elevation'
    | 'project_narrative'
    | 'variance_application'
    | 'conditional_use_application'
    | 'traffic_study'
    | 'environmental_assessment'
    | 'survey'
    | 'unknown'
  confidence: number
  summary: string
  extractedData: {
    projectAddress?: string
    proposedUse?: string
    buildingHeight?: string
    stories?: number
    unitCount?: number
    squareFootage?: number
    parkingSpaces?: number
    lotSize?: string
  }
}

/**
 * Parcel context enriched from geocoding and zoning queries.
 */
export interface ParcelContextData {
  address?: string
  coordinates?: [number, number]
  zoningDistrict?: string
  zoningCategory?: string
  overlayZones?: string[]
  incentiveZones?: string[]
  areaPlan?: string
  lotSize?: number
}

/**
 * Data interface for document-upload card type.
 * Displays upload progress, classification results, and analysis trigger.
 */
export interface DocumentUploadCardData {
  documentId: string
  filename: string
  mimeType: string
  status:
    | 'uploading'
    | 'classifying'
    | 'classified'
    | 'enriching'
    | 'analyzing'
    | 'complete'
    | 'error'
  classification?: DocumentClassification
  parcelContext?: ParcelContextData
  errorMessage?: string
}

// =============================================================================
// Compliance Report Card Data Interfaces
// =============================================================================

/**
 * Dimensional compliance item in the compliance report.
 */
export interface DimensionalComplianceItem {
  requirement: string
  standard: string
  proposed: string
  status: 'compliant' | 'variance_required' | 'non_compliant'
  notes?: string
}

/**
 * Use compliance item in the compliance report.
 */
export interface UseComplianceItem {
  use: string
  permissionLevel: 'permitted' | 'conditional' | 'prohibited'
  notes?: string
}

/**
 * Area plan alignment data in the compliance report.
 */
export interface AreaPlanAlignmentData {
  score: number
  alignedElements: string[]
  concerns: string[]
  recommendations: string[]
}

/**
 * Variance item in the compliance report.
 */
export interface VarianceRequiredItem {
  type: string
  standardRequired: string
  proposed: string
  hardshipBasis: string
  approvalLikelihood: 'high' | 'medium' | 'low'
  precedentNotes?: string
}

/**
 * Incentive opportunity item in the compliance report.
 */
export interface IncentiveOpportunityItem {
  program: string
  eligibility: 'eligible' | 'possibly_eligible' | 'not_eligible'
  estimatedBenefit?: string
  requirements?: string
  nextSteps?: string
}

/**
 * Recommended next step in the compliance report.
 */
export interface RecommendedNextStep {
  step: number
  action: string
  rationale: string
}

/**
 * Risk assessment item in the compliance report.
 */
export interface RiskAssessmentItem {
  risk: string
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

/**
 * Full compliance analysis result structure.
 * Matches the shape of complianceAnalyses.analysis from Gemini output.
 */
export interface ComplianceAnalysisResult {
  executiveSummary: string
  overallStatus: 'compliant' | 'variances_required' | 'non_compliant'
  approvalPathway: string
  estimatedTimeline: string
  dimensionalCompliance: DimensionalComplianceItem[]
  useCompliance: UseComplianceItem[]
  areaPlanAlignment?: AreaPlanAlignmentData
  variancesRequired: VarianceRequiredItem[]
  incentiveOpportunities: IncentiveOpportunityItem[]
  recommendedNextSteps: RecommendedNextStep[]
  riskAssessment: RiskAssessmentItem[]
}

/**
 * Data interface for compliance-report card type.
 * Displays the full compliance analysis report in the chat.
 */
export interface ComplianceReportCardData {
  documentId: string
  address: string
  zoningDistrict: string
  analysisDate: string
  overallStatus: 'compliant' | 'variances_required' | 'non_compliant'
  analysis: ComplianceAnalysisResult
}

// =============================================================================
// Site Analysis Card Data Interfaces
// =============================================================================

/**
 * Site description from visual analysis.
 */
export interface SiteDescriptionData {
  lotCharacteristics?: string
  existingConditions?: string
  topography?: string
  vegetation?: string
}

/**
 * Context analysis from visual site assessment.
 */
export interface ContextAnalysisData {
  adjacentBuildings?: string
  neighborhoodCharacter?: string
  streetType?: string
  pedestrianEnvironment?: string
}

/**
 * Development potential assessment from visual site analysis.
 */
export interface DevelopmentPotentialData {
  suitableUses?: string[]
  estimatedCapacity?: string
  designConsiderations?: string[]
  challenges?: string[]
  opportunities?: string[]
}

/**
 * Data interface for site-analysis card type.
 * Displays structured site analysis results from image assessment.
 */
export interface SiteAnalysisCardData {
  imageStorageId: string
  siteDescription: SiteDescriptionData
  contextAnalysis: ContextAnalysisData
  developmentPotential: DevelopmentPotentialData
  questionsToInvestigate: string[]
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

/**
 * Type guard to check if card data is DocumentUploadCardData
 */
export function isDocumentUploadCardData(
  data: unknown
): data is DocumentUploadCardData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.documentId === 'string' && typeof d.filename === 'string'
}

/**
 * Type guard to check if card data is ComplianceReportCardData
 */
export function isComplianceReportCardData(
  data: unknown
): data is ComplianceReportCardData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.documentId === 'string' && typeof d.overallStatus === 'string' && d.analysis !== undefined
}

/**
 * Type guard to check if card data is SiteAnalysisCardData
 */
export function isSiteAnalysisCardData(
  data: unknown
): data is SiteAnalysisCardData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.imageStorageId === 'string' && Array.isArray(d.questionsToInvestigate)
}
