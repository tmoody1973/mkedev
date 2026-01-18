#!/usr/bin/env npx tsx
/**
 * Setup File Search Stores
 *
 * This script creates Gemini File Search Stores and uploads documents.
 * Run this once to migrate from the legacy direct file upload approach.
 *
 * Usage:
 *   npx tsx scripts/setup-file-search-stores.ts
 *
 * Environment variables:
 *   GEMINI_API_KEY - Google Gemini API key
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Configuration
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const CATEGORIES = [
  "zoning-codes",
  "area-plans",
  "policies",
  "ordinances",
  "guides",
  "incentives",
] as const;

type Category = (typeof CATEGORIES)[number];

// Monorepo root path (two levels up from apps/web/scripts)
const MONOREPO_ROOT = path.resolve(__dirname, "../../..");

// Document sources mapped to categories
const DOCUMENT_SOURCES: Record<
  Category,
  Array<{ id: string; title: string; path: string }>
> = {
  "zoning-codes": [
    {
      id: "zoning-ch295-sub1",
      title: "Milwaukee Zoning Code - Subchapter 1",
      path: "data/zoning-code-pdfs/CH295-sub1.pdf",
    },
    {
      id: "zoning-ch295-sub2",
      title: "Milwaukee Zoning Code - Subchapter 2: Residential",
      path: "data/zoning-code-pdfs/CH295-sub2.pdf",
    },
    {
      id: "zoning-ch295-sub3",
      title: "Milwaukee Zoning Code - Subchapter 3: Commercial",
      path: "data/zoning-code-pdfs/CH295-sub3.pdf",
    },
    {
      id: "zoning-ch295-sub4",
      title: "Milwaukee Zoning Code - Subchapter 4: Downtown",
      path: "data/zoning-code-pdfs/CH295-sub4.pdf",
    },
    {
      id: "zoning-ch295-sub5",
      title: "Milwaukee Zoning Code - Subchapter 5: Industrial",
      path: "data/zoning-code-pdfs/CH295-sub5.pdf",
    },
    {
      id: "zoning-ch295-sub6",
      title: "Milwaukee Zoning Code - Subchapter 6: Special Purpose",
      path: "data/zoning-code-pdfs/CH295-sub6.pdf",
    },
    {
      id: "zoning-ch295-sub7",
      title: "Milwaukee Zoning Code - Subchapter 7: Overlay Zones",
      path: "data/zoning-code-pdfs/CH295-sub7.pdf",
    },
    {
      id: "zoning-ch295-sub8",
      title: "Milwaukee Zoning Code - Subchapter 8: Site Development",
      path: "data/zoning-code-pdfs/CH295-sub8.pdf",
    },
    {
      id: "zoning-ch295-sub9",
      title: "Milwaukee Zoning Code - Subchapter 9: Parking and Loading",
      path: "data/zoning-code-pdfs/CH295-sub9.pdf",
    },
    {
      id: "zoning-ch295-sub10",
      title: "Milwaukee Zoning Code - Subchapter 10: Signs",
      path: "data/zoning-code-pdfs/CH295-sub10.pdf",
    },
    {
      id: "zoning-ch295-sub11",
      title: "Milwaukee Zoning Code - Subchapter 11: Administration",
      path: "data/zoning-code-pdfs/CH295-SUB11.pdf",
    },
    {
      id: "zoning-ch295-table",
      title: "Milwaukee Zoning Code - Use Tables",
      path: "data/zoning-code-pdfs/CH295table.pdf",
    },
  ],
  "area-plans": [
    {
      id: "downtown-plan",
      title: "Milwaukee Downtown Plan",
      path: "data/plans/MilwaukeeDowntownPlan-FINAL-web.pdf",
    },
    {
      id: "fondy-north-plan",
      title: "Fondy and North Area Plan",
      path: "data/plans/Fondy-and-North1222021REDUCED.pdf",
    },
    {
      id: "harbor-district-plan",
      title: "Harbor District Water and Land Use Plan",
      path: "data/plans/HarborDistrictWaterandLandUsePlanREDUCEDDecember2017.pdf",
    },
    {
      id: "menomonee-valley-plan",
      title: "Menomonee Valley Plan 2.0",
      path: "data/plans/MenomoneeValleyPlan2.0_Final---Amendment-Notes.pdf",
    },
    {
      id: "near-north-plan",
      title: "Near North Side Comprehensive Plan",
      path: "data/plans/NearNorthPlan-w-CTC.pdf",
    },
    {
      id: "near-west-plan",
      title: "Near West Side Area Plan",
      path: "data/plans/NearWestPlan.pdf",
    },
    {
      id: "northeast-side-plan",
      title: "Northeast Side Comprehensive Plan",
      path: "data/plans/NESplan.pdf",
    },
    {
      id: "north-side-plan",
      title: "North Side Area Plan",
      path: "data/plans/NSPlan.pdf",
    },
    {
      id: "northwest-side-plan",
      title: "Northwest Side Area Plan",
      path: "data/plans/NWSPlan.pdf",
    },
    {
      id: "southeast-side-plan",
      title: "Southeast Side Area Plan",
      path: "data/plans/SEPlan.pdf",
    },
    {
      id: "southwest-side-plan",
      title: "Southwest Side Area Plan",
      path: "data/plans/SWPlan.pdf",
    },
    {
      id: "third-ward-plan",
      title: "Third Ward/Walker's Point Area Plan",
      path: "data/plans/TWPlan.pdf",
    },
    {
      id: "washington-park-plan",
      title: "Washington Park Area Plan",
      path: "data/plans/WPPlan.pdf",
    },
  ],
  policies: [
    {
      id: "housing-element",
      title: "Milwaukee Housing Element Plan",
      path: "data/plans/Housing-Element---FINAL-PLAN---web (1).pdf",
    },
    {
      id: "citywide-plan",
      title: "Milwaukee Citywide Policy Plan",
      path: "data/plans/Citywide.pdf",
    },
  ],
  ordinances: [],
  guides: [],
  incentives: [
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
  ],
};

// =============================================================================
// Helpers
// =============================================================================

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

// =============================================================================
// File Search Store API Functions
// =============================================================================

interface FileSearchStore {
  name: string;
  displayName: string;
  createTime: string;
}

interface StoreDocument {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  state: string;
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

async function listStores(apiKey: string): Promise<FileSearchStore[]> {
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
      logError(`Failed to list stores: ${response.status} - ${errorText}`);
      return [];
    }

    const result = await response.json();
    return result.fileSearchStores ?? [];
  } catch (error) {
    logError(`Error listing stores: ${error}`);
    return [];
  }
}

/**
 * Get MIME type from file extension.
 */
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
    case ".md":
      return "text/markdown";
    default:
      return "application/octet-stream";
  }
}

/**
 * Upload a file directly to a File Search Store using the uploadToFileSearchStore endpoint.
 */
async function uploadDocumentToStore(
  apiKey: string,
  storeName: string,
  filePath: string,
  displayName: string,
  metadata: Record<string, string>
): Promise<StoreDocument | null> {
  log(`Uploading: ${displayName} to ${storeName}`);

  // Check if file exists - use monorepo root for paths
  const fullPath = path.join(MONOREPO_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    logError(`File not found: ${fullPath}`);
    return null;
  }

  try {
    // Read file content
    const content = fs.readFileSync(fullPath);
    const stats = fs.statSync(fullPath);
    const mimeType = getMimeType(fullPath);

    log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    log(`  MIME type: ${mimeType}`);

    // Build custom metadata array
    const customMetadata = Object.entries(metadata).map(([key, value]) => ({
      key,
      stringValue: value,
    }));

    // Use the uploadToFileSearchStore endpoint with resumable upload
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
      return null;
    }

    const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      logError("No upload URL returned");
      return null;
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
      logError(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
      return null;
    }

    const uploadResult = await uploadResponse.json();
    log(`  Upload initiated: ${uploadResult.name ?? "operation started"}`);

    // The response is a long-running operation - poll for completion
    if (uploadResult.name && !uploadResult.done) {
      log(`  Waiting for processing...`);
      let operation = uploadResult;
      let attempts = 0;

      while (!operation.done && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 3000));
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
        logError(`Operation timed out after ${attempts * 3}s`);
        return null;
      }

      if (operation.error) {
        logError(`Operation failed: ${JSON.stringify(operation.error)}`);
        return null;
      }

      log(`  Completed successfully`);
    }

    return {
      name: uploadResult.response?.name ?? displayName,
      displayName: displayName,
      mimeType: mimeType,
      sizeBytes: stats.size.toString(),
      state: "ACTIVE",
    };
  } catch (error) {
    logError(`Error uploading document: ${error}`);
    return null;
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  log("=== File Search Stores Setup ===");

  const apiKey = getApiKey();

  // Check existing stores
  log("Checking existing stores...");
  const existingStores = await listStores(apiKey);
  log(`Found ${existingStores.length} existing stores`);

  // Create store name map
  const storeMap: Record<string, string> = {};
  for (const store of existingStores) {
    storeMap[store.displayName] = store.name;
  }

  // Process each category
  const results: Record<string, { store: string; documents: number; errors: number }> =
    {};

  for (const category of CATEGORIES) {
    const documents = DOCUMENT_SOURCES[category];
    if (documents.length === 0) {
      log(`Skipping ${category} (no documents)`);
      continue;
    }

    log(`\nProcessing category: ${category}`);
    log(`  Documents to upload: ${documents.length}`);

    // Create or get store for this category
    const storeDisplayName = `mkedev-${category}`;
    let storeName = storeMap[storeDisplayName];

    if (!storeName) {
      const newStore = await createStore(apiKey, storeDisplayName);
      if (!newStore) {
        results[category] = { store: "FAILED", documents: 0, errors: documents.length };
        continue;
      }
      storeName = newStore.name;
      storeMap[storeDisplayName] = storeName;
    } else {
      log(`Using existing store: ${storeName}`);
    }

    // Upload documents
    let uploaded = 0;
    let errors = 0;

    for (const doc of documents) {
      const result = await uploadDocumentToStore(
        apiKey,
        storeName,
        doc.path,
        doc.title,
        {
          category,
          sourceId: doc.id,
        }
      );

      if (result) {
        uploaded++;
      } else {
        errors++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    results[category] = { store: storeName, documents: uploaded, errors };
    log(`  Completed: ${uploaded} uploaded, ${errors} errors`);
  }

  // Summary
  log("\n=== Summary ===");
  for (const [category, result] of Object.entries(results)) {
    log(`${category}:`);
    log(`  Store: ${result.store}`);
    log(`  Documents: ${result.documents}`);
    log(`  Errors: ${result.errors}`);
  }

  // Print store names for Convex configuration
  log("\n=== Store Names for Convex ===");
  for (const [displayName, name] of Object.entries(storeMap)) {
    log(`${displayName}: ${name}`);
  }

  log("\nSetup complete!");
}

main().catch((error) => {
  logError(`Fatal error: ${error}`);
  process.exit(1);
});
