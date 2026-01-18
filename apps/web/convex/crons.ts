/**
 * Convex Cron Jobs
 *
 * Scheduled tasks for automated document maintenance and data sync.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// =============================================================================
// Document Ingestion Crons
// =============================================================================

/**
 * Daily check for expired Gemini files.
 * Runs at 6:00 AM UTC every day.
 *
 * Gemini files expire after 48 hours. This cron:
 * 1. Marks documents with expired files as "expired"
 * 2. Logs status for monitoring
 *
 * Note: Actual re-upload of expired files should be triggered
 * manually using the upload-docs script, since it requires
 * local file access.
 */
crons.daily(
  "mark-expired-documents",
  { hourUTC: 6, minuteUTC: 0 },
  internal.ingestion.documents.markExpiredDocuments
);

/**
 * Weekly check of Gemini file statuses.
 * Runs every Monday at 4:00 AM UTC.
 *
 * This cron job:
 * 1. Lists all files in Gemini File API
 * 2. Checks for expired or failed files
 * 3. Reports status for monitoring
 */
crons.weekly(
  "check-gemini-files",
  { dayOfWeek: "monday", hourUTC: 4, minuteUTC: 0 },
  internal.ingestion.gemini.checkFileStatuses
);

// =============================================================================
// Homes MKE Data Sync Crons
// =============================================================================

/**
 * Weekly sync of Homes MKE properties from ESRI FeatureServer.
 * Runs every Monday at 6:00 AM UTC.
 *
 * This cron job:
 * 1. Fetches all properties from Homes_MKE_Properties FeatureServer
 * 2. Converts UTM coordinates to WGS84
 * 3. Upserts records to homesForSale table
 * 4. Marks properties no longer in the feed as "sold"
 *
 * Source: https://services1.arcgis.com/5ly0cVV70qsN8Soc/arcgis/rest/services/Homes_MKE_Properties/FeatureServer/0
 */
crons.weekly(
  "sync-homes-mke",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.ingestion.homesSync.syncFromESRI
);

// =============================================================================
// Commercial Properties & Development Sites Sync Crons
// =============================================================================

/**
 * Weekly sync of commercial properties from Browse.ai.
 * Runs every Monday at 7:00 AM UTC (1 hour after Homes MKE sync).
 *
 * This cron job:
 * 1. Fetches completed tasks from Browse.ai Commercial Properties robot
 * 2. Geocodes addresses via Mapbox
 * 3. Upserts records to commercialProperties table
 *
 * Browse.ai Robot: 019bd1dc-df2e-7747-8e54-142a383e8822
 */
crons.weekly(
  "sync-commercial-properties",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 },
  internal.ingestion.commercialSync.syncCommercialProperties
);

/**
 * Weekly sync of development sites from Browse.ai.
 * Runs every Monday at 7:30 AM UTC (30 min after commercial properties sync).
 *
 * This cron job:
 * 1. Fetches completed tasks from Browse.ai Development Sites robot
 * 2. Geocodes addresses via Mapbox
 * 3. Upserts records to developmentSites table
 *
 * Browse.ai Robot: 019bd1ff-bd45-7594-a466-ed701e505915
 */
crons.weekly(
  "sync-development-sites",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 30 },
  internal.ingestion.commercialSync.syncDevelopmentSites
);

export default crons;
