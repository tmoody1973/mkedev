// =============================================================================
// Data Types
// =============================================================================

/** Building type preset option */
export interface BuildingType {
  id: string
  label: string
  description: string
}

/** Architectural style preset option */
export interface BuildingStyle {
  id: string
  label: string
  description: string
}

/** Story count option */
export interface StoryOption {
  value: number
  label: string
}

/** Parameters used to generate a visualization */
export interface VisualizationParameters {
  buildingType: string
  style: string
  stories: number
  squareFootage: number
  features: string[]
}

/** Zoning constraints for a parcel */
export interface ZoningConstraints {
  zoningDistrict: string
  maxHeight: number
  maxHeightUnit: string
  rearSetback: number
  sideSetback: number
  frontSetback: number
  setbackUnit: string
  maxLotCoverage: number
  maxFootprint: number
  footprintUnit: string
  designOverlay: string | null
  historicDistrict: boolean
}

/** Individual compliance check result */
export interface ComplianceCheck {
  id: string
  label: string
  requirement: string
  actual: string
  isCompliant: boolean
}

/** Status of visualization generation */
export type GenerationStatus = 'idle' | 'analyzing' | 'fetching' | 'generating' | 'completed' | 'error'

/** State info for each generation status */
export interface GenerationState {
  message: string
  icon: string
  progress?: number
}

/** A complete visualization result */
export interface Visualization {
  id: string
  parcelId: string
  address: string
  neighborhood: string
  prompt: string
  status: GenerationStatus
  generatedAt: string
  parameters: VisualizationParameters
  beforeImageUrl: string
  afterImageUrl: string
  zoningConstraints: ZoningConstraints
  complianceChecks: ComplianceCheck[]
  voiceNarration: string
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the VisionCard component */
export interface VisionCardProps {
  /** The visualization to display */
  visualization: Visualization
  /** Whether to show before or after image */
  showBefore?: boolean
  /** Called when before/after toggle changes */
  onToggleView?: (showBefore: boolean) => void
  /** Called when user wants to regenerate with different style */
  onRegenerate?: () => void
  /** Called when user wants to save the visualization */
  onSave?: () => void
  /** Called when user wants to share the visualization */
  onShare?: () => void
}

/** Props for the prompt input component */
export interface PromptInputProps {
  /** Current prompt value */
  value: string
  /** Placeholder text */
  placeholder?: string
  /** Whether voice input is active */
  isVoiceActive?: boolean
  /** Whether input is disabled (during generation) */
  isDisabled?: boolean
  /** Called when prompt text changes */
  onChange?: (value: string) => void
  /** Called when user submits the prompt */
  onSubmit?: (prompt: string) => void
  /** Called when voice button is clicked */
  onVoiceToggle?: () => void
}

/** Props for the preset selector component */
export interface PresetSelectorProps {
  /** Available building types */
  buildingTypes: BuildingType[]
  /** Available building styles */
  buildingStyles: BuildingStyle[]
  /** Available story options */
  storyOptions: StoryOption[]
  /** Currently selected building type */
  selectedType?: string
  /** Currently selected style */
  selectedStyle?: string
  /** Currently selected stories */
  selectedStories?: number
  /** Called when building type changes */
  onTypeChange?: (typeId: string) => void
  /** Called when style changes */
  onStyleChange?: (styleId: string) => void
  /** Called when stories changes */
  onStoriesChange?: (stories: number) => void
}

/** Props for the compliance panel component */
export interface CompliancePanelProps {
  /** Zoning constraints for the parcel */
  constraints: ZoningConstraints
  /** Compliance check results */
  checks: ComplianceCheck[]
  /** Whether the panel is expanded */
  isExpanded?: boolean
  /** Called when expand/collapse is toggled */
  onToggleExpand?: () => void
}

/** Props for the generation status indicator */
export interface GenerationStatusProps {
  /** Current generation status */
  status: GenerationStatus
  /** State info for each status */
  states: Record<GenerationStatus, GenerationState>
  /** Progress percentage (0-100) when generating */
  progress?: number
}

/** Props for the main Architectural Visualizer component */
export interface ArchitecturalVisualizerProps {
  /** Demo visualization to display */
  visualization: Visualization
  /** Available building types */
  buildingTypes: BuildingType[]
  /** Available building styles */
  buildingStyles: BuildingStyle[]
  /** Available story options */
  storyOptions: StoryOption[]
  /** Generation state configurations */
  generationStates: Record<GenerationStatus, GenerationState>
  /** Called when user submits a prompt */
  onPromptSubmit?: (prompt: string) => void
  /** Called when presets change */
  onPresetsChange?: (params: Partial<VisualizationParameters>) => void
  /** Called when user wants to regenerate */
  onRegenerate?: () => void
  /** Called when user saves visualization */
  onSave?: () => void
  /** Called when user shares visualization */
  onShare?: () => void
}
