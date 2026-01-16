/**
 * Homes MKE Sync Mutations
 *
 * Database mutations for the homes sync process.
 * These are separated from the Node.js action file because
 * Convex mutations cannot run in the Node.js runtime.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// Internal Mutation for Database Operations
// =============================================================================

/**
 * Upsert homes from ESRI sync.
 * Updates existing records or inserts new ones based on esriObjectId.
 */
export const upsertHomes = internalMutation({
  args: {
    homes: v.array(
      v.object({
        esriObjectId: v.string(),
        taxKey: v.string(),
        address: v.string(),
        neighborhood: v.string(),
        coordinates: v.array(v.number()),
        bedrooms: v.number(),
        fullBaths: v.number(),
        halfBaths: v.number(),
        buildingSqFt: v.number(),
        yearBuilt: v.number(),
        status: v.union(
          v.literal("for_sale"),
          v.literal("sold"),
          v.literal("unknown")
        ),
        narrative: v.optional(v.string()),
        listingUrl: v.optional(v.string()),
        developerName: v.optional(v.string()),
        lastSyncedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
    syncedObjectIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    let markedSold = 0;

    // Process each home
    for (const home of args.homes) {
      // Check if record exists
      const existing = await ctx.db
        .query("homesForSale")
        .withIndex("by_esriObjectId", (q) =>
          q.eq("esriObjectId", home.esriObjectId)
        )
        .first();

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          ...home,
          createdAt: existing.createdAt, // Preserve original creation time
          updatedAt: now,
        });
        updated++;
      } else {
        // Insert new record
        await ctx.db.insert("homesForSale", {
          ...home,
          createdAt: now,
          updatedAt: now,
        });
        inserted++;
      }
    }

    // Mark records not in sync as sold (they were likely removed from the listing)
    // Only do this on the final batch (when syncedObjectIds is non-empty)
    if (args.syncedObjectIds.length > 0) {
      const syncedSet = new Set(args.syncedObjectIds);
      const allHomes = await ctx.db.query("homesForSale").collect();

      for (const home of allHomes) {
        if (!syncedSet.has(home.esriObjectId) && home.status === "for_sale") {
          await ctx.db.patch(home._id, {
            status: "sold",
            updatedAt: now,
          });
          markedSold++;
        }
      }
    }

    return { inserted, updated, markedSold };
  },
});
