/**
 * Document Management for Gemini Files API
 *
 * Mutations and queries for managing documents in the knowledge base.
 * Documents are uploaded to Gemini Files API and referenced by URI.
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { PDF_SOURCES } from "./corpusConfig";

// =============================================================================
// Types
// =============================================================================

const documentStatus = v.union(
  v.literal("pending"),
  v.literal("uploading"),
  v.literal("uploaded"),
  v.literal("expired"),
  v.literal("error")
);

const documentCategory = v.union(
  v.literal("zoning-codes"),
  v.literal("area-plans"),
  v.literal("policies"),
  v.literal("ordinances"),
  v.literal("guides"),
  v.literal("incentives")
);

// =============================================================================
// Queries
// =============================================================================

/**
 * Get a document by its source ID.
 */
export const getBySourceId = query({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();
  },
});

/**
 * Get all documents by category.
 */
export const getByCategory = query({
  args: { category: documentCategory },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

/**
 * Get all documents by status.
 */
export const getByStatus = query({
  args: { status: documentStatus },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Get all uploaded documents with valid file URIs.
 */
export const getUploaded = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .collect();
  },
});

/**
 * Get all uploaded zoning code documents.
 */
export const getUploadedZoningCodes = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_category_status", (q) =>
        q.eq("category", "zoning-codes").eq("status", "uploaded")
      )
      .collect();
    return docs;
  },
});

/**
 * Get documents that need refresh (expired or expiring soon).
 */
export const getExpiring = query({
  args: { withinMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const threshold = Date.now() + (args.withinMs ?? 6 * 60 * 60 * 1000); // Default 6 hours
    const docs = await ctx.db.query("documents").collect();

    return docs.filter((doc) => {
      if (doc.status === "expired") return true;
      if (doc.status === "uploaded" && doc.expiresAt && doc.expiresAt < threshold) {
        return true;
      }
      return false;
    });
  },
});

/**
 * Get document corpus status summary.
 */
export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

    const status = {
      total: docs.length,
      pending: 0,
      uploading: 0,
      uploaded: 0,
      expired: 0,
      error: 0,
      byCategory: {} as Record<string, number>,
      fileUris: [] as string[],
    };

    for (const doc of docs) {
      // Count by status
      status[doc.status as keyof typeof status]++;

      // Count by category
      status.byCategory[doc.category] = (status.byCategory[doc.category] ?? 0) + 1;

      // Collect file URIs for uploaded docs
      if (doc.status === "uploaded" && doc.geminiFileUri) {
        status.fileUris.push(doc.geminiFileUri);
      }
    }

    return status;
  },
});

/**
 * Get document statistics.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const doc of docs) {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    }

    // Calculate convenience fields
    const uploaded = byStatus["uploaded"] || 0;
    const pending = byStatus["pending"] || 0;
    const error = byStatus["error"] || 0;
    const expired = byStatus["expired"] || 0;

    return {
      total: docs.length,
      active: uploaded, // 'active' means 'uploaded' in context
      stale: expired,
      error,
      pending,
      byStatus,
      byCategory,
    };
  },
});

/**
 * Get all documents with full details.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

// =============================================================================
// Internal Mutations (for actions)
// =============================================================================

/**
 * Seed documents from corpus config.
 * Creates document records for all PDF sources with status: pending.
 */
export const seedFromCorpusConfig = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let skipped = 0;

    for (const source of PDF_SOURCES) {
      // Check if document already exists
      const existing = await ctx.db
        .query("documents")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", source.id))
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new document record
      await ctx.db.insert("documents", {
        sourceId: source.id,
        title: source.title,
        category: source.category,
        description: source.description,
        sourcePath: source.source,
        sourceType: "pdf",
        status: "pending",
        priority: source.priority,
        createdAt: now,
        updatedAt: now,
      });

      created++;
    }

    return { created, skipped, total: PDF_SOURCES.length };
  },
});

/**
 * Create a new document record (internal).
 */
export const createDocument = internalMutation({
  args: {
    sourceId: v.string(),
    title: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    description: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    sourceUrl: v.optional(v.string()), // Alias for sourcePath (web sources)
    sourceDomain: v.optional(v.string()), // Domain for web sources
    sourceType: v.union(v.literal("pdf"), v.literal("web")),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const path = args.sourcePath || args.sourceUrl || "";
    // Note: sourceDomain is accepted but not stored (schema doesn't have it)

    // Check if document already exists
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("documents", {
      sourceId: args.sourceId,
      title: args.title,
      category: args.category,
      description: args.description,
      sourcePath: path,
      sourceType: args.sourceType,
      status: "pending",
      priority: args.priority ?? 10,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Upsert a document (create or update) (internal).
 */
export const upsertDocument = internalMutation({
  args: {
    sourceId: v.string(),
    title: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    description: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    sourceUrl: v.optional(v.string()), // Alias for sourcePath
    sourceDomain: v.optional(v.string()), // Domain for web sources
    sourceType: v.union(v.literal("pdf"), v.literal("web")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("uploading"),
        v.literal("uploaded"),
        v.literal("expired"),
        v.literal("error"),
        v.literal("active") // Alias for 'uploaded'
      )
    ),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const path = args.sourcePath || args.sourceUrl || "";
    // Normalize 'active' to 'uploaded'
    const normalizedStatus = args.status === "active" ? "uploaded" : args.status;
    // Note: sourceDomain is accepted but not stored (schema doesn't have it)

    // Check if document already exists
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (existing) {
      // Update existing document
      await ctx.db.patch(existing._id, {
        title: args.title,
        category: args.category,
        description: args.description,
        sourcePath: path,
        sourceType: args.sourceType,
        status: normalizedStatus ?? existing.status,
        priority: args.priority ?? existing.priority,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new document
    return await ctx.db.insert("documents", {
      sourceId: args.sourceId,
      title: args.title,
      category: args.category,
      description: args.description,
      sourcePath: path,
      sourceType: args.sourceType,
      status: normalizedStatus ?? "pending",
      priority: args.priority ?? 10,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update document with Gemini file info after upload (internal).
 */
export const updateGeminiFileInternal = internalMutation({
  args: {
    sourceId: v.string(),
    geminiFileUri: v.string(),
    geminiFileName: v.string(),
    mimeType: v.string(),
    fileSizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 48 * 60 * 60 * 1000; // 48 hours from now

    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.patch(doc._id, {
      geminiFileUri: args.geminiFileUri,
      geminiFileName: args.geminiFileName,
      mimeType: args.mimeType,
      fileSizeBytes: args.fileSizeBytes,
      uploadedAt: now,
      expiresAt,
      status: "uploaded",
      errorMessage: undefined,
      updatedAt: now,
    });

    return doc._id;
  },
});

/**
 * Update document with Gemini file info after upload (public).
 * Called by the upload script.
 */
export const updateGeminiFile = mutation({
  args: {
    sourceId: v.string(),
    geminiFileUri: v.string(),
    geminiFileName: v.string(),
    mimeType: v.string(),
    fileSizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 48 * 60 * 60 * 1000; // 48 hours from now

    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.patch(doc._id, {
      geminiFileUri: args.geminiFileUri,
      geminiFileName: args.geminiFileName,
      mimeType: args.mimeType,
      fileSizeBytes: args.fileSizeBytes,
      uploadedAt: now,
      expiresAt,
      status: "uploaded",
      errorMessage: undefined,
      updatedAt: now,
    });

    return doc._id;
  },
});

/**
 * Update document status (internal).
 */
export const updateStatusInternal = internalMutation({
  args: {
    sourceId: v.string(),
    status: documentStatus,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.patch(doc._id, {
      status: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    return doc._id;
  },
});

/**
 * Update document status (public).
 * Called by the upload script.
 */
export const updateStatus = mutation({
  args: {
    sourceId: v.string(),
    status: documentStatus,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.patch(doc._id, {
      status: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    return doc._id;
  },
});

/**
 * Mark expired documents.
 * Called by cron to check for documents past their expiration.
 */
export const markExpiredDocuments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .collect();

    let expiredCount = 0;

    for (const doc of docs) {
      if (doc.expiresAt && doc.expiresAt < now) {
        await ctx.db.patch(doc._id, {
          status: "expired",
          updatedAt: now,
        });
        expiredCount++;
      }
    }

    return { expiredCount };
  },
});

// =============================================================================
// Public Mutations
// =============================================================================

/**
 * Seed the documents table from corpus config.
 * Call this once to initialize the documents.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let skipped = 0;

    for (const source of PDF_SOURCES) {
      // Check if document already exists
      const existing = await ctx.db
        .query("documents")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", source.id))
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new document record
      await ctx.db.insert("documents", {
        sourceId: source.id,
        title: source.title,
        category: source.category,
        description: source.description,
        sourcePath: source.source,
        sourceType: "pdf",
        status: "pending",
        priority: source.priority,
        createdAt: now,
        updatedAt: now,
      });

      created++;
    }

    return { created, skipped, total: PDF_SOURCES.length };
  },
});

/**
 * Reset a document to pending status (for re-upload).
 */
export const resetDocument = mutation({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.patch(doc._id, {
      status: "pending",
      geminiFileUri: undefined,
      geminiFileName: undefined,
      uploadedAt: undefined,
      expiresAt: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reset all documents to pending status.
 */
export const resetAll = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();
    const now = Date.now();

    for (const doc of docs) {
      await ctx.db.patch(doc._id, {
        status: "pending",
        geminiFileUri: undefined,
        geminiFileName: undefined,
        uploadedAt: undefined,
        expiresAt: undefined,
        errorMessage: undefined,
        updatedAt: now,
      });
    }

    return { reset: docs.length };
  },
});

/**
 * Delete a document.
 */
export const deleteDocument = mutation({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .unique();

    if (!doc) {
      throw new Error(`Document not found: ${args.sourceId}`);
    }

    await ctx.db.delete(doc._id);
    return { success: true };
  },
});
