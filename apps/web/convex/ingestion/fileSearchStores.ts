/**
 * Gemini File Search Stores
 *
 * Convex actions for managing Gemini File Search Stores.
 * File Search Stores provide persistent document storage with semantic search.
 *
 * Benefits over direct file upload:
 * - No 48-hour expiration
 * - Automatic chunking and embedding
 * - Semantic search with metadata filtering
 */

import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// =============================================================================
// Configuration
// =============================================================================

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

type StoreCategory =
  | "zoning-codes"
  | "area-plans"
  | "policies"
  | "ordinances"
  | "guides"
  | "incentives"
  | "all";

// =============================================================================
// Helpers
// =============================================================================

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return apiKey;
}

// =============================================================================
// Convex Queries
// =============================================================================

/**
 * List all File Search Stores.
 */
export const listStores = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("zoning-codes"),
        v.literal("area-plans"),
        v.literal("policies"),
        v.literal("ordinances"),
        v.literal("guides"),
        v.literal("incentives"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("fileSearchStores")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    return await ctx.db.query("fileSearchStores").collect();
  },
});

/**
 * Get a store by category.
 */
export const getStoreByCategory = query({
  args: {
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("incentives"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fileSearchStores")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .first();
  },
});

/**
 * List documents in a store.
 */
export const listStoreDocuments = query({
  args: {
    storeId: v.id("fileSearchStores"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storeDocuments")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// =============================================================================
// Convex Mutations
// =============================================================================

/**
 * Create a File Search Store record.
 */
export const createStoreRecord = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("incentives"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("fileSearchStores", {
      name: args.name,
      displayName: args.displayName,
      category: args.category,
      documentCount: 0,
      status: "creating",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a store's status.
 */
export const updateStoreStatus = mutation({
  args: {
    storeId: v.id("fileSearchStores"),
    status: v.union(
      v.literal("creating"),
      v.literal("active"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    documentCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }
    if (args.documentCount !== undefined) {
      updates.documentCount = args.documentCount;
    }

    await ctx.db.patch(args.storeId, updates);
  },
});

/**
 * Create a store document record.
 */
export const createDocumentRecord = mutation({
  args: {
    storeId: v.id("fileSearchStores"),
    sourceId: v.string(),
    displayName: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("incentives")
    ),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("storeDocuments", {
      storeId: args.storeId,
      sourceId: args.sourceId,
      displayName: args.displayName,
      category: args.category,
      mimeType: args.mimeType,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a document's status.
 */
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("storeDocuments"),
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("active"),
      v.literal("error")
    ),
    documentName: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.documentName !== undefined) {
      updates.documentName = args.documentName;
    }
    if (args.sizeBytes !== undefined) {
      updates.sizeBytes = args.sizeBytes;
    }
    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.documentId, updates);
  },
});

/**
 * Delete a store document record.
 */
export const deleteDocumentRecord = mutation({
  args: {
    documentId: v.id("storeDocuments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
  },
});

/**
 * Delete a store record.
 */
export const deleteStoreRecord = mutation({
  args: {
    storeId: v.id("fileSearchStores"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.storeId);
  },
});

// =============================================================================
// Gemini API Actions
// =============================================================================

/**
 * Create a new File Search Store in Gemini.
 */
export const createStore = action({
  args: {
    displayName: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("incentives"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    storeId?: Id<"fileSearchStores">;
    storeName?: string;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();

    try {
      // Create File Search Store in Gemini
      const response = await fetch(
        `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: args.displayName,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Gemini API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const storeName = result.name;

      // Create record in Convex
      const storeId = await ctx.runMutation(
        api.ingestion.fileSearchStores.createStoreRecord,
        {
          name: storeName,
          displayName: args.displayName,
          category: args.category,
        }
      );

      // Update status to active
      await ctx.runMutation(
        api.ingestion.fileSearchStores.updateStoreStatus,
        {
          storeId,
          status: "active",
        }
      );

      return {
        success: true,
        storeId,
        storeName,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to create store: ${message}`,
      };
    }
  },
});

/**
 * List all File Search Stores from Gemini API.
 */
export const listGeminiStores = action({
  args: {},
  handler: async (): Promise<{
    success: boolean;
    stores?: Array<{
      name: string;
      displayName: string;
      createTime: string;
    }>;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Gemini API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        stores: result.fileSearchStores ?? [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  },
});

/**
 * Upload a document to a File Search Store.
 * Uses the importFile method for pre-uploaded files.
 */
export const uploadToStore = action({
  args: {
    storeId: v.id("fileSearchStores"),
    sourceId: v.string(),
    displayName: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("incentives")
    ),
    base64Content: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    documentId?: Id<"storeDocuments">;
    error?: string;
  }> => {
    const apiKey = getGeminiApiKey();
    const mimeType = args.mimeType ?? "application/pdf";

    try {
      // Get store name from Convex
      const store = await ctx.runQuery(api.ingestion.fileSearchStores.listStores, {});
      const storeRecord = store.find((s: { _id: Id<"fileSearchStores">; name: string }) => s._id === args.storeId);

      if (!storeRecord) {
        return {
          success: false,
          error: "Store not found",
        };
      }

      // Create document record in Convex
      const documentId = await ctx.runMutation(
        api.ingestion.fileSearchStores.createDocumentRecord,
        {
          storeId: args.storeId,
          sourceId: args.sourceId,
          displayName: args.displayName,
          category: args.category,
          mimeType,
        }
      );

      // Update status to uploading
      await ctx.runMutation(
        api.ingestion.fileSearchStores.updateDocumentStatus,
        {
          documentId,
          status: "uploading",
        }
      );

      // Decode base64 content
      const binaryContent = Buffer.from(args.base64Content, "base64");

      // Upload directly to the File Search Store
      const uploadResponse = await fetch(
        `${GEMINI_API_BASE}/${storeRecord.name}:uploadFile?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": mimeType,
            "X-Goog-Upload-Protocol": "raw",
          },
          body: binaryContent,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();

        await ctx.runMutation(
          api.ingestion.fileSearchStores.updateDocumentStatus,
          {
            documentId,
            status: "error",
            errorMessage: `Upload failed: ${uploadResponse.status} - ${errorText}`,
          }
        );

        return {
          success: false,
          error: `Upload failed: ${uploadResponse.status} - ${errorText}`,
        };
      }

      const uploadResult = await uploadResponse.json();

      // Update document record with Gemini document name
      await ctx.runMutation(
        api.ingestion.fileSearchStores.updateDocumentStatus,
        {
          documentId,
          status: "active",
          documentName: uploadResult.name,
          sizeBytes: binaryContent.length,
        }
      );

      // Update store document count
      const docs = await ctx.runQuery(
        api.ingestion.fileSearchStores.listStoreDocuments,
        { storeId: args.storeId }
      );
      const activeCount = docs.filter((d: { status: string }) => d.status === "active").length;

      await ctx.runMutation(
        api.ingestion.fileSearchStores.updateStoreStatus,
        {
          storeId: args.storeId,
          status: "active",
          documentCount: activeCount,
        }
      );

      return {
        success: true,
        documentId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Upload failed: ${message}`,
      };
    }
  },
});

/**
 * Delete a File Search Store from Gemini.
 */
export const deleteStore = action({
  args: {
    storeName: v.string(),
  },
  handler: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    // Note: Deleting stores is not commonly needed and requires
    // additional implementation. For now, return not implemented.
    return {
      success: false,
      error: "Store deletion not implemented yet",
    };
  },
});

/**
 * Test the File Search Stores API connection.
 */
export const testConnection = action({
  args: {},
  handler: async (): Promise<{
    success: boolean;
    message: string;
    storeCount?: number;
  }> => {
    const apiKey = getGeminiApiKey();

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const storeCount = result.fileSearchStores?.length ?? 0;

      return {
        success: true,
        message: "File Search Stores API connection successful",
        storeCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Connection failed: ${message}`,
      };
    }
  },
});

/**
 * Sync existing Gemini File Search Stores to Convex.
 * This registers stores that were created externally (e.g., via setup script).
 */
export const syncStoresFromGemini = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    synced: number;
    skipped: number;
    errors: string[];
  }> => {
    const apiKey = getGeminiApiKey();
    const errors: string[] = [];
    let synced = 0;
    let skipped = 0;

    try {
      // List stores from Gemini API
      const response = await fetch(
        `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          synced: 0,
          skipped: 0,
          errors: [`Failed to list Gemini stores: ${response.status} - ${errorText}`],
        };
      }

      const result = await response.json();
      const geminiStores = result.fileSearchStores ?? [];

      // Get existing Convex stores
      const existingStores = await ctx.runQuery(
        api.ingestion.fileSearchStores.listStores,
        {}
      );
      const existingNames = new Set(
        existingStores.map((s: { name: string }) => s.name)
      );

      // Sync each Gemini store
      for (const store of geminiStores) {
        const storeName = store.name as string;
        const displayName = store.displayName as string;

        // Skip if already in Convex
        if (existingNames.has(storeName)) {
          skipped++;
          continue;
        }

        // Determine category from display name
        let category: StoreCategory = "all";
        if (displayName.includes("zoning")) {
          category = "zoning-codes";
        } else if (displayName.includes("area") || displayName.includes("plan")) {
          category = "area-plans";
        } else if (displayName.includes("polic")) {
          category = "policies";
        } else if (displayName.includes("ordinance")) {
          category = "ordinances";
        } else if (displayName.includes("guide")) {
          category = "guides";
        }

        try {
          // Create record in Convex
          const storeId = await ctx.runMutation(
            api.ingestion.fileSearchStores.createStoreRecord,
            {
              name: storeName,
              displayName: displayName,
              category: category,
            }
          );

          // Mark as active
          await ctx.runMutation(
            api.ingestion.fileSearchStores.updateStoreStatus,
            {
              storeId,
              status: "active",
              documentCount: 12, // Default for zoning-codes store
            }
          );

          synced++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`Failed to sync ${storeName}: ${msg}`);
        }
      }

      return {
        success: errors.length === 0,
        synced,
        skipped,
        errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        synced: 0,
        skipped: 0,
        errors: [`Sync failed: ${message}`],
      };
    }
  },
});
