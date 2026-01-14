/**
 * Convex Cron Jobs
 *
 * Scheduled tasks for automated document ingestion and maintenance.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// =============================================================================
// Document Ingestion Crons
// =============================================================================

/**
 * Daily refresh of web-based document sources.
 * Runs at 3:00 AM UTC every day to refresh Firecrawl sources.
 *
 * This cron job:
 * 1. Fetches all auto-refresh enabled web sources
 * 2. Re-crawls each source using Firecrawl
 * 3. Updates the documents table with fresh content
 */
crons.daily(
  "refresh-web-sources",
  { hourUTC: 3, minuteUTC: 0 },
  internal.ingestion.firecrawl.refreshWebSources
);

/**
 * Weekly check of Gemini file statuses.
 * Runs every Monday at 4:00 AM UTC.
 *
 * This cron job:
 * 1. Lists all files in Gemini File API
 * 2. Checks for expired or failed files
 * 3. Reports status for monitoring
 *
 * Note: Gemini files expire after 48 hours, so this is mainly
 * for monitoring and alerting purposes.
 */
crons.weekly(
  "check-gemini-files",
  { dayOfWeek: "monday", hourUTC: 4, minuteUTC: 0 },
  internal.ingestion.gemini.checkFileStatuses
);

/**
 * Weekly document staleness check.
 * Runs every Sunday at 2:00 AM UTC.
 *
 * This cron job:
 * 1. Checks all active documents
 * 2. Marks documents older than 7 days as stale
 * 3. Stale documents will be re-ingested on next refresh
 */
crons.weekly(
  "mark-stale-documents",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.ingestion.documents.markStaleDocuments,
  { maxAgeMs: 7 * 24 * 60 * 60 * 1000 } // 7 days
);

export default crons;
