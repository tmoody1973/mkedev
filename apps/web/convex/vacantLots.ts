/**
 * Vacant Lots Queries and Actions
 *
 * Query functions for the vacantLots table, providing
 * access to city-owned vacant lots from Strong Neighborhoods ESRI.
 */

import { query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// =============================================================================
// Query: List Available
// =============================================================================

/**
 * List all vacant lots currently available.
 * Optionally filter by neighborhood.
 */
export const listAvailable = query({
  args: {
    neighborhood: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let lots;

    if (args.neighborhood) {
      // Filter by neighborhood
      lots = await ctx.db
        .query("vacantLots")
        .withIndex("by_neighborhood", (q) =>
          q.eq("neighborhood", args.neighborhood!)
        )
        .filter((q) => q.eq(q.field("status"), "available"))
        .take(limit);
    } else {
      // Get all available lots
      lots = await ctx.db
        .query("vacantLots")
        .withIndex("by_status", (q) => q.eq("status", "available"))
        .take(limit);
    }

    return lots;
  },
});

// =============================================================================
// Query: Search Lots
// =============================================================================

/**
 * Search for vacant lots with optional filters.
 * Used by the agent tool for lot search queries.
 */
export const searchLots = query({
  args: {
    neighborhood: v.optional(v.string()),
    zoning: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    dispositionStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Start with available lots
    let lotsQuery;

    if (args.neighborhood) {
      lotsQuery = ctx.db
        .query("vacantLots")
        .withIndex("by_neighborhood", (q) =>
          q.eq("neighborhood", args.neighborhood!)
        )
        .filter((q) => q.eq(q.field("status"), "available"));
    } else if (args.dispositionStatus) {
      lotsQuery = ctx.db
        .query("vacantLots")
        .withIndex("by_dispositionStatus", (q) =>
          q.eq("dispositionStatus", args.dispositionStatus!)
        )
        .filter((q) => q.eq(q.field("status"), "available"));
    } else {
      lotsQuery = ctx.db
        .query("vacantLots")
        .withIndex("by_status", (q) => q.eq("status", "available"));
    }

    // Collect and apply additional filters in memory
    const lots = await lotsQuery.collect();

    let filtered = lots;

    // Filter by zoning
    if (args.zoning) {
      const zoningLower = args.zoning.toLowerCase();
      filtered = filtered.filter((l) =>
        l.zoning?.toLowerCase().includes(zoningLower)
      );
    }

    // Filter by property type
    if (args.propertyType) {
      const typeLower = args.propertyType.toLowerCase();
      filtered = filtered.filter((l) =>
        l.propertyType?.toLowerCase().includes(typeLower)
      );
    }

    // Filter by disposition status (if not already filtered by index)
    if (args.dispositionStatus && !args.neighborhood) {
      // Already filtered by index
    } else if (args.dispositionStatus) {
      const statusLower = args.dispositionStatus.toLowerCase();
      filtered = filtered.filter((l) =>
        l.dispositionStatus?.toLowerCase().includes(statusLower)
      );
    }

    // Apply limit and return
    return filtered.slice(0, limit);
  },
});

// =============================================================================
// Query: Get By Tax Key
// =============================================================================

/**
 * Look up a vacant lot by Milwaukee tax key.
 */
export const getByTaxKey = query({
  args: {
    taxKey: v.string(),
  },
  handler: async (ctx, args) => {
    const lot = await ctx.db
      .query("vacantLots")
      .withIndex("by_taxKey", (q) => q.eq("taxKey", args.taxKey))
      .first();

    return lot;
  },
});

// =============================================================================
// Query: Get By ID
// =============================================================================

/**
 * Get a vacant lot by its Convex document ID.
 */
export const getById = query({
  args: {
    id: v.id("vacantLots"),
  },
  handler: async (ctx, args) => {
    const lot = await ctx.db.get(args.id);
    return lot;
  },
});

// =============================================================================
// Query: Get For Map
// =============================================================================

/**
 * Get vacant lots formatted for map display.
 * Returns minimal data needed for GeoJSON source.
 */
export const getForMap = query({
  args: {},
  handler: async (ctx) => {
    const lots = await ctx.db
      .query("vacantLots")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    return lots.map((l) => ({
      id: l._id,
      coordinates: l.coordinates,
      address: l.address,
      status: l.status,
      neighborhood: l.neighborhood,
      zoning: l.zoning,
    }));
  },
});

// =============================================================================
// Query: Get All Neighborhoods
// =============================================================================

/**
 * Get a list of all neighborhoods with vacant lots.
 * Useful for filtering UI and agent suggestions.
 */
export const getNeighborhoods = query({
  args: {},
  handler: async (ctx) => {
    const lots = await ctx.db
      .query("vacantLots")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    // Extract unique neighborhoods, filtering out undefined
    const neighborhoods = [
      ...new Set(lots.map((l) => l.neighborhood).filter(Boolean)),
    ] as string[];

    // Sort alphabetically
    return neighborhoods.sort();
  },
});

// =============================================================================
// Query: Get Stats
// =============================================================================

/**
 * Get statistics about vacant lots.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allLots = await ctx.db.query("vacantLots").collect();

    const available = allLots.filter((l) => l.status === "available");
    const pending = allLots.filter((l) => l.status === "pending");
    const sold = allLots.filter((l) => l.status === "sold");
    const unknown = allLots.filter((l) => l.status === "unknown");

    // Group by neighborhood
    const byNeighborhood: Record<string, number> = {};
    for (const lot of available) {
      const neighborhood = lot.neighborhood || "Unknown";
      byNeighborhood[neighborhood] = (byNeighborhood[neighborhood] || 0) + 1;
    }

    // Group by zoning
    const byZoning: Record<string, number> = {};
    for (const lot of available) {
      const zoning = lot.zoning || "Unknown";
      byZoning[zoning] = (byZoning[zoning] || 0) + 1;
    }

    return {
      total: allLots.length,
      available: available.length,
      pending: pending.length,
      sold: sold.length,
      unknown: unknown.length,
      byNeighborhood,
      byZoning,
      lastSyncedAt:
        allLots.length > 0
          ? Math.max(...allLots.map((l) => l.lastSyncedAt))
          : null,
    };
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
    transformed: number;
    inserted: number;
    updated: number;
    markedSold: number;
  };
}

/**
 * Manually trigger sync of vacant lots data from ESRI MapServer.
 * This is a public action that can be called from:
 * - Convex Dashboard (Run function)
 * - CLI: npx convex run vacantLots:triggerSync
 */
export const triggerSync = action({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    return await ctx.runAction(
      internal.ingestion.vacantLotsSync.syncFromESRI,
      {}
    );
  },
});
