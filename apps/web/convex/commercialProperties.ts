/**
 * Commercial Properties Queries and Actions
 *
 * Query functions for the commercialProperties table, providing
 * access to Browse.ai scraped commercial property listings.
 */

import { query, action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// =============================================================================
// Query: Search Properties
// =============================================================================

/**
 * Search for commercial properties with optional filters.
 * Used by the agent tool for property search queries.
 */
export const searchProperties = query({
  args: {
    propertyType: v.optional(
      v.union(
        v.literal("retail"),
        v.literal("office"),
        v.literal("industrial"),
        v.literal("warehouse"),
        v.literal("mixed-use"),
        v.literal("land"),
        v.literal("all")
      )
    ),
    minSqFt: v.optional(v.number()),
    maxSqFt: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    zoning: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Start with available properties
    let propertiesQuery = ctx.db
      .query("commercialProperties")
      .withIndex("by_status", (q) => q.eq("status", "available"));

    // Collect and apply filters in memory
    const properties = await propertiesQuery.collect();

    let filtered = properties;

    // Filter by property type
    if (args.propertyType && args.propertyType !== "all") {
      filtered = filtered.filter((p) => p.propertyType === args.propertyType);
    }

    // Filter by square footage range
    if (args.minSqFt !== undefined) {
      filtered = filtered.filter((p) => (p.buildingSqFt ?? 0) >= args.minSqFt!);
    }
    if (args.maxSqFt !== undefined) {
      filtered = filtered.filter((p) => (p.buildingSqFt ?? Infinity) <= args.maxSqFt!);
    }

    // Filter by max price
    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((p) => (p.askingPrice ?? Infinity) <= args.maxPrice!);
    }

    // Filter by zoning
    if (args.zoning) {
      const zoningLower = args.zoning.toLowerCase();
      filtered = filtered.filter((p) =>
        p.zoning?.toLowerCase().includes(zoningLower)
      );
    }

    // Apply limit and return
    return filtered.slice(0, limit);
  },
});

// =============================================================================
// Query: Get By ID
// =============================================================================

/**
 * Get a commercial property by its Convex document ID.
 */
export const getById = query({
  args: {
    id: v.id("commercialProperties"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// Query: Get By Zoning
// =============================================================================

/**
 * Get commercial properties by zoning code.
 */
export const getByZoning = query({
  args: {
    zoning: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const properties = await ctx.db
      .query("commercialProperties")
      .withIndex("by_zoning", (q) => q.eq("zoning", args.zoning))
      .filter((q) => q.eq(q.field("status"), "available"))
      .take(limit);

    return properties;
  },
});

// =============================================================================
// Query: Get Stats
// =============================================================================

/**
 * Get statistics about commercial properties.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allProperties = await ctx.db.query("commercialProperties").collect();

    const available = allProperties.filter((p) => p.status === "available");
    const sold = allProperties.filter((p) => p.status === "sold");
    const pending = allProperties.filter((p) => p.status === "pending");

    // Group by property type
    const byType: Record<string, number> = {};
    for (const prop of available) {
      const type = prop.propertyType || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: allProperties.length,
      available: available.length,
      sold: sold.length,
      pending: pending.length,
      byType,
      lastSyncedAt:
        allProperties.length > 0
          ? Math.max(...allProperties.map((p) => p.lastSyncedAt))
          : null,
    };
  },
});

// =============================================================================
// Query: Get For Map
// =============================================================================

/**
 * Get commercial properties formatted for map display.
 * Returns minimal data needed for GeoJSON source.
 */
export const getForMap = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db
      .query("commercialProperties")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    return properties.map((p) => ({
      id: p._id,
      coordinates: p.coordinates,
      address: p.address,
      propertyType: p.propertyType,
      buildingSqFt: p.buildingSqFt,
      askingPrice: p.askingPrice,
    }));
  },
});

// =============================================================================
// Mutation: Update Coordinates
// =============================================================================

/**
 * Update coordinates for a commercial property.
 * Used by re-geocoding scripts to fix incorrect coordinates.
 */
export const updateCoordinates = mutation({
  args: {
    id: v.id("commercialProperties"),
    coordinates: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      coordinates: args.coordinates as [number, number],
      updatedAt: Date.now(),
    });
  },
});

// =============================================================================
// Action: Manual Sync
// =============================================================================

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    fetched: number;
    geocoded: number;
    inserted: number;
    updated: number;
    failed: number;
  };
}

/**
 * Manually trigger sync of commercial properties from Browse.ai.
 */
export const triggerSync = action({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    return await ctx.runAction(
      internal.ingestion.commercialSync.syncCommercialProperties,
      {}
    );
  },
});

/**
 * Debug: Check what Browse.ai robots return
 */
export const debugBrowseAi = action({
  args: {},
  handler: async (): Promise<{
    commercialRobot: unknown;
    developmentRobot: unknown;
  }> => {
    const apiKey = process.env.BROWSEAI_API_KEY;
    if (!apiKey) {
      throw new Error("BROWSEAI_API_KEY not set");
    }

    const COMMERCIAL_ROBOT_ID = "019bd1dc-df2e-7747-8e54-142a383e8822";
    const DEVELOPMENT_SITES_ROBOT_ID = "019bd1ff-bd45-7594-a466-ed701e505915";

    const fetchRobot = async (robotId: string) => {
      const url = `https://api.browse.ai/v2/robots/${robotId}/tasks?page=1`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    };

    const [commercialRobot, developmentRobot] = await Promise.all([
      fetchRobot(COMMERCIAL_ROBOT_ID),
      fetchRobot(DEVELOPMENT_SITES_ROBOT_ID),
    ]);

    return { commercialRobot, developmentRobot };
  },
});
