/**
 * Development Sites Queries and Actions
 *
 * Query functions for the developmentSites table, providing
 * access to Browse.ai scraped development site listings.
 */

import { query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// =============================================================================
// Query: Search Sites
// =============================================================================

/**
 * Search for development sites with optional filters.
 * Used by the agent tool for site search queries.
 */
export const searchSites = query({
  args: {
    minLotSize: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    zoning: v.optional(v.string()),
    incentive: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Start with available sites
    const sites = await ctx.db
      .query("developmentSites")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    let filtered = sites;

    // Filter by minimum lot size
    if (args.minLotSize !== undefined) {
      filtered = filtered.filter((s) => (s.lotSizeSqFt ?? 0) >= args.minLotSize!);
    }

    // Filter by max price
    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((s) => (s.askingPrice ?? Infinity) <= args.maxPrice!);
    }

    // Filter by zoning
    if (args.zoning) {
      const zoningLower = args.zoning.toLowerCase();
      filtered = filtered.filter((s) =>
        s.zoning?.toLowerCase().includes(zoningLower)
      );
    }

    // Filter by incentive
    if (args.incentive) {
      const incentiveLower = args.incentive.toLowerCase();
      filtered = filtered.filter((s) =>
        s.incentives?.some((i) => i.toLowerCase().includes(incentiveLower))
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
 * Get a development site by its Convex document ID.
 */
export const getById = query({
  args: {
    id: v.id("developmentSites"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// Query: Get Stats
// =============================================================================

/**
 * Get statistics about development sites.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allSites = await ctx.db.query("developmentSites").collect();

    const available = allSites.filter((s) => s.status === "available");
    const sold = allSites.filter((s) => s.status === "sold");
    const pending = allSites.filter((s) => s.status === "pending");

    // Group by incentives
    const byIncentive: Record<string, number> = {};
    for (const site of available) {
      if (site.incentives) {
        for (const incentive of site.incentives) {
          byIncentive[incentive] = (byIncentive[incentive] || 0) + 1;
        }
      }
    }

    return {
      total: allSites.length,
      available: available.length,
      sold: sold.length,
      pending: pending.length,
      byIncentive,
      lastSyncedAt:
        allSites.length > 0
          ? Math.max(...allSites.map((s) => s.lastSyncedAt))
          : null,
    };
  },
});

// =============================================================================
// Query: Get For Map
// =============================================================================

/**
 * Get development sites formatted for map display.
 * Returns minimal data needed for GeoJSON source.
 */
export const getForMap = query({
  args: {},
  handler: async (ctx) => {
    const sites = await ctx.db
      .query("developmentSites")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    return sites.map((s) => ({
      id: s._id,
      coordinates: s.coordinates,
      address: s.address,
      siteName: s.siteName,
      lotSizeSqFt: s.lotSizeSqFt,
      askingPrice: s.askingPrice,
      incentives: s.incentives,
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
    geocoded: number;
    inserted: number;
    updated: number;
    failed: number;
  };
}

/**
 * Manually trigger sync of development sites from Browse.ai.
 */
export const triggerSync = action({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    return await ctx.runAction(
      internal.ingestion.commercialSync.syncDevelopmentSites,
      {}
    );
  },
});
