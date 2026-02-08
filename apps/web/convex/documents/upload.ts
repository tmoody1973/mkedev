import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";

// =============================================================================
// Document Upload Pipeline - Mutations & Queries
// Handles file upload lifecycle for civic document analysis
// =============================================================================

/**
 * Generate a short-lived upload URL for client-side file upload.
 * The client PUTs the file directly to this URL, then calls createDocument
 * with the resulting storage ID.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a document record after the client has uploaded a file to Convex storage.
 * Requires authentication. Sets initial status to "uploading".
 */
export const createDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    fileSizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to upload documents");
    }

    const userId = identity.subject;
    const now = Date.now();

    const documentId = await ctx.db.insert("uploadedDocuments", {
      userId,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileSizeBytes: args.fileSizeBytes,
      status: "uploading",
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

/**
 * Update document status and optional fields during the processing pipeline.
 * Internal mutation -- called from server actions (classify, enrich, analyze),
 * not from the client.
 *
 * Accepts optional classification, parcelContext, and errorMessage so actions
 * can update these fields alongside status transitions.
 */
export const updateStatus = internalMutation({
  args: {
    documentId: v.id("uploadedDocuments"),
    status: v.union(
      v.literal("uploading"),
      v.literal("classifying"),
      v.literal("classified"),
      v.literal("enriching"),
      v.literal("analyzing"),
      v.literal("complete"),
      v.literal("error")
    ),
    classification: v.optional(
      v.object({
        type: v.union(
          v.literal("site_plan"),
          v.literal("floor_plan"),
          v.literal("elevation"),
          v.literal("project_narrative"),
          v.literal("variance_application"),
          v.literal("conditional_use_application"),
          v.literal("traffic_study"),
          v.literal("environmental_assessment"),
          v.literal("survey"),
          v.literal("unknown")
        ),
        confidence: v.number(),
        summary: v.string(),
        extractedData: v.object({
          projectAddress: v.optional(v.string()),
          proposedUse: v.optional(v.string()),
          buildingHeight: v.optional(v.string()),
          stories: v.optional(v.number()),
          unitCount: v.optional(v.number()),
          squareFootage: v.optional(v.number()),
          parkingSpaces: v.optional(v.number()),
          lotSize: v.optional(v.string()),
        }),
      })
    ),
    parcelContext: v.optional(
      v.object({
        address: v.optional(v.string()),
        coordinates: v.optional(v.array(v.number())),
        zoningDistrict: v.optional(v.string()),
        zoningCategory: v.optional(v.string()),
        overlayZones: v.optional(v.array(v.string())),
        incentiveZones: v.optional(v.array(v.string())),
        areaPlan: v.optional(v.string()),
        lotSize: v.optional(v.number()),
      })
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, status, classification, parcelContext, errorMessage } =
      args;

    const patch: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };

    if (classification !== undefined) {
      patch.classification = classification;
    }

    if (parcelContext !== undefined) {
      patch.parcelContext = parcelContext;
    }

    if (errorMessage !== undefined) {
      patch.errorMessage = errorMessage;
    }

    await ctx.db.patch(documentId, patch);
  },
});

/**
 * Get a single document by ID.
 */
export const get = query({
  args: {
    documentId: v.id("uploadedDocuments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

/**
 * List documents for the currently authenticated user.
 * Returns documents ordered by creation time (newest first).
 */
export const listForUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to list documents");
    }

    const userId = identity.subject;
    const limit = args.limit ?? 20;

    const documents = await ctx.db
      .query("uploadedDocuments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return documents;
  },
});
