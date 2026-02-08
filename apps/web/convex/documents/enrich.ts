"use node";

/**
 * Document Context Enrichment Action
 *
 * After a document is classified, this action enriches it with parcel context
 * by geocoding the project address and querying zoning data at the resulting
 * coordinates. Reuses existing geocodeAddress and queryZoningAtPoint from
 * the agent tools module.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";
import { geocodeAddress, queryZoningAtPoint } from "../agents/tools";

// =============================================================================
// Types
// =============================================================================

/** Shape of the classification stored on uploadedDocuments. */
interface DocumentClassification {
  type: string;
  confidence: number;
  summary: string;
  extractedData: {
    projectAddress?: string;
    proposedUse?: string;
    buildingHeight?: string;
    stories?: number;
    unitCount?: number;
    squareFootage?: number;
    parkingSpaces?: number;
    lotSize?: string;
  };
}

/** Shape of the uploaded document record from Convex. */
interface UploadedDocumentRecord {
  _id: string;
  userId: string;
  storageId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  classification?: DocumentClassification;
  status: string;
  errorMessage?: string;
  parcelContext?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/** Result shape returned by the enrichment action. */
interface EnrichmentResult {
  success: boolean;
  reason?: string;
  message?: string;
  parcelContext?: Record<string, unknown>;
}

// =============================================================================
// Enrichment Action
// =============================================================================

/**
 * Enrich a classified document with parcel context (coordinates, zoning, overlays).
 *
 * Steps:
 * 1. Fetch document, check classification exists
 * 2. Determine address from classification or override
 * 3. Geocode address to coordinates
 * 4. Query zoning data at the geocoded point
 * 5. Store parcel context on the document
 */
export const enrichDocument = action({
  args: {
    documentId: v.id("uploadedDocuments"),
    overrideAddress: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<EnrichmentResult> => {
    const { documentId, overrideAddress } = args;

    console.log("[enrich] Starting enrichment for document:", documentId);

    // 1. Fetch document record
    const doc = (await ctx.runQuery(api.documents.upload.get, { documentId })) as UploadedDocumentRecord | null;
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // 2. Determine address
    const address: string | undefined =
      overrideAddress ?? doc.classification?.extractedData?.projectAddress;

    if (!address) {
      // No address available -- leave status as "classified" so UI can prompt the user
      console.log(
        "[enrich] No address available for enrichment, leaving status as classified"
      );
      return {
        success: false,
        reason: "no_address",
        message:
          "No address found. Please provide an address or select a parcel on the map.",
      };
    }

    // 3. Update status to "enriching"
    await ctx.runMutation(internal.documents.upload.updateStatus, {
      documentId,
      status: "enriching",
    });

    try {
      // 4. Geocode the address using existing tool function
      console.log(`[enrich] Geocoding address: "${address}"`);
      const geocodeResult = await geocodeAddress({ address });

      if (!geocodeResult.success || !geocodeResult.coordinates) {
        console.error("[enrich] Geocoding failed:", geocodeResult.error);

        // Build partial parcel context with just the address
        const partialContext: Record<string, unknown> = {
          address,
        };

        await ctx.runMutation(internal.documents.upload.updateStatus, {
          documentId,
          status: "classified",
          parcelContext: partialContext,
        });

        return {
          success: false,
          reason: "geocoding_failed",
          message: geocodeResult.error ?? "Could not geocode address",
          parcelContext: partialContext,
        };
      }

      const { longitude, latitude } = geocodeResult.coordinates;
      console.log(
        `[enrich] Geocoded to: [${longitude}, ${latitude}]`
      );

      // 5. Query zoning at the geocoded coordinates
      console.log("[enrich] Querying zoning at point...");
      const zoningResult = await queryZoningAtPoint({ longitude, latitude });

      // Build overlay and incentive zone arrays
      const overlayZones: string[] = [];
      const incentiveZones: string[] = [];

      if (zoningResult.success && zoningResult.overlayZones) {
        for (const zone of zoningResult.overlayZones) {
          if (
            zone.includes("TIF") ||
            zone.includes("Opportunity Zone") ||
            zone.includes("NMTC")
          ) {
            incentiveZones.push(zone);
          } else {
            overlayZones.push(zone);
          }
        }
      }

      // 6. Build parcel context object
      const parcelContext: Record<string, unknown> = {
        address: geocodeResult.formattedAddress ?? address,
        coordinates: [longitude, latitude],
        zoningDistrict: zoningResult.success
          ? zoningResult.zoningDistrict
          : undefined,
        zoningCategory: zoningResult.success
          ? zoningResult.zoningCategory
          : undefined,
        overlayZones: overlayZones.length > 0 ? overlayZones : undefined,
        incentiveZones: incentiveZones.length > 0 ? incentiveZones : undefined,
        areaPlan: undefined, // Area plan lookup is not available via point query
        lotSize: undefined, // Lot size is not directly available from zoning query
      };

      console.log("[enrich] Parcel context built:", {
        address: parcelContext.address,
        zoningDistrict: parcelContext.zoningDistrict,
        overlayCount: overlayZones.length,
        incentiveCount: incentiveZones.length,
      });

      // 7. Update document with parcel context and status "classified" (ready for analysis)
      await ctx.runMutation(internal.documents.upload.updateStatus, {
        documentId,
        status: "classified",
        parcelContext,
      });

      return {
        success: true,
        parcelContext,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Enrichment failed";
      console.error("[enrich] Error during enrichment:", errorMessage);

      // Set status back to "classified" on enrichment failure (not "error")
      // The document is still usable without enrichment data
      await ctx.runMutation(internal.documents.upload.updateStatus, {
        documentId,
        status: "classified",
        errorMessage: `Enrichment failed: ${errorMessage}`,
      });

      return {
        success: false,
        reason: "enrichment_error",
        message: errorMessage,
      };
    }
  },
});
