/**
 * Document Ingestion Module
 *
 * This module provides the infrastructure for ingesting documents into
 * the MKE.dev knowledge base. It supports two ingestion methods:
 *
 * 1. **Firecrawl** - For web-based content (neighborhood plans, incentive docs)
 *    - Crawls URLs and extracts markdown content
 *    - Stores content in Convex documents table
 *    - Supports automated daily refresh via cron
 *
 * 2. **Gemini File Search** - For PDF documents (zoning codes, housing element)
 *    - Uploads PDFs to Google Gemini File API
 *    - Enables RAG queries against PDF content
 *    - Files expire after 48 hours and need re-upload
 *
 * ## Usage
 *
 * ### Test API Connections
 * ```typescript
 * // Test Firecrawl connection
 * const result = await ctx.runAction(api.ingestion.firecrawl.testConnection, {});
 *
 * // Test Gemini connection
 * const result = await ctx.runAction(api.ingestion.gemini.testConnection, {});
 * ```
 *
 * ### Ingest a Single Source
 * ```typescript
 * // Ingest by source ID (from corpus config)
 * const result = await ctx.runAction(api.ingestion.trigger.ingestSource, {
 *   sourceId: "neighborhood-plans-index"
 * });
 *
 * // Ingest an ad-hoc URL
 * const result = await ctx.runAction(api.ingestion.trigger.ingestUrl, {
 *   url: "https://example.com/page",
 *   title: "Example Page",
 *   category: "guides"
 * });
 * ```
 *
 * ### Batch Ingestion
 * ```typescript
 * // Ingest all web sources
 * const result = await ctx.runAction(api.ingestion.trigger.ingestAllWebSources, {});
 *
 * // Ingest by category
 * const result = await ctx.runAction(api.ingestion.trigger.ingestByCategory, {
 *   category: "area-plans"
 * });
 * ```
 *
 * ### Query Documents
 * ```typescript
 * // Get document stats
 * const stats = await ctx.runQuery(api.ingestion.documents.getStats, {});
 *
 * // Get documents by category
 * const docs = await ctx.runQuery(api.ingestion.documents.getByCategory, {
 *   category: "zoning-codes"
 * });
 * ```
 *
 * ### Gemini RAG Queries
 * ```typescript
 * // Query with a single PDF
 * const result = await ctx.runAction(api.ingestion.gemini.queryWithFile, {
 *   fileUri: "gs://...",
 *   query: "What are the setback requirements for RS6 zones?"
 * });
 *
 * // Query with multiple PDFs
 * const result = await ctx.runAction(api.ingestion.gemini.queryWithMultipleFiles, {
 *   fileUris: ["gs://...", "gs://..."],
 *   query: "Compare residential and commercial parking requirements"
 * });
 * ```
 *
 * ## Corpus Configuration
 *
 * The corpus is configured in `corpusConfig.ts`. Each source has:
 * - `id`: Unique identifier
 * - `title`: Human-readable name
 * - `category`: Classification for organization
 * - `method`: Either "firecrawl" or "gemini-file-search"
 * - `source`: URL or file path
 * - `autoRefresh`: Whether to include in daily cron refresh
 * - `priority`: Ingestion order (1 = highest)
 *
 * ## Cron Jobs
 *
 * Defined in `../crons.ts`:
 * - Daily: Refresh web sources at 3:00 AM UTC
 * - Weekly: Check Gemini file statuses on Monday at 4:00 AM UTC
 * - Weekly: Mark stale documents on Sunday at 2:00 AM UTC
 */

// Re-export types from corpus config
export type {
  IngestionMethod,
  DocumentCategory,
  CorpusSource,
} from "./corpusConfig";

// Re-export utility functions from corpus config
export {
  PDF_SOURCES,
  WEB_SOURCES,
  ALL_SOURCES,
  AUTO_REFRESH_SOURCES,
  getSourcesByMethod,
  getSourcesByCategory,
  getSourceById,
} from "./corpusConfig";
