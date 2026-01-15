#!/usr/bin/env npx tsx
/**
 * Upload Documents to Gemini File Search Stores
 *
 * Uploads PDF documents directly to Gemini File Search Stores for RAG with grounding.
 * File Search Stores provide better citation support than the legacy Files API.
 *
 * Usage:
 *   pnpm upload-file-search           # Upload all documents to stores
 *   pnpm upload-file-search --status  # Check store status
 *   pnpm upload-file-search --reset   # Delete stores and recreate
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { PDF_SOURCES } from "../convex/ingestion/corpusConfig";
import type { Id } from "../convex/_generated/dataModel";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

// =============================================================================
// Configuration
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// Category to store mapping
const CATEGORIES = ["zoning-codes", "area-plans", "policies"] as const;
type Category = (typeof CATEGORIES)[number];

// =============================================================================
// Gemini File Search Store API
// =============================================================================

interface GeminiStore {
  name: string;
  displayName: string;
  createTime: string;
}

interface GeminiUploadResult {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  state: string;
}

/**
 * Create a File Search Store in Gemini.
 */
async function createGeminiStore(displayName: string): Promise<GeminiStore> {
  const response = await fetch(
    `${GEMINI_API_BASE}/fileSearchStores?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create store: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

interface GeminiFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  state: string;
  uri: string;
}

/**
 * Upload a file to Gemini Files API using resumable upload.
 */
async function uploadToFilesApi(
  filePath: string,
  displayName: string
): Promise<GeminiFile> {
  // PDFs are at monorepo root, not apps/web
  const monorepoRoot = path.resolve(process.cwd(), "../..");
  const absolutePath = path.resolve(monorepoRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const sizeKb = (fileBuffer.length / 1024).toFixed(1);
  console.log(`    Size: ${sizeKb} KB`);

  // Step 1: Start resumable upload to Files API
  const initResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": fileBuffer.length.toString(),
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
    throw new Error(`Failed to init upload: ${initResponse.status} - ${errorText}`);
  }

  const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("No upload URL returned");
  }

  // Step 2: Upload file content
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": fileBuffer.length.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const result = await uploadResponse.json();
  return result.file;
}

/**
 * Wait for a file to be processed by Gemini.
 */
async function waitForFileProcessing(fileName: string): Promise<GeminiFile> {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(
      `${GEMINI_API_BASE}/${fileName}?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get file status: ${response.status}`);
    }

    const file = await response.json() as GeminiFile;

    if (file.state === "ACTIVE") {
      return file;
    }

    if (file.state === "FAILED") {
      throw new Error(`File processing failed: ${fileName}`);
    }

    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error(`Timeout waiting for file to process: ${fileName}`);
}

/**
 * Import a file from Files API into a File Search Store.
 */
async function importFileToStore(
  storeName: string,
  fileName: string
): Promise<void> {
  const response = await fetch(
    `${GEMINI_API_BASE}/${storeName}:importFile?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: fileName,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to import file: ${response.status} - ${errorText}`);
  }

  // The import is an async operation, we should poll for completion
  // For now, we'll just log success - the store will index the file
  console.log(`    Imported to store`);
}

/**
 * Upload a file to Files API and import to a File Search Store.
 */
async function uploadToGeminiStore(
  storeName: string,
  filePath: string,
  displayName: string
): Promise<GeminiUploadResult> {
  // Step 1: Upload to Files API
  console.log(`    Uploading to Files API...`);
  const file = await uploadToFilesApi(filePath, displayName);
  console.log(`    File: ${file.name}`);

  // Step 2: Wait for file to be processed
  console.log(`    Waiting for processing...`);
  const processedFile = await waitForFileProcessing(file.name);
  console.log(`    File active: ${processedFile.state}`);

  // Step 3: Import to File Search Store
  console.log(`    Importing to File Search Store...`);
  await importFileToStore(storeName, file.name);

  return {
    name: file.name,
    displayName: file.displayName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    state: processedFile.state,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get or create a File Search Store for a category.
 */
async function getOrCreateStore(
  category: Category
): Promise<{ storeId: Id<"fileSearchStores">; storeName: string }> {
  // Check if store exists in Convex
  const stores = await convex.query(api.ingestion.fileSearchStores.listStores, {});
  const existingStore = stores.find(
    (s: { category: string; _id: Id<"fileSearchStores">; name: string }) =>
      s.category === category
  );

  if (existingStore) {
    console.log(`  Using existing store: ${existingStore.name}`);
    return { storeId: existingStore._id, storeName: existingStore.name };
  }

  // Create new store in Gemini
  console.log(`  Creating new store for ${category}...`);
  const displayName = `mkedev-${category}`;
  const geminiStore = await createGeminiStore(displayName);
  console.log(`  Created: ${geminiStore.name}`);

  // Create record in Convex
  const storeId = await convex.mutation(
    api.ingestion.fileSearchStores.createStoreRecord,
    {
      name: geminiStore.name,
      displayName,
      category,
    }
  );

  // Update to active
  await convex.mutation(api.ingestion.fileSearchStores.updateStoreStatus, {
    storeId,
    status: "active",
  });

  return { storeId, storeName: geminiStore.name };
}

// =============================================================================
// Upload Commands
// =============================================================================

/**
 * Upload a single document to a store.
 */
async function uploadDocument(
  source: (typeof PDF_SOURCES)[number],
  storeId: Id<"fileSearchStores">,
  storeName: string
): Promise<boolean> {
  console.log(`\n  Uploading: ${source.title}`);

  try {
    // Upload directly to Gemini
    const result = await uploadToGeminiStore(
      storeName,
      source.source,
      source.title
    );

    // Create document record in Convex
    const documentId = await convex.mutation(
      api.ingestion.fileSearchStores.createDocumentRecord,
      {
        storeId,
        sourceId: source.id,
        displayName: source.title,
        category: source.category as Category,
        mimeType: "application/pdf",
      }
    );

    // Update with Gemini document name
    await convex.mutation(api.ingestion.fileSearchStores.updateDocumentStatus, {
      documentId,
      status: "active",
      documentName: result.name,
      sizeBytes: parseInt(result.sizeBytes, 10),
    });

    console.log(`    Success! Document: ${result.name}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`    Error: ${message}`);
    return false;
  }
}

/**
 * Upload all documents to File Search Stores.
 */
async function uploadAllDocuments(): Promise<void> {
  console.log("Uploading documents to File Search Stores...\n");

  // Group sources by category
  const sourcesByCategory = new Map<Category, typeof PDF_SOURCES>();
  for (const source of PDF_SOURCES) {
    const category = source.category as Category;
    if (!CATEGORIES.includes(category)) continue;

    if (!sourcesByCategory.has(category)) {
      sourcesByCategory.set(category, []);
    }
    sourcesByCategory.get(category)!.push(source);
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  // Process each category
  for (const category of CATEGORIES) {
    const sources = sourcesByCategory.get(category) || [];
    if (sources.length === 0) {
      console.log(`\nSkipping ${category}: no documents`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`Category: ${category} (${sources.length} documents)`);
    console.log(`========================================`);

    // Get or create store
    let storeId: Id<"fileSearchStores">;
    let storeName: string;
    try {
      const storeInfo = await getOrCreateStore(category);
      storeId = storeInfo.storeId;
      storeName = storeInfo.storeName;
    } catch (error) {
      console.error(`Failed to get/create store: ${error}`);
      totalFailed += sources.length;
      continue;
    }

    // Check which documents are already uploaded
    const existingDocs = await convex.query(
      api.ingestion.fileSearchStores.listStoreDocuments,
      { storeId }
    );
    const uploadedSourceIds = new Set(
      existingDocs
        .filter((d: { status: string }) => d.status === "active")
        .map((d: { sourceId: string }) => d.sourceId)
    );

    // Upload each document
    for (const source of sources) {
      if (uploadedSourceIds.has(source.id)) {
        console.log(`\n  Skipping (already uploaded): ${source.title}`);
        totalSuccess++;
        continue;
      }

      const success = await uploadDocument(source, storeId, storeName);
      if (success) {
        totalSuccess++;
      } else {
        totalFailed++;
      }

      // Update store document count
      const docs = await convex.query(
        api.ingestion.fileSearchStores.listStoreDocuments,
        { storeId }
      );
      const activeCount = docs.filter(
        (d: { status: string }) => d.status === "active"
      ).length;
      await convex.mutation(api.ingestion.fileSearchStores.updateStoreStatus, {
        storeId,
        status: "active",
        documentCount: activeCount,
      });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n========================================`);
  console.log(`Upload Complete`);
  console.log(`  Success: ${totalSuccess}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`========================================`);
}

/**
 * Show status of File Search Stores.
 */
async function showStatus(): Promise<void> {
  console.log("File Search Store Status\n");

  const stores = await convex.query(api.ingestion.fileSearchStores.listStores, {});

  if (stores.length === 0) {
    console.log("No File Search Stores found.");
    return;
  }

  for (const store of stores) {
    console.log(`========================================`);
    console.log(`Store: ${store.displayName}`);
    console.log(`  Name: ${store.name}`);
    console.log(`  Category: ${store.category}`);
    console.log(`  Status: ${store.status}`);
    console.log(`  Documents: ${store.documentCount}`);

    // Get document details
    const docs = await convex.query(
      api.ingestion.fileSearchStores.listStoreDocuments,
      { storeId: store._id }
    );

    if (docs.length > 0) {
      console.log(`  Document List:`);
      for (const doc of docs) {
        console.log(`    - ${doc.displayName} [${doc.status}]`);
      }
    }
  }
}

/**
 * Delete all File Search Store records.
 */
async function deleteAllStores(): Promise<void> {
  console.log("Deleting all File Search Store records...\n");

  const stores = await convex.query(api.ingestion.fileSearchStores.listStores, {});

  if (stores.length === 0) {
    console.log("No stores to delete.");
    return;
  }

  for (const store of stores) {
    console.log(`Deleting store record: ${store.displayName}`);

    // Delete document records first
    const docs = await convex.query(
      api.ingestion.fileSearchStores.listStoreDocuments,
      { storeId: store._id }
    );

    for (const doc of docs) {
      await convex.mutation(api.ingestion.fileSearchStores.deleteDocumentRecord, {
        documentId: doc._id,
      });
    }

    // Delete store record
    await convex.mutation(api.ingestion.fileSearchStores.deleteStoreRecord, {
      storeId: store._id,
    });
  }

  console.log("\nAll store records deleted.");
  console.log("Note: You may need to manually delete the actual Gemini stores at:");
  console.log("https://aistudio.google.com/app/storage");
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Upload Documents to File Search Stores

Usage:
  pnpm upload-file-search           Upload all PDF documents to stores
  pnpm upload-file-search --status  Show store status
  pnpm upload-file-search --reset   Delete store records and recreate

Examples:
  pnpm upload-file-search --status
  pnpm upload-file-search
`);
    return;
  }

  if (args.includes("--status")) {
    await showStatus();
    return;
  }

  if (args.includes("--reset")) {
    await deleteAllStores();
    console.log("\nNow run 'pnpm upload-file-search' to recreate stores.");
    return;
  }

  // Default: upload all
  await uploadAllDocuments();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
