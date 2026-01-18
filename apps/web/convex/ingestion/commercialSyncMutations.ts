/**
 * Commercial Properties & Development Sites Sync Mutations
 *
 * Internal mutations for upserting commercial properties and development sites
 * from Browse.ai sync actions.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// Commercial Properties Mutations
// =============================================================================

export const upsertCommercialProperties = internalMutation({
  args: {
    properties: v.array(
      v.object({
        browseAiTaskId: v.string(),
        address: v.string(),
        coordinates: v.array(v.number()),
        propertyType: v.optional(
          v.union(
            v.literal("retail"),
            v.literal("office"),
            v.literal("industrial"),
            v.literal("warehouse"),
            v.literal("mixed-use"),
            v.literal("land")
          )
        ),
        buildingSqFt: v.optional(v.number()),
        lotSizeSqFt: v.optional(v.number()),
        zoning: v.optional(v.string()),
        askingPrice: v.optional(v.number()),
        pricePerSqFt: v.optional(v.number()),
        contactInfo: v.optional(v.string()),
        listingUrl: v.optional(v.string()),
        description: v.optional(v.string()),
        // PDF links
        additionalPhotosUrl: v.optional(v.string()),
        assessorPageUrl: v.optional(v.string()),
        historicLandUseUrl: v.optional(v.string()),
        proposalSummaryUrl: v.optional(v.string()),
        propertyImageUrl: v.optional(v.string()),
        status: v.union(
          v.literal("available"),
          v.literal("sold"),
          v.literal("pending"),
          v.literal("unknown")
        ),
        lastSyncedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const property of args.properties) {
      // Check if property already exists by address (more reliable than taskId)
      const existing = await ctx.db
        .query("commercialProperties")
        .filter((q) => q.eq(q.field("address"), property.address))
        .first();

      if (existing) {
        // Update existing property
        await ctx.db.patch(existing._id, {
          browseAiTaskId: property.browseAiTaskId,
          coordinates: property.coordinates,
          propertyType: property.propertyType,
          buildingSqFt: property.buildingSqFt,
          lotSizeSqFt: property.lotSizeSqFt,
          zoning: property.zoning,
          askingPrice: property.askingPrice,
          pricePerSqFt: property.pricePerSqFt,
          contactInfo: property.contactInfo,
          listingUrl: property.listingUrl,
          description: property.description,
          // PDF links
          additionalPhotosUrl: property.additionalPhotosUrl,
          assessorPageUrl: property.assessorPageUrl,
          historicLandUseUrl: property.historicLandUseUrl,
          proposalSummaryUrl: property.proposalSummaryUrl,
          propertyImageUrl: property.propertyImageUrl,
          status: property.status,
          lastSyncedAt: property.lastSyncedAt,
          updatedAt: property.updatedAt,
        });
        updated++;
      } else {
        // Insert new property
        await ctx.db.insert("commercialProperties", property);
        inserted++;
      }
    }

    return { inserted, updated };
  },
});

// =============================================================================
// Development Sites Mutations
// =============================================================================

export const upsertDevelopmentSites = internalMutation({
  args: {
    sites: v.array(
      v.object({
        browseAiTaskId: v.string(),
        address: v.string(),
        coordinates: v.array(v.number()),
        siteName: v.optional(v.string()),
        lotSizeSqFt: v.optional(v.number()),
        zoning: v.optional(v.string()),
        currentUse: v.optional(v.string()),
        proposedUse: v.optional(v.string()),
        askingPrice: v.optional(v.number()),
        incentives: v.optional(v.array(v.string())),
        contactInfo: v.optional(v.string()),
        listingUrl: v.optional(v.string()),
        description: v.optional(v.string()),
        // PDF links
        rfpUrl: v.optional(v.string()),
        assessorPageUrl: v.optional(v.string()),
        historicLandUseUrl: v.optional(v.string()),
        propertyImageUrl: v.optional(v.string()),
        status: v.union(
          v.literal("available"),
          v.literal("sold"),
          v.literal("pending"),
          v.literal("unknown")
        ),
        lastSyncedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const site of args.sites) {
      // Check if site already exists by address
      const existing = await ctx.db
        .query("developmentSites")
        .filter((q) => q.eq(q.field("address"), site.address))
        .first();

      if (existing) {
        // Update existing site
        await ctx.db.patch(existing._id, {
          browseAiTaskId: site.browseAiTaskId,
          coordinates: site.coordinates,
          siteName: site.siteName,
          lotSizeSqFt: site.lotSizeSqFt,
          zoning: site.zoning,
          currentUse: site.currentUse,
          proposedUse: site.proposedUse,
          askingPrice: site.askingPrice,
          incentives: site.incentives,
          contactInfo: site.contactInfo,
          listingUrl: site.listingUrl,
          description: site.description,
          // PDF links
          rfpUrl: site.rfpUrl,
          assessorPageUrl: site.assessorPageUrl,
          historicLandUseUrl: site.historicLandUseUrl,
          propertyImageUrl: site.propertyImageUrl,
          status: site.status,
          lastSyncedAt: site.lastSyncedAt,
          updatedAt: site.updatedAt,
        });
        updated++;
      } else {
        // Insert new site
        await ctx.db.insert("developmentSites", site);
        inserted++;
      }
    }

    return { inserted, updated };
  },
});
