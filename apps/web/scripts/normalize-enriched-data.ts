/**
 * Normalize Enriched Data
 *
 * Fixes the data structure where some entries have metadata
 * nested under a "0" key due to Gemini response parsing.
 *
 * Usage:
 *   pnpm normalize-enriched
 */

import * as fs from "fs/promises";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data/scraped-docs/enriched");
const PERMIT_FORMS_PATH = path.join(DATA_DIR, "permit-forms.json");
const DESIGN_GUIDELINES_PATH = path.join(DATA_DIR, "design-guidelines.json");

interface RawEntry {
  id: string;
  url: string;
  filename: string;
  category: string;
  subcategory: string;
  enrichedAt?: string;
  // Nested structure (bug)
  "0"?: Record<string, unknown>;
  // Or flat structure (correct)
  [key: string]: unknown;
}

function normalizeEntry(entry: RawEntry): Record<string, unknown> {
  // Check if metadata is nested under "0"
  if (entry["0"] && typeof entry["0"] === "object") {
    const nested = entry["0"];
    // Remove the "0" key and flatten
    const { "0": _, ...rest } = entry;
    return {
      ...rest,
      ...nested,
    };
  }
  return entry;
}

async function normalizeFile(filePath: string, name: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data: RawEntry[] = JSON.parse(content);

    console.log(`\n📋 Processing ${name}...`);
    console.log(`   Total entries: ${data.length}`);

    let nestedCount = 0;
    const normalized = data.map((entry) => {
      if (entry["0"]) {
        nestedCount++;
      }
      return normalizeEntry(entry);
    });

    console.log(`   Fixed nested entries: ${nestedCount}`);

    // Backup original
    const backupPath = filePath.replace(".json", ".backup.json");
    await fs.copyFile(filePath, backupPath);
    console.log(`   Backup saved to: ${path.basename(backupPath)}`);

    // Write normalized
    await fs.writeFile(filePath, JSON.stringify(normalized, null, 2));
    console.log(`   ✅ Normalized and saved`);
  } catch (error) {
    console.error(`   ❌ Error processing ${name}:`, error);
  }
}

async function main() {
  console.log("🔧 Normalizing Enriched Data\n");

  await normalizeFile(PERMIT_FORMS_PATH, "Permit Forms");
  await normalizeFile(DESIGN_GUIDELINES_PATH, "Design Guidelines");

  console.log("\n✅ Normalization complete");
}

main().catch(console.error);
