/**
 * Shared Types for Document Ingestion
 *
 * Common type definitions used across the ingestion pipeline.
 */

// =============================================================================
// RAG Response Types
// =============================================================================

/**
 * A citation from a source document.
 */
export interface Citation {
  /** Source document ID from corpusConfig */
  sourceId: string;
  /** Human-readable source name */
  sourceName: string;
  /** Relevant excerpt from the document */
  excerpt: string;
  /** Page number if available */
  pageNumber?: number;
}

/**
 * A grounded response from the RAG system.
 */
export interface GroundedResponse {
  /** The generated answer text */
  answer: string;
  /** Citations from source documents */
  citations: Citation[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Source documents used */
  sourceIds: string[];
  /** Processing time in ms */
  processingTimeMs?: number;
}

/**
 * Error response from RAG query.
 */
export interface RAGError {
  /** Error code */
  code: "NO_DOCUMENTS" | "API_ERROR" | "INVALID_QUERY" | "TIMEOUT";
  /** Error message */
  message: string;
  /** Additional details */
  details?: string;
}

/**
 * RAG query result - either success or error.
 */
export type RAGResult =
  | { success: true; response: GroundedResponse }
  | { success: false; error: RAGError };

// =============================================================================
// Document Types
// =============================================================================

/**
 * Document status in the ingestion pipeline.
 */
export type DocumentStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "expired"
  | "error";

/**
 * Document category for classification.
 */
export type DocumentCategory =
  | "zoning-codes"
  | "area-plans"
  | "policies"
  | "ordinances"
  | "guides";

/**
 * A document with Gemini file info.
 */
export interface DocumentWithGemini {
  sourceId: string;
  title: string;
  category: DocumentCategory;
  geminiFileUri: string;
  geminiFileName: string;
  status: DocumentStatus;
  expiresAt?: number;
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Options for RAG queries.
 */
export interface RAGQueryOptions {
  /** Maximum number of documents to include */
  maxDocuments?: number;
  /** Filter by category */
  category?: DocumentCategory;
  /** Specific source IDs to query */
  sourceIds?: string[];
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Model to use */
  modelId?: string;
}

/**
 * Zoning-specific query options.
 */
export interface ZoningQueryOptions {
  /** Specific zoning district code (e.g., "RS6", "LB2") */
  districtCode?: string;
  /** Include use tables */
  includeUseTables?: boolean;
  /** Include dimensional standards */
  includeDimensionalStandards?: boolean;
}
