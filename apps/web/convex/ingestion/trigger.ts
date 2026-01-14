/**
 * Manual Ingestion Triggers
 *
 * Actions for on-demand document ingestion. These can be called
 * from the dashboard or API to trigger ingestion of specific sources.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import {
  getSourceById,
  getSourcesByMethod,
  getSourcesByCategory,
  ALL_SOURCES,
  type CorpusSource,
} from "./corpus-config";

// =============================================================================
// Types
// =============================================================================

interface TriggerResult {
  success: boolean;
  sourceId: string;
  method: string;
  message: string;
  error?: string;
}

// =============================================================================
// Single Source Triggers
// =============================================================================

/**
 * Trigger ingestion for a single source by ID.
 * This is the main manual trigger action.
 */
export const ingestSource = action({
  args: {
    sourceId: v.string(),
  },
  handler: async (ctx, args): Promise<TriggerResult> => {
    const source = getSourceById(args.sourceId);

    if (!source) {
      return {
        success: false,
        sourceId: args.sourceId,
        method: "unknown",
        message: "Source not found",
        error: `No source found with ID: ${args.sourceId}`,
      };
    }

    try {
      if (source.method === "firecrawl") {
        // Use Firecrawl for web sources
        const result = await ctx.runAction(api.ingestion.firecrawl.ingestUrl, {
          url: source.source,
          title: source.title,
          category: source.category,
        });

        if (!result.success) {
          return {
            success: false,
            sourceId: source.id,
            method: "firecrawl",
            message: "Firecrawl ingestion failed",
            error: result.error,
          };
        }

        return {
          success: true,
          sourceId: source.id,
          method: "firecrawl",
          message: `Successfully ingested: ${source.title}`,
        };
      } else if (source.method === "gemini-file-search") {
        // For Gemini File Search, return instructions
        // PDF upload requires file content which must be provided separately
        return {
          success: false,
          sourceId: source.id,
          method: "gemini-file-search",
          message:
            "PDF sources require uploadPdfFromBase64 action with file content",
          error:
            "Use the gemini.uploadPdfFromBase64 action with the PDF content encoded as base64",
        };
      }

      return {
        success: false,
        sourceId: source.id,
        method: source.method,
        message: "Unknown ingestion method",
        error: `Unsupported method: ${source.method}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        sourceId: source.id,
        method: source.method,
        message: "Ingestion failed with exception",
        error: errorMessage,
      };
    }
  },
});

/**
 * Trigger ingestion for a URL not in the corpus configuration.
 * Useful for ad-hoc ingestion of new sources.
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
  handler: async (ctx, args): Promise<TriggerResult> => {
    try {
      const result = await ctx.runAction(api.ingestion.firecrawl.ingestUrl, {
        url: args.url,
        title: args.title,
        category: args.category,
      });

      if (!result.success) {
        return {
          success: false,
          sourceId: "ad-hoc",
          method: "firecrawl",
          message: "URL ingestion failed",
          error: result.error,
        };
      }

      return {
        success: true,
        sourceId: "ad-hoc",
        method: "firecrawl",
        message: `Successfully ingested: ${args.url}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        sourceId: "ad-hoc",
        method: "firecrawl",
        message: "URL ingestion failed with exception",
        error: errorMessage,
      };
    }
  },
});

// =============================================================================
// Batch Triggers
// =============================================================================

/**
 * Trigger ingestion for all web sources (Firecrawl).
 */
export const ingestAllWebSources = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    results: TriggerResult[];
  }> => {
    const webSources = getSourcesByMethod("firecrawl");
    const results: TriggerResult[] = [];

    for (const source of webSources) {
      try {
        const result = await ctx.runAction(api.ingestion.firecrawl.ingestUrl, {
          url: source.source,
          title: source.title,
          category: source.category,
        });

        results.push({
          success: result.success,
          sourceId: source.id,
          method: "firecrawl",
          message: result.success
            ? `Ingested: ${source.title}`
            : "Ingestion failed",
          error: result.error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          success: false,
          sourceId: source.id,
          method: "firecrawl",
          message: "Exception during ingestion",
          error: errorMessage,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      total: webSources.length,
      succeeded,
      failed,
      results,
    };
  },
});

/**
 * Trigger ingestion for sources in a specific category.
 */
export const ingestByCategory = action({
  args: {
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    methodFilter: v.optional(
      v.union(v.literal("firecrawl"), v.literal("gemini-file-search"))
    ),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
    results: TriggerResult[];
  }> => {
    let sources = getSourcesByCategory(args.category);

    // Filter by method if specified
    if (args.methodFilter) {
      sources = sources.filter((s) => s.method === args.methodFilter);
    }

    const results: TriggerResult[] = [];
    let skipped = 0;

    for (const source of sources) {
      // Skip Gemini sources (require file upload)
      if (source.method === "gemini-file-search") {
        skipped++;
        results.push({
          success: false,
          sourceId: source.id,
          method: source.method,
          message: "Skipped - requires file upload",
        });
        continue;
      }

      try {
        const result = await ctx.runAction(api.ingestion.firecrawl.ingestUrl, {
          url: source.source,
          title: source.title,
          category: source.category,
        });

        results.push({
          success: result.success,
          sourceId: source.id,
          method: "firecrawl",
          message: result.success
            ? `Ingested: ${source.title}`
            : "Ingestion failed",
          error: result.error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          success: false,
          sourceId: source.id,
          method: "firecrawl",
          message: "Exception during ingestion",
          error: errorMessage,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success && !r.message.includes("Skipped")).length;

    return {
      success: failed === 0,
      total: sources.length,
      succeeded,
      failed,
      skipped,
      results,
    };
  },
});

// =============================================================================
// Status and Listing
// =============================================================================

/**
 * List all configured corpus sources.
 */
export const listSources = action({
  args: {
    method: v.optional(
      v.union(v.literal("firecrawl"), v.literal("gemini-file-search"))
    ),
    category: v.optional(
      v.union(
        v.literal("zoning-codes"),
        v.literal("area-plans"),
        v.literal("policies"),
        v.literal("ordinances"),
        v.literal("guides")
      )
    ),
  },
  handler: async (_, args): Promise<{
    sources: Array<{
      id: string;
      title: string;
      category: string;
      method: string;
      source: string;
      autoRefresh: boolean;
      priority: number;
    }>;
    total: number;
  }> => {
    let sources: CorpusSource[] = ALL_SOURCES;

    if (args.method) {
      sources = sources.filter((s) => s.method === args.method);
    }

    if (args.category) {
      sources = sources.filter((s) => s.category === args.category);
    }

    return {
      sources: sources.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        method: s.method,
        source: s.source,
        autoRefresh: s.autoRefresh,
        priority: s.priority,
      })),
      total: sources.length,
    };
  },
});

/**
 * Get ingestion status summary.
 * Combines corpus configuration with actual document data.
 */
export const getIngestionStatus = action({
  args: {},
  handler: async (ctx): Promise<{
    corpus: {
      totalSources: number;
      pdfSources: number;
      webSources: number;
      autoRefreshSources: number;
    };
    documents: {
      total: number;
      active: number;
      stale: number;
      error: number;
    };
    byCategory: Record<string, { configured: number; ingested: number }>;
  }> => {
    // Get document stats
    const stats = await ctx.runQuery(api.ingestion.documents.getStats, {});

    // Calculate corpus stats
    const pdfSources = getSourcesByMethod("gemini-file-search").length;
    const webSources = getSourcesByMethod("firecrawl").length;
    const autoRefreshSources = ALL_SOURCES.filter((s) => s.autoRefresh).length;

    // Calculate by-category stats
    const categories = [
      "zoning-codes",
      "area-plans",
      "policies",
      "ordinances",
      "guides",
    ] as const;
    const byCategory: Record<string, { configured: number; ingested: number }> =
      {};

    for (const cat of categories) {
      byCategory[cat] = {
        configured: getSourcesByCategory(cat).length,
        ingested: stats.byCategory[cat] ?? 0,
      };
    }

    return {
      corpus: {
        totalSources: ALL_SOURCES.length,
        pdfSources,
        webSources,
        autoRefreshSources,
      },
      documents: {
        total: stats.total,
        active: stats.active,
        stale: stats.stale,
        error: stats.error,
      },
      byCategory,
    };
  },
});
