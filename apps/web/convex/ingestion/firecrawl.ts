/**
 * Firecrawl Ingestion Actions
 *
 * Convex actions for crawling web content using the Firecrawl API.
 * These actions handle web-based document sources like neighborhood plans
 * and incentive documentation.
 */

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// Types
// =============================================================================

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

interface IngestionResult {
  success: boolean;
  documentId?: string;
  error?: string;
  metadata?: {
    title: string;
    wordCount: number;
    sourceUrl: string;
  };
}

// =============================================================================
// Firecrawl API Client
// =============================================================================

/**
 * Create Firecrawl API headers with authentication.
 */
function getFirecrawlHeaders(): HeadersInit {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Scrape a single URL using Firecrawl API.
 */
async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: getFirecrawlHeaders(),
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Firecrawl API error: ${response.status} - ${errorText}`,
    };
  }

  const result = await response.json();
  return result as FirecrawlScrapeResult;
}

// =============================================================================
// Public Actions
// =============================================================================

/**
 * Test the Firecrawl API connection with a sample URL.
 * Returns connection status and basic scrape results.
 */
export const testConnection = action({
  args: {
    testUrl: v.optional(v.string()),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    message: string;
    data?: {
      title?: string;
      contentLength?: number;
    };
  }> => {
    const url = args.testUrl ?? "https://city.milwaukee.gov/DCD/Planning/Zoning";

    try {
      const result = await scrapeUrl(url);

      if (!result.success) {
        return {
          success: false,
          message: result.error ?? "Unknown error during scraping",
        };
      }

      const content = result.data?.markdown ?? result.data?.content ?? "";
      const title = result.data?.metadata?.title ?? "Untitled";

      return {
        success: true,
        message: "Firecrawl API connection successful",
        data: {
          title,
          contentLength: content.length,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to connect to Firecrawl API: ${errorMessage}`,
      };
    }
  },
});

/**
 * Scrape a single URL and store the content in the documents table.
 * This is the main ingestion action for web-based content.
 */
export const ingestUrl = action({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
  },
  handler: async (ctx, args): Promise<IngestionResult> => {
    try {
      // Scrape the URL
      const result = await scrapeUrl(args.url);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error ?? "Failed to scrape URL",
        };
      }

      const content = result.data.markdown ?? result.data.content ?? "";
      const title =
        args.title ?? result.data.metadata?.title ?? "Untitled Document";

      if (!content || content.length === 0) {
        return {
          success: false,
          error: "No content extracted from URL",
        };
      }

      // Calculate word count
      const wordCount = content
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      // Extract domain for sourceDomain field
      const urlObj = new URL(args.url);
      const sourceDomain = urlObj.hostname;

      // Create content preview (first 500 characters)
      const contentPreview = content.slice(0, 500);

      // Store in Convex documents table via internal mutation
      const documentId = await ctx.runMutation(
        internal.ingestion.documents.createDocument,
        {
          sourceId: `web-${sourceDomain}-${Date.now()}`,
          title,
          category: args.category,
          sourceUrl: args.url,
          sourceDomain,
          sourceType: "web",
        }
      );

      return {
        success: true,
        documentId,
        metadata: {
          title,
          wordCount,
          sourceUrl: args.url,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Ingestion failed: ${errorMessage}`,
      };
    }
  },
});

/**
 * Batch ingest multiple URLs.
 * Useful for ingesting all sources of a specific category.
 */
export const batchIngestUrls = action({
  args: {
    sources: v.array(
      v.object({
        url: v.string(),
        title: v.string(),
        category: v.union(
          v.literal("zoning-codes"),
          v.literal("area-plans"),
          v.literal("policies"),
          v.literal("ordinances"),
          v.literal("guides")
        ),
      })
    ),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    results: Array<{
      url: string;
      success: boolean;
      error?: string;
    }>;
    summary: {
      total: number;
      succeeded: number;
      failed: number;
    };
  }> => {
    const results: Array<{
      url: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const source of args.sources) {
      try {
        const result = await scrapeUrl(source.url);

        if (!result.success || !result.data) {
          results.push({
            url: source.url,
            success: false,
            error: result.error ?? "Failed to scrape",
          });
          continue;
        }

        const content = result.data.markdown ?? result.data.content ?? "";

        if (!content || content.length === 0) {
          results.push({
            url: source.url,
            success: false,
            error: "No content extracted",
          });
          continue;
        }

        const wordCount = content
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        const urlObj = new URL(source.url);
        const sourceDomain = urlObj.hostname;
        const contentPreview = content.slice(0, 500);

        await ctx.runMutation(internal.ingestion.documents.createDocument, {
          sourceId: `web-${sourceDomain}-${Date.now()}`,
          title: source.title,
          category: source.category,
          sourceUrl: source.url,
          sourceDomain,
          sourceType: "web",
        });

        results.push({
          url: source.url,
          success: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          url: source.url,
          success: false,
          error: errorMessage,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      results,
      summary: {
        total: args.sources.length,
        succeeded,
        failed,
      },
    };
  },
});

/**
 * Internal action for scheduled refresh of web sources.
 * Called by the cron job to refresh auto-refresh enabled sources.
 */
export const refreshWebSources = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    refreshed: number;
    failed: number;
    errors: string[];
  }> => {
    // Import corpus config dynamically to get auto-refresh sources
    const { AUTO_REFRESH_SOURCES } = await import("./corpusConfig");

    const webSources = AUTO_REFRESH_SOURCES.filter(
      (source) => source.method === "firecrawl"
    );

    let refreshed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const source of webSources) {
      try {
        const result = await scrapeUrl(source.source);

        if (!result.success || !result.data) {
          failed++;
          errors.push(`${source.id}: ${result.error ?? "Unknown error"}`);
          continue;
        }

        const content = result.data.markdown ?? result.data.content ?? "";

        if (!content || content.length === 0) {
          failed++;
          errors.push(`${source.id}: No content extracted`);
          continue;
        }

        const wordCount = content
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        const urlObj = new URL(source.source);
        const sourceDomain = urlObj.hostname;
        const contentPreview = content.slice(0, 500);

        // Upsert document (update if exists, create if not)
        await ctx.runMutation(internal.ingestion.documents.upsertDocument, {
          sourceId: source.id,
          title: source.title,
          category: source.category,
          sourceUrl: source.source,
          sourceDomain,
          sourceType: "web",
        });

        refreshed++;
      } catch (error) {
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`${source.id}: ${errorMessage}`);
      }
    }

    return {
      success: failed === 0,
      refreshed,
      failed,
      errors,
    };
  },
});
