#!/usr/bin/env npx tsx
/**
 * Document Upload Script
 *
 * Uploads PDF documents to Gemini Files API and updates Convex records.
 * Run this script locally to seed the document corpus.
 *
 * Usage:
 *   pnpm upload-docs           # Upload all pending documents
 *   pnpm upload-docs --single zoning-ch295-sub1  # Upload single document
 *   pnpm upload-docs --status  # Check upload status
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { PDF_SOURCES } from "../convex/ingestion/corpusConfig";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

// =============================================================================
// Configuration
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// =============================================================================
// Gemini Files API
// =============================================================================

interface GeminiFileResponse {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: "PROCESSING" | "ACTIVE" | "FAILED";
}

/**
 * Upload a PDF file to Gemini Files API using resumable upload.
 */
async function uploadToGemini(
  filePath: string,
  displayName: string
): Promise<GeminiFileResponse> {
  // PDFs are at monorepo root, not apps/web
  const monorepoRoot = path.resolve(process.cwd(), "../..");
  const absolutePath = path.resolve(monorepoRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const fileSize = fileBuffer.length;

  console.log(`  Uploading ${displayName} (${(fileSize / 1024).toFixed(1)} KB)...`);

  // Step 1: Start resumable upload session
  const initResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": fileSize.toString(),
        "X-Goog-Upload-Header-Content-Type": "application/pdf",
      },
      body: JSON.stringify({
        file: {
          display_name: displayName,
        },
      }),
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`Failed to initialize upload: ${initResponse.status} - ${errorText}`);
  }

  const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("Failed to get upload URL from Gemini API");
  }

  // Step 2: Upload the file content
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": fileSize.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
  }

  const result = await uploadResponse.json();
  return result.file;
}

/**
 * Wait for a file to become ACTIVE in Gemini.
 */
async function waitForFileActive(fileName: string, maxWaitMs = 60000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to check file status: ${response.status}`);
    }

    const file = await response.json();

    if (file.state === "ACTIVE") {
      return;
    }

    if (file.state === "FAILED") {
      throw new Error(`File processing failed: ${fileName}`);
    }

    // Wait 2 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Timeout waiting for file to become active: ${fileName}`);
}

// =============================================================================
// Upload Commands
// =============================================================================

/**
 * Seed documents table from corpus config (if not already seeded).
 */
async function seedDocuments(): Promise<void> {
  console.log("Seeding documents from corpus config...");
  const result = await convex.mutation(api.ingestion.documents.seed, {});
  console.log(`  Created: ${result.created}, Skipped: ${result.skipped}, Total: ${result.total}`);
}

/**
 * Upload a single document by sourceId.
 */
async function uploadSingleDocument(sourceId: string): Promise<boolean> {
  const source = PDF_SOURCES.find((s) => s.id === sourceId);
  if (!source) {
    console.error(`Source not found: ${sourceId}`);
    return false;
  }

  console.log(`\nUploading: ${source.title}`);

  try {
    // Upload to Gemini
    const geminiFile = await uploadToGemini(source.source, source.title);

    // Wait for file to be active
    console.log(`  Waiting for file to be active...`);
    await waitForFileActive(geminiFile.name);

    // Update Convex record
    console.log(`  Updating Convex record...`);
    await convex.mutation(api.ingestion.documents.updateGeminiFile, {
      sourceId: source.id,
      geminiFileUri: geminiFile.uri,
      geminiFileName: geminiFile.name,
      mimeType: geminiFile.mimeType,
      fileSizeBytes: parseInt(geminiFile.sizeBytes, 10),
    });

    console.log(`  Success! URI: ${geminiFile.uri}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`  Failed: ${message}`);

    // Update status to error
    try {
      await convex.mutation(api.ingestion.documents.updateStatus, {
        sourceId: source.id,
        status: "error",
        errorMessage: message,
      });
    } catch {
      // Ignore update errors
    }

    return false;
  }
}

/**
 * Upload all pending documents.
 */
async function uploadAllDocuments(category?: string): Promise<void> {
  // First, seed documents if needed
  await seedDocuments();

  // Filter sources by category if specified
  let sources = PDF_SOURCES;
  if (category) {
    sources = sources.filter((s) => s.category === category);
    console.log(`\nFiltering to category: ${category}`);
  }

  console.log(`\nUploading ${sources.length} documents...`);

  let success = 0;
  let failed = 0;

  for (const source of sources) {
    const result = await uploadSingleDocument(source.id);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Small delay between uploads to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n========================================`);
  console.log(`Upload Complete`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`========================================`);
}

/**
 * Show status of all documents.
 */
async function showStatus(): Promise<void> {
  console.log("Fetching document status...\n");

  const status = await convex.query(api.ingestion.documents.getStatus, {});

  console.log("Document Corpus Status");
  console.log("========================================");
  console.log(`Total Documents: ${status.total}`);
  console.log(`  Pending:   ${status.pending}`);
  console.log(`  Uploading: ${status.uploading}`);
  console.log(`  Uploaded:  ${status.uploaded}`);
  console.log(`  Expired:   ${status.expired}`);
  console.log(`  Error:     ${status.error}`);
  console.log("");
  console.log("By Category:");
  for (const [cat, count] of Object.entries(status.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }

  if (status.fileUris.length > 0) {
    console.log("");
    console.log(`Active File URIs: ${status.fileUris.length}`);
  }
}

/**
 * Refresh expired documents by re-uploading them.
 */
async function refreshExpiredDocuments(): Promise<void> {
  console.log("Checking for expired documents...\n");

  // Get documents that need refresh (expired or expiring soon)
  const expiring = await convex.query(api.ingestion.documents.getExpiring, {
    withinMs: 6 * 60 * 60 * 1000, // 6 hours
  });

  if (expiring.length === 0) {
    console.log("No documents need refresh.");
    return;
  }

  console.log(`Found ${expiring.length} documents to refresh:\n`);

  let success = 0;
  let failed = 0;

  for (const doc of expiring) {
    console.log(`Refreshing: ${doc.title}`);

    // Reset to pending first
    await convex.mutation(api.ingestion.documents.resetDocument, {
      sourceId: doc.sourceId,
    });

    // Re-upload
    const result = await uploadSingleDocument(doc.sourceId);
    if (result) {
      success++;
    } else {
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n========================================`);
  console.log(`Refresh Complete`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`========================================`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Document Upload Script

Usage:
  pnpm upload-docs                      Upload all pending PDF documents
  pnpm upload-docs --zoning             Upload only zoning code PDFs
  pnpm upload-docs --single <sourceId>  Upload a single document
  pnpm upload-docs --status             Show corpus status
  pnpm upload-docs --seed               Only seed documents (no upload)
  pnpm upload-docs --refresh            Refresh expired documents

Examples:
  pnpm upload-docs --single zoning-ch295-sub1
  pnpm upload-docs --zoning
  pnpm upload-docs --status
  pnpm upload-docs --refresh
`);
    return;
  }

  if (args.includes("--status")) {
    await showStatus();
    return;
  }

  if (args.includes("--seed")) {
    await seedDocuments();
    return;
  }

  if (args.includes("--refresh")) {
    await refreshExpiredDocuments();
    return;
  }

  const singleIndex = args.indexOf("--single");
  if (singleIndex !== -1) {
    const sourceId = args[singleIndex + 1];
    if (!sourceId) {
      console.error("Error: --single requires a sourceId");
      process.exit(1);
    }
    await seedDocuments();
    await uploadSingleDocument(sourceId);
    return;
  }

  if (args.includes("--zoning")) {
    await uploadAllDocuments("zoning-codes");
    return;
  }

  // Default: upload all
  await uploadAllDocuments();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
