import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// =============================================================================
// Visualization Gallery - Convex Storage & Database Functions
// =============================================================================

/**
 * Generate an upload URL for storing an image in Convex storage.
 * Client uploads directly to this URL, then passes the storageId to save.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to upload images");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save a completed visualization to the database with storage IDs.
 */
export const saveVisualization = mutation({
  args: {
    sourceImageId: v.id("_storage"),
    generatedImageId: v.id("_storage"),
    maskImageId: v.optional(v.id("_storage")),
    prompt: v.string(),
    enhancedPrompt: v.optional(v.string()),
    sourceType: v.union(
      v.literal("map_screenshot"),
      v.literal("street_view"),
      v.literal("upload")
    ),
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    zoningContext: v.optional(
      v.object({
        zoningDistrict: v.optional(v.string()),
        zoningCategory: v.optional(v.string()),
        maxHeight: v.optional(v.number()),
        maxStories: v.optional(v.number()),
        setbacks: v.optional(
          v.object({
            front: v.number(),
            side: v.number(),
            rear: v.number(),
          })
        ),
        maxFAR: v.optional(v.number()),
        overlayZones: v.optional(v.array(v.string())),
        historicDistrict: v.optional(v.boolean()),
        neighborhood: v.optional(v.string()),
      })
    ),
    generationTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to save visualizations");
    }

    const userId = identity.subject;
    const now = Date.now();

    const visualizationId = await ctx.db.insert("visualizations", {
      userId,
      sourceImageId: args.sourceImageId,
      generatedImageId: args.generatedImageId,
      maskImageId: args.maskImageId,
      sourceType: args.sourceType,
      prompt: args.prompt,
      enhancedPrompt: args.enhancedPrompt,
      address: args.address,
      coordinates: args.coordinates,
      zoningContext: args.zoningContext,
      status: "completed",
      generationTimeMs: args.generationTimeMs,
      isSaved: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return visualizationId;
  },
});

/**
 * Get all visualizations for the current user.
 */
export const getUserVisualizations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;
    const limit = args.limit ?? 50;

    const visualizations = await ctx.db
      .query("visualizations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .take(limit);

    // Get storage URLs for each visualization
    const visualizationsWithUrls = await Promise.all(
      visualizations.map(async (viz) => {
        const sourceUrl = await ctx.storage.getUrl(viz.sourceImageId);
        const generatedUrl = viz.generatedImageId
          ? await ctx.storage.getUrl(viz.generatedImageId)
          : null;
        const maskUrl = viz.maskImageId
          ? await ctx.storage.getUrl(viz.maskImageId)
          : null;

        return {
          ...viz,
          sourceUrl,
          generatedUrl,
          maskUrl,
        };
      })
    );

    return visualizationsWithUrls;
  },
});

/**
 * Get a single visualization by ID.
 */
export const getVisualization = query({
  args: {
    id: v.id("visualizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to view visualizations");
    }

    const visualization = await ctx.db.get(args.id);
    if (!visualization) {
      return null;
    }

    // Check ownership
    if (visualization.userId !== identity.subject) {
      throw new Error("Not authorized to view this visualization");
    }

    // Get storage URLs
    const sourceUrl = await ctx.storage.getUrl(visualization.sourceImageId);
    const generatedUrl = visualization.generatedImageId
      ? await ctx.storage.getUrl(visualization.generatedImageId)
      : null;
    const maskUrl = visualization.maskImageId
      ? await ctx.storage.getUrl(visualization.maskImageId)
      : null;

    return {
      ...visualization,
      sourceUrl,
      generatedUrl,
      maskUrl,
    };
  },
});

/**
 * Delete a visualization (soft delete).
 */
export const deleteVisualization = mutation({
  args: {
    id: v.id("visualizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to delete visualizations");
    }

    const visualization = await ctx.db.get(args.id);
    if (!visualization) {
      throw new Error("Visualization not found");
    }

    if (visualization.userId !== identity.subject) {
      throw new Error("Not authorized to delete this visualization");
    }

    await ctx.db.patch(args.id, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Permanently delete a visualization and its storage files.
 */
export const permanentlyDelete = mutation({
  args: {
    id: v.id("visualizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to delete visualizations");
    }

    const visualization = await ctx.db.get(args.id);
    if (!visualization) {
      throw new Error("Visualization not found");
    }

    if (visualization.userId !== identity.subject) {
      throw new Error("Not authorized to delete this visualization");
    }

    // Delete storage files
    await ctx.storage.delete(visualization.sourceImageId);
    if (visualization.generatedImageId) {
      await ctx.storage.delete(visualization.generatedImageId);
    }
    if (visualization.maskImageId) {
      await ctx.storage.delete(visualization.maskImageId);
    }

    // Delete database record
    await ctx.db.delete(args.id);
  },
});

/**
 * Get count of user's visualizations.
 */
export const getVisualizationCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const visualizations = await ctx.db
      .query("visualizations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return visualizations.length;
  },
});
