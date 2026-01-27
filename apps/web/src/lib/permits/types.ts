/**
 * Types for enriched permit forms and design guidelines
 */

export interface FormField {
  name: string;
  type: "text" | "number" | "date" | "checkbox" | "select" | "address" | "signature";
  required: boolean;
  description: string;
  autoFillSource: string | null;
}

export interface EnrichedPermitForm {
  id: string;
  url: string;
  filename: string;
  category: string;
  subcategory: string;

  // Extracted metadata
  officialName: string;
  purpose: string;
  whenRequired: string[];
  prerequisites: string[];
  relatedForms: string[];
  estimatedCompletionTime: string;
  submissionMethod: string[];
  fees: string | null;
  fields: FormField[];
  applicableProjectTypes: string[];
  zoningDistricts: string[];
  triggers: string[];

  enrichedAt: string;
}

export interface DesignRequirement {
  rule: string;
  isRequired: boolean;
  codeReference?: string | null;
}

export interface EnrichedDesignGuideline {
  id: string;
  url: string;
  filename: string;
  category: string;
  subcategory: string;

  // Extracted metadata
  title: string;
  topic: string;
  summary: string;
  applicableZoningDistricts: string[];
  requirements: DesignRequirement[];
  bestPractices: string[];
  illustrations: string[];
  relatedTopics: string[];
  triggers: string[];

  enrichedAt: string;
}

export type ProjectType =
  | "new_construction"
  | "renovation"
  | "addition"
  | "change_of_use"
  | "conversion"
  | "adu"
  | "deck"
  | "fence"
  | "garage"
  | "sign"
  | "home_occupation"
  | "variance"
  | "conditional_use"
  | "demolition";

export interface ProjectContext {
  projectType?: ProjectType | ProjectType[];
  zoningDistrict?: string;
  description?: string;
  keywords?: string[];
  hasParking?: boolean;
  isResidential?: boolean;
  isCommercial?: boolean;
  squareFootage?: number;
  unitCount?: number;
}
