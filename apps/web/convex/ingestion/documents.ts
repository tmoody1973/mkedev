/**
 * Document Mutations for Ingestion
 *
 * Internal mutations for creating and updating documents in the
 * knowledge base. These are called by the ingestion actions.
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";

// =============================================================================
// Queries
// =============================================================================

/**
 * Get a document by its source URL.
 */
export const getBySourceUrl = query({
  args: { sourceUrl: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_sourceUrl", (q) => q.eq("sourceUrl", args.sourceUrl))
      .unique();
  },
});

/**
 * Get all documents by category.
 */
export const getByCategory = query({
  args: {
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

/**
 * Get all active documents.
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Get all stale documents that need refresh.
 */
export const getStale = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "stale"))
      .collect();
  },
});

/**
 * Get document count by category.
 */
export const getCountByCategory = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();

    const counts: Record<string, number> = {
      "zoning-codes": 0,
      "area-plans": 0,
      policies: 0,
      ordinances: 0,
      guides: 0,
    };

    for (const doc of documents) {
      counts[doc.category] = (counts[doc.category] ?? 0) + 1;
    }

    return counts;
  },
});

// =============================================================================
// Internal Mutations (for ingestion actions)
// =============================================================================

/**
 * Create a new document in the knowledge base.
 * Internal mutation - only callable from actions.
 */
export const createDocument = internalMutation({
  args: {
    title: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    sourceUrl: v.string(),
    sourceDomain: v.optional(v.string()),
    content: v.string(),
    contentPreview: v.optional(v.string()),
    wordCount: v.number(),
    pageCount: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("stale"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      category: args.category,
      sourceUrl: args.sourceUrl,
      sourceDomain: args.sourceDomain,
      content: args.content,
      contentPreview: args.contentPreview,
      lastCrawled: now,
      status: args.status,
      wordCount: args.wordCount,
      pageCount: args.pageCount,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

/**
 * Update or insert a document (upsert).
 * Used for refreshing existing documents.
 */
export const upsertDocument = internalMutation({
  args: {
    title: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    sourceUrl: v.string(),
    sourceDomain: v.optional(v.string()),
    content: v.string(),
    contentPreview: v.optional(v.string()),
    wordCount: v.number(),
    pageCount: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("stale"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if document already exists
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_sourceUrl", (q) => q.eq("sourceUrl", args.sourceUrl))
      .unique();

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, {
        title: args.title,
        category: args.category,
        sourceDomain: args.sourceDomain,
        content: args.content,
        contentPreview: args.contentPreview,
        lastCrawled: now,
        status: args.status,
        wordCount: args.wordCount,
        pageCount: args.pageCount,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new document
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      category: args.category,
      sourceUrl: args.sourceUrl,
      sourceDomain: args.sourceDomain,
      content: args.content,
      contentPreview: args.contentPreview,
      lastCrawled: now,
      status: args.status,
      wordCount: args.wordCount,
      pageCount: args.pageCount,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

/**
 * Update document status.
 * Internal mutation for marking documents as stale or error.
 */
export const updateStatus = internalMutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("active"),
      v.literal("stale"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark documents as stale based on age.
 * Documents older than the threshold will be marked as stale.
 */
export const markStaleDocuments = internalMutation({
  args: {
    maxAgeMs: v.number(), // Maximum age in milliseconds
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const threshold = now - args.maxAgeMs;

    const activeDocuments = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let markedCount = 0;

    for (const doc of activeDocuments) {
      if (doc.lastCrawled < threshold) {
        await ctx.db.patch(doc._id, {
          status: "stale",
          updatedAt: now,
        });
        markedCount++;
      }
    }

    return { markedCount };
  },
});

// =============================================================================
// Public Mutations (for manual operations)
// =============================================================================

/**
 * Delete a document by ID.
 * Public mutation for manual cleanup.
 */
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
    return { success: true };
  },
});

/**
 * Manually mark a document as stale.
 * Triggers re-ingestion on next refresh.
 */
export const markAsStale = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      status: "stale",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Get ingestion statistics.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();

    const stats = {
      total: documents.length,
      active: 0,
      stale: 0,
      error: 0,
      totalWordCount: 0,
      byCategory: {
        "zoning-codes": 0,
        "area-plans": 0,
        policies: 0,
        ordinances: 0,
        guides: 0,
      } as Record<string, number>,
    };

    for (const doc of documents) {
      stats.totalWordCount += doc.wordCount;
      stats.byCategory[doc.category] = (stats.byCategory[doc.category] ?? 0) + 1;

      switch (doc.status) {
        case "active":
          stats.active++;
          break;
        case "stale":
          stats.stale++;
          break;
        case "error":
          stats.error++;
          break;
      }
    }

    return stats;
  },
});
