/**
 * Query Cache Module
 *
 * Provides caching for slow queries to improve response times:
 * - Geocode: Address → coordinates (TTL: 30 days)
 * - Zoning: Coordinates → zoning district (TTL: 7 days)
 * - RAG: Question → answer (TTL: 24 hours)
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// =============================================================================
// TTL Configuration (milliseconds)
// =============================================================================

const TTL = {
  geocode: 30 * 24 * 60 * 60 * 1000, // 30 days - addresses rarely change
  zoning: 7 * 24 * 60 * 60 * 1000, // 7 days - zoning changes infrequently
  rag: 24 * 60 * 60 * 1000, // 24 hours - documents may be updated
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Simple string hash function (djb2 algorithm).
 * Good enough for cache keys - fast and deterministic.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a cache key from query type and parameters.
 * Uses djb2 hash for fast, deterministic keys without crypto dependency.
 */
export function generateCacheKey(
  queryType: "geocode" | "zoning" | "rag",
  params: Record<string, unknown>
): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  const hash = simpleHash(`${queryType}:${normalized}`);
  return `${queryType}:${hash}`;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get a cached result if it exists and hasn't expired.
 */
export const get = query({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const cached = await ctx.db
      .query("queryCache")
      .withIndex("by_cacheKey", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiresAt < now) {
      return null;
    }

    // Return cached result (parsed from JSON)
    try {
      return {
        result: JSON.parse(cached.result),
        hitCount: cached.hitCount,
        createdAt: cached.createdAt,
      };
    } catch {
      return null;
    }
  },
});

/**
 * Get cache statistics for monitoring.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("queryCache").collect();

    const stats = {
      total: all.length,
      active: 0,
      expired: 0,
      byType: {
        geocode: { count: 0, hits: 0 },
        zoning: { count: 0, hits: 0 },
        rag: { count: 0, hits: 0 },
      },
      totalHits: 0,
    };

    for (const entry of all) {
      if (entry.expiresAt > now) {
        stats.active++;
      } else {
        stats.expired++;
      }

      const type = entry.queryType as keyof typeof stats.byType;
      if (stats.byType[type]) {
        stats.byType[type].count++;
        stats.byType[type].hits += entry.hitCount;
      }
      stats.totalHits += entry.hitCount;
    }

    return stats;
  },
});

// =============================================================================
// Mutation Functions
// =============================================================================

/**
 * Set a cache entry with automatic TTL based on query type.
 */
export const set = mutation({
  args: {
    cacheKey: v.string(),
    queryType: v.union(
      v.literal("geocode"),
      v.literal("zoning"),
      v.literal("rag")
    ),
    result: v.string(), // JSON serialized result
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttl = TTL[args.queryType];

    // Check if entry already exists
    const existing = await ctx.db
      .query("queryCache")
      .withIndex("by_cacheKey", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        result: args.result,
        expiresAt: now + ttl,
      });
      return existing._id;
    }

    // Create new entry
    return await ctx.db.insert("queryCache", {
      cacheKey: args.cacheKey,
      queryType: args.queryType,
      result: args.result,
      hitCount: 0,
      createdAt: now,
      expiresAt: now + ttl,
    });
  },
});

/**
 * Increment hit count for a cache entry.
 */
export const incrementHitCount = mutation({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("queryCache")
      .withIndex("by_cacheKey", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (entry) {
      await ctx.db.patch(entry._id, {
        hitCount: entry.hitCount + 1,
      });
    }
  },
});

/**
 * Clean up expired cache entries.
 * Run periodically via cron job.
 */
export const cleanExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deleted = 0;

    // Get expired entries in batches
    const expired = await ctx.db
      .query("queryCache")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(100); // Process in batches of 100

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return { deleted, hasMore: expired.length === 100 };
  },
});

/**
 * Clear all cache entries (for debugging/maintenance).
 */
export const clearAll = mutation({
  args: {
    queryType: v.optional(
      v.union(v.literal("geocode"), v.literal("zoning"), v.literal("rag"))
    ),
  },
  handler: async (ctx, args) => {
    let deleted = 0;

    const entries = args.queryType
      ? await ctx.db
          .query("queryCache")
          .withIndex("by_queryType", (q) => q.eq("queryType", args.queryType!))
          .collect()
      : await ctx.db.query("queryCache").collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return { deleted };
  },
});
