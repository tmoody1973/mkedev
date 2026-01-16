/**
 * Homes For Sale Queries and Actions
 *
 * Query functions for the homesForSale table, providing
 * access to Homes MKE property listings.
 */

import { query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// =============================================================================
// Query: List For Sale
// =============================================================================

/**
 * List all homes currently for sale.
 * Optionally filter by neighborhood.
 */
export const listForSale = query({
  args: {
    neighborhood: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let homes;

    if (args.neighborhood) {
      // Filter by neighborhood
      homes = await ctx.db
        .query("homesForSale")
        .withIndex("by_neighborhood", (q) =>
          q.eq("neighborhood", args.neighborhood!)
        )
        .filter((q) => q.eq(q.field("status"), "for_sale"))
        .take(limit);
    } else {
      // Get all homes for sale
      homes = await ctx.db
        .query("homesForSale")
        .withIndex("by_status", (q) => q.eq("status", "for_sale"))
        .take(limit);
    }

    return homes;
  },
});

// =============================================================================
// Query: Get By Tax Key
// =============================================================================

/**
 * Look up a home by Milwaukee tax key.
 */
export const getByTaxKey = query({
  args: {
    taxKey: v.string(),
  },
  handler: async (ctx, args) => {
    const home = await ctx.db
      .query("homesForSale")
      .withIndex("by_taxKey", (q) => q.eq("taxKey", args.taxKey))
      .first();

    return home;
  },
});

// =============================================================================
// Query: Get By ID
// =============================================================================

/**
 * Get a home by its Convex document ID.
 */
export const getById = query({
  args: {
    id: v.id("homesForSale"),
  },
  handler: async (ctx, args) => {
    const home = await ctx.db.get(args.id);
    return home;
  },
});

// =============================================================================
// Query: Search Homes
// =============================================================================

/**
 * Search for homes with optional filters.
 * Used by the agent tool for home search queries.
 */
export const searchHomes = query({
  args: {
    neighborhood: v.optional(v.string()),
    minBedrooms: v.optional(v.number()),
    maxBedrooms: v.optional(v.number()),
    minBaths: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Start with homes for sale
    let homesQuery;

    if (args.neighborhood) {
      homesQuery = ctx.db
        .query("homesForSale")
        .withIndex("by_neighborhood", (q) =>
          q.eq("neighborhood", args.neighborhood!)
        )
        .filter((q) => q.eq(q.field("status"), "for_sale"));
    } else {
      homesQuery = ctx.db
        .query("homesForSale")
        .withIndex("by_status", (q) => q.eq("status", "for_sale"));
    }

    // Collect and apply additional filters in memory
    // (Convex doesn't support multiple index filters in a single query)
    const homes = await homesQuery.collect();

    let filtered = homes;

    // Filter by bedroom range
    if (args.minBedrooms !== undefined) {
      filtered = filtered.filter((h) => h.bedrooms >= args.minBedrooms!);
    }
    if (args.maxBedrooms !== undefined) {
      filtered = filtered.filter((h) => h.bedrooms <= args.maxBedrooms!);
    }

    // Filter by minimum baths (full + half * 0.5)
    if (args.minBaths !== undefined) {
      filtered = filtered.filter((h) => {
        const totalBaths = h.fullBaths + h.halfBaths * 0.5;
        return totalBaths >= args.minBaths!;
      });
    }

    // Apply limit and return
    return filtered.slice(0, limit);
  },
});

// =============================================================================
// Query: Get All Neighborhoods
// =============================================================================

/**
 * Get a list of all neighborhoods with homes for sale.
 * Useful for filtering UI and agent suggestions.
 */
export const getNeighborhoods = query({
  args: {},
  handler: async (ctx) => {
    const homes = await ctx.db
      .query("homesForSale")
      .withIndex("by_status", (q) => q.eq("status", "for_sale"))
      .collect();

    // Extract unique neighborhoods
    const neighborhoods = [...new Set(homes.map((h) => h.neighborhood))];

    // Sort alphabetically
    return neighborhoods.sort();
  },
});

// =============================================================================
// Query: Get Stats
// =============================================================================

/**
 * Get statistics about homes for sale.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allHomes = await ctx.db.query("homesForSale").collect();

    const forSale = allHomes.filter((h) => h.status === "for_sale");
    const sold = allHomes.filter((h) => h.status === "sold");
    const unknown = allHomes.filter((h) => h.status === "unknown");

    // Group by neighborhood
    const byNeighborhood: Record<string, number> = {};
    for (const home of forSale) {
      byNeighborhood[home.neighborhood] =
        (byNeighborhood[home.neighborhood] || 0) + 1;
    }

    return {
      total: allHomes.length,
      forSale: forSale.length,
      sold: sold.length,
      unknown: unknown.length,
      byNeighborhood,
      lastSyncedAt: allHomes.length > 0
        ? Math.max(...allHomes.map((h) => h.lastSyncedAt))
        : null,
    };
  },
});

// =============================================================================
// Query: Get For Map
// =============================================================================

/**
 * Get homes for sale formatted for map display.
 * Returns minimal data needed for GeoJSON source.
 */
export const getForMap = query({
  args: {},
  handler: async (ctx) => {
    const homes = await ctx.db
      .query("homesForSale")
      .withIndex("by_status", (q) => q.eq("status", "for_sale"))
      .collect();

    return homes.map((h) => ({
      id: h._id,
      coordinates: h.coordinates,
      address: h.address,
      neighborhood: h.neighborhood,
      bedrooms: h.bedrooms,
      fullBaths: h.fullBaths,
      halfBaths: h.halfBaths,
    }));
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
 * Manually trigger sync of homes data from ESRI FeatureServer.
 * This is a public action that can be called from:
 * - Convex Dashboard (Run function)
 * - CLI: npx convex run homes:triggerSync
 */
export const triggerSync = action({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    return await ctx.runAction(internal.ingestion.homesSync.syncFromESRI, {});
  },
});
