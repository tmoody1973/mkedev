import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";

// =============================================================================
// Compliance Analysis Helpers - Mutations & Queries
//
// These are the non-node internal mutations and queries used by the
// analyzeCompliance action in analyze.ts. Separated because "use node"
// files in Convex can only export actions/internalActions.
// =============================================================================

/**
 * Create a new compliance analysis record.
 * Internal mutation -- only called from analyzeCompliance action.
 */
export const createAnalysis = internalMutation({
  args: {
    userId: v.string(),
    documentId: v.id("uploadedDocuments"),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("complianceAnalyses", {
      userId: args.userId,
      documentId: args.documentId,
      conversationId: args.conversationId,
      analysis: null,
      status: "analyzing",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing compliance analysis record.
 * Internal mutation -- only called from analyzeCompliance action.
 */
export const updateAnalysis = internalMutation({
  args: {
    analysisId: v.id("complianceAnalyses"),
    status: v.union(
      v.literal("pending"),
      v.literal("analyzing"),
      v.literal("complete"),
      v.literal("error")
    ),
    analysis: v.optional(v.any()),
    analysisTimeMs: v.optional(v.number()),
    modelUsed: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { analysisId, status, analysis, analysisTimeMs, modelUsed, errorMessage } =
      args;

    const patch: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };

    if (analysis !== undefined) {
      patch.analysis = analysis;
    }
    if (analysisTimeMs !== undefined) {
      patch.analysisTimeMs = analysisTimeMs;
    }
    if (modelUsed !== undefined) {
      patch.modelUsed = modelUsed;
    }
    if (errorMessage !== undefined) {
      patch.errorMessage = errorMessage;
    }

    await ctx.db.patch(analysisId, patch);
  },
});

/**
 * Get a compliance analysis by ID.
 */
export const get = query({
  args: {
    analysisId: v.id("complianceAnalyses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.analysisId);
  },
});

/**
 * Get compliance analysis by document ID.
 * Returns the most recent analysis for the document.
 */
export const getByDocumentId = query({
  args: {
    documentId: v.id("uploadedDocuments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("complianceAnalyses")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .first();
  },
});
