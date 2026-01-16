/**
 * Planning Documents - Convex Mutations and Queries
 *
 * CRUD operations for planning documents crawled by the ADK agent.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";

// =============================================================================
// Validators
// =============================================================================

const contentTypeValidator = v.union(v.literal("html"), v.literal("pdf"));

const categoryValidator = v.union(
  v.literal("home-building"),
  v.literal("vacant-lots"),
  v.literal("commercial"),
  v.literal("overlay-zones"),
  v.literal("design-guidelines")
);

const syncFrequencyValidator = v.union(
  v.literal("weekly"),
  v.literal("monthly")
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("crawling"),
  v.literal("crawled"),
  v.literal("uploading"),
  v.literal("indexed"),
  v.literal("error")
);

// =============================================================================
// Queries
// =============================================================================

/**
 * Get a planning document by its source ID.
 */
export const getBySourceId = query({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("planningDocuments")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();
  },
});

/**
 * Get all planning documents by category.
 */
export const listByCategory = query({
  args: { category: categoryValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("planningDocuments")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

/**
 * Get all planning documents by status.
 */
export const listByStatus = query({
  args: { status: statusValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("planningDocuments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Get all planning documents by sync frequency.
 */
export const listBySyncFrequency = query({
  args: { syncFrequency: syncFrequencyValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("planningDocuments")
      .withIndex("by_syncFrequency", (q) =>
        q.eq("syncFrequency", args.syncFrequency)
      )
      .collect();
  },
});

/**
 * Get all planning documents.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("planningDocuments").collect();
  },
});

/**
 * Check if content has changed by comparing hash.
 */
export const checkContentHash = query({
  args: {
    sourceId: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("planningDocuments")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();

    if (!doc) {
      return { exists: false, changed: true };
    }

    return {
      exists: true,
      changed: doc.contentHash !== args.contentHash,
      currentHash: doc.contentHash,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Upsert a planning document (create or update).
 */
export const upsert = mutation({
  args: {
    sourceId: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    contentType: contentTypeValidator,
    category: categoryValidator,
    syncFrequency: syncFrequencyValidator,
    markdownContent: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    contentHash: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("planningDocuments")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, {
        sourceUrl: args.sourceUrl,
        title: args.title,
        contentType: args.contentType,
        category: args.category,
        syncFrequency: args.syncFrequency,
        markdownContent: args.markdownContent,
        pdfStorageId: args.pdfStorageId,
        contentHash: args.contentHash,
        status: args.status,
        lastCrawledAt: now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new document
      return await ctx.db.insert("planningDocuments", {
        sourceId: args.sourceId,
        sourceUrl: args.sourceUrl,
        title: args.title,
        contentType: args.contentType,
        category: args.category,
        syncFrequency: args.syncFrequency,
        markdownContent: args.markdownContent,
        pdfStorageId: args.pdfStorageId,
        contentHash: args.contentHash,
        status: args.status,
        lastCrawledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Update document status.
 */
export const updateStatus = mutation({
  args: {
    sourceId: v.string(),
    status: statusValidator,
    errorMessage: v.optional(v.string()),
    geminiFileUri: v.optional(v.string()),
    fileSearchStoreId: v.optional(v.id("fileSearchStores")),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("planningDocuments")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }

    if (args.geminiFileUri !== undefined) {
      updates.geminiFileUri = args.geminiFileUri;
      updates.lastUploadedAt = now;
    }

    if (args.fileSearchStoreId !== undefined) {
      updates.fileSearchStoreId = args.fileSearchStoreId;
    }

    await ctx.db.patch(doc._id, updates);
    return doc._id;
  },
});

/**
 * Internal mutation for bulk status updates (used by crons).
 */
export const bulkUpdateStatus = internalMutation({
  args: {
    sourceIds: v.array(v.string()),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let updated = 0;

    for (const sourceId of args.sourceIds) {
      const doc = await ctx.db
        .query("planningDocuments")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
        .first();

      if (doc) {
        await ctx.db.patch(doc._id, {
          status: args.status,
          updatedAt: now,
        });
        updated++;
      }
    }

    return { updated };
  },
});

/**
 * Delete a planning document by source ID.
 */
export const deleteBySourceId = mutation({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("planningDocuments")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();

    if (doc) {
      await ctx.db.delete(doc._id);
      return true;
    }
    return false;
  },
});
