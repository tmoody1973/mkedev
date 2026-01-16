/**
 * Planning Ingestion HTTP Actions
 *
 * HTTP endpoints for the Python ADK agent to call.
 * These actions handle authentication and delegate to internal mutations.
 */

import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

// =============================================================================
// Upsert Planning Document
// =============================================================================

/**
 * POST /api/planning/documents/upsert
 *
 * Create or update a planning document.
 */
export const upsertDocument = httpAction(async (ctx, request) => {
  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate required fields
  const required = [
    "sourceId",
    "sourceUrl",
    "title",
    "contentType",
    "category",
    "syncFrequency",
    "contentHash",
    "status",
  ];
  for (const field of required) {
    if (!body[field]) {
      return new Response(
        JSON.stringify({ error: `Missing required field: ${field}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    const docId = await ctx.runMutation(api.ingestion.planningDocuments.upsert, {
      sourceId: body.sourceId,
      sourceUrl: body.sourceUrl,
      title: body.title,
      contentType: body.contentType,
      category: body.category,
      syncFrequency: body.syncFrequency,
      markdownContent: body.markdownContent,
      pdfStorageId: body.pdfStorageId,
      contentHash: body.contentHash,
      status: body.status,
    });

    return new Response(JSON.stringify({ success: true, docId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// =============================================================================
// Update Document Status
// =============================================================================

/**
 * POST /api/planning/documents/status
 *
 * Update a document's status.
 */
export const updateStatus = httpAction(async (ctx, request) => {
  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.sourceId || !body.status) {
    return new Response(
      JSON.stringify({ error: "sourceId and status are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const docId = await ctx.runMutation(
      api.ingestion.planningDocuments.updateStatus,
      {
        sourceId: body.sourceId,
        status: body.status,
        errorMessage: body.errorMessage,
        geminiFileUri: body.geminiFileUri,
        fileSearchStoreId: body.fileSearchStoreId,
      }
    );

    return new Response(JSON.stringify({ success: true, docId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// =============================================================================
// Get Document by Source ID
// =============================================================================

/**
 * GET /api/planning/documents/:sourceId
 *
 * Get a document by its source ID.
 */
export const getDocument = httpAction(async (ctx, request) => {
  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract sourceId from URL
  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId");

  if (!sourceId) {
    return new Response(
      JSON.stringify({ error: "sourceId query parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const doc = await ctx.runQuery(
      api.ingestion.planningDocuments.getBySourceId,
      { sourceId }
    );

    if (!doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// =============================================================================
// Check Content Hash
// =============================================================================

/**
 * GET /api/planning/documents/check-hash
 *
 * Check if content has changed by comparing hash.
 */
export const checkHash = httpAction(async (ctx, request) => {
  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract parameters from URL
  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId");
  const contentHash = url.searchParams.get("contentHash");

  if (!sourceId || !contentHash) {
    return new Response(
      JSON.stringify({
        error: "sourceId and contentHash query parameters are required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const result = await ctx.runQuery(
      api.ingestion.planningDocuments.checkContentHash,
      { sourceId, contentHash }
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// =============================================================================
// List Documents by Sync Frequency
// =============================================================================

/**
 * GET /api/planning/documents/by-frequency
 *
 * List all documents by sync frequency.
 */
export const listByFrequency = httpAction(async (ctx, request) => {
  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract frequency from URL
  const url = new URL(request.url);
  const syncFrequency = url.searchParams.get("syncFrequency");

  if (!syncFrequency || !["weekly", "monthly"].includes(syncFrequency)) {
    return new Response(
      JSON.stringify({
        error: "syncFrequency query parameter must be 'weekly' or 'monthly'",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const docs = await ctx.runQuery(
      api.ingestion.planningDocuments.listBySyncFrequency,
      { syncFrequency: syncFrequency as "weekly" | "monthly" }
    );

    return new Response(JSON.stringify(docs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
