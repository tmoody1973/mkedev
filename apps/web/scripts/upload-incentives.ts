#!/usr/bin/env npx tsx
/**
 * Upload Incentives Documents to File Search Store
 *
 * This script creates the mkedev-incentives File Search Store and uploads
 * all incentive documents from the data/incentives folder.
 *
 * Usage:
 *   npx tsx scripts/upload-incentives.ts
 */

import * as fs from "fs";
import * as path from "path";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MONOREPO_ROOT = path.resolve(__dirname, "../../..");

const INCENTIVE_DOCUMENTS = [
  {
    id: "strong-homes-loan",
    title: "$25,000 STRONG Homes Loan Program",
    path: "data/incentives/$25,000 STRONG Homes Loan Program.html",
  },
  {
    id: "strong-homes-brochure",
    title: "STRONG Homes Loan Brochure",
    path: "data/incentives/STRONGHomesLoan_Brochure1.pdf",
  },
  {
    id: "homebuyer-assistance",
    title: "$35,000 Homebuyer Assistance Program",
    path: "data/incentives/$35,000 Homebuyer Assistance Program.html",
  },
  {
    id: "homebuyer-assistance-brochure",
    title: "Homebuyer Assistance Program Brochure",
    path: "data/incentives/HBA_Brochure.pdf",
  },
  {
    id: "arch-program",
    title: "ARCH Program",
    path: "data/incentives/ARCH Program.html",
  },
  {
    id: "arch-application",
    title: "ARCH Loan Application Form",
    path: "data/incentives/ARCHLoanApplicationFormUpdated.pdf",
  },
  {
    id: "downpayment-assistance",
    title: "Milwaukee Home Down Payment Assistance Program",
    path: "data/incentives/Milwaukee Home Down Payment Assistance Program.html",
  },
  {
    id: "downpayment-assistance-guidelines",
    title: "Milwaukee Home Down Payment Assistance Guidelines",
    path: "data/incentives/MILWAUKEEHOMEDOWNPAYMENTASSISTANCEPROGRAMguidelines.pdf",
  },
];

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is not set");
    process.exit(1);
  }
  return apiKey;
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message: string) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".html":
    case ".htm":
      return "text/html";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

interface FileSearchStore {
  name: string;
  displayName: string;
}

async function listStores(apiKey: string): Promise<FileSearchStore[]> {
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`
    );
    if (!response.ok) {
      return [];
    }
    const result = await response.json();
    return result.fileSearchStores ?? [];
  } catch {
    return [];
  }
}

async function createStore(
  apiKey: string,
  displayName: string
): Promise<FileSearchStore | null> {
  log(`Creating store: ${displayName}`);
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/fileSearchStores?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logError(`Failed to create store: ${response.status} - ${errorText}`);
      return null;
    }

    const result = await response.json();
    log(`Created store: ${result.name}`);
    return result;
  } catch (error) {
    logError(`Error creating store: ${error}`);
    return null;
  }
}

async function uploadDocument(
  apiKey: string,
  storeName: string,
  filePath: string,
  displayName: string,
  sourceId: string
): Promise<boolean> {
  const fullPath = path.join(MONOREPO_ROOT, filePath);

  if (!fs.existsSync(fullPath)) {
    logError(`File not found: ${fullPath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath);
    const stats = fs.statSync(fullPath);
    const mimeType = getMimeType(fullPath);

    log(`Uploading: ${displayName}`);
    log(`  Path: ${filePath}`);
    log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    log(`  Type: ${mimeType}`);

    const customMetadata = [
      { key: "category", stringValue: "incentives" },
      { key: "sourceId", stringValue: sourceId },
    ];

    // Initialize resumable upload
    const initResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": stats.size.toString(),
          "X-Goog-Upload-Header-Content-Type": mimeType,
        },
        body: JSON.stringify({
          displayName: displayName,
          customMetadata: customMetadata,
          mimeType: mimeType,
        }),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      logError(`Failed to init upload: ${initResponse.status} - ${errorText}`);
      return false;
    }

    const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      logError("No upload URL returned");
      return false;
    }

    // Upload file content
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": stats.size.toString(),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: content,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      logError(`Failed to upload: ${uploadResponse.status} - ${errorText}`);
      return false;
    }

    const uploadResult = await uploadResponse.json();

    // Poll for completion if it's a long-running operation
    if (uploadResult.name && !uploadResult.done) {
      log(`  Processing...`);
      let operation = uploadResult;
      let attempts = 0;

      while (!operation.done && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusResponse = await fetch(
          `${GEMINI_API_BASE}/${operation.name}?key=${apiKey}`
        );
        if (statusResponse.ok) {
          operation = await statusResponse.json();
        }
        attempts++;
        if (attempts % 10 === 0) {
          log(`  Still processing... (${attempts * 3}s)`);
        }
      }

      if (!operation.done) {
        logError(`Operation timed out`);
        return false;
      }

      if (operation.error) {
        logError(`Operation failed: ${JSON.stringify(operation.error)}`);
        return false;
      }
    }

    log(`  ✓ Uploaded successfully`);
    return true;
  } catch (error) {
    logError(`Error uploading: ${error}`);
    return false;
  }
}

async function main() {
  log("=== Upload Incentives to File Search Store ===");

  const apiKey = getApiKey();

  // Check for existing store
  log("Checking for existing store...");
  const stores = await listStores(apiKey);
  let storeName = stores.find((s) => s.displayName === "mkedev-incentives")?.name;

  if (!storeName) {
    const newStore = await createStore(apiKey, "mkedev-incentives");
    if (!newStore) {
      logError("Failed to create store");
      process.exit(1);
    }
    storeName = newStore.name;
  } else {
    log(`Using existing store: ${storeName}`);
  }

  // Upload documents
  let uploaded = 0;
  let errors = 0;

  for (const doc of INCENTIVE_DOCUMENTS) {
    const success = await uploadDocument(
      apiKey,
      storeName,
      doc.path,
      doc.title,
      doc.id
    );

    if (success) {
      uploaded++;
    } else {
      errors++;
    }

    // Small delay between uploads
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  log("\n=== Summary ===");
  log(`Store: ${storeName}`);
  log(`Uploaded: ${uploaded}/${INCENTIVE_DOCUMENTS.length}`);
  log(`Errors: ${errors}`);

  if (errors > 0) {
    process.exit(1);
  }

  log("\n=== Next Steps ===");
  log("Register the store in Convex:");
  log(`  npx convex run ingestion/fileSearchStores:createStoreRecord --args '{"name": "${storeName}", "displayName": "mkedev-incentives", "category": "incentives", "documentCount": ${uploaded}}'`);
}

main().catch((error) => {
  logError(`Fatal error: ${error}`);
  process.exit(1);
});
