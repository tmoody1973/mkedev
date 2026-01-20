/**
 * Vacant Lots Sync Mutations
 *
 * Database mutations for the vacant lots sync process.
 * These are separated from the Node.js action file because
 * Convex mutations cannot run in the Node.js runtime.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// Internal Mutation for Database Operations
// =============================================================================

/**
 * Upsert vacant lots from ESRI sync.
 * Updates existing records or inserts new ones based on esriObjectId.
 */
export const upsertLots = internalMutation({
  args: {
    lots: v.array(
      v.object({
        esriObjectId: v.string(),
        taxKey: v.string(),
        address: v.string(),
        neighborhood: v.optional(v.string()),
        coordinates: v.array(v.number()),
        zoning: v.optional(v.string()),
        propertyType: v.optional(v.string()),
        aldermanicDistrict: v.optional(v.number()),
        lotSizeSqFt: v.optional(v.number()),
        dispositionStatus: v.optional(v.string()),
        dispositionStrategy: v.optional(v.string()),
        acquisitionDate: v.optional(v.string()),
        currentOwner: v.optional(v.string()),
        status: v.union(
          v.literal("available"),
          v.literal("pending"),
          v.literal("sold"),
          v.literal("unknown")
        ),
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

    // Process each lot
    for (const lot of args.lots) {
      // Check if record exists by esriObjectId
      const existing = await ctx.db
        .query("vacantLots")
        .withIndex("by_esriObjectId", (q) =>
          q.eq("esriObjectId", lot.esriObjectId)
        )
        .first();

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          ...lot,
          createdAt: existing.createdAt, // Preserve original creation time
          updatedAt: now,
        });
        updated++;
      } else {
        // Insert new record
        await ctx.db.insert("vacantLots", {
          ...lot,
          createdAt: now,
          updatedAt: now,
        });
        inserted++;
      }
    }

    // Mark records not in sync as sold (they were likely transferred/sold)
    // Only do this on the final batch (when syncedObjectIds is non-empty)
    if (args.syncedObjectIds.length > 0) {
      const syncedSet = new Set(args.syncedObjectIds);
      const allLots = await ctx.db.query("vacantLots").collect();

      for (const lot of allLots) {
        if (!syncedSet.has(lot.esriObjectId) && lot.status === "available") {
          await ctx.db.patch(lot._id, {
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
