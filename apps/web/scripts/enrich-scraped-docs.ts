/**
 * Gemini Document Enrichment
 *
 * Uses Gemini to analyze scraped PDFs and extract structured metadata
 * for permit forms and design guidelines.
 *
 * Usage:
 *   pnpm enrich-docs          # Enrich all pending documents
 *   pnpm enrich-docs --status # Check enrichment status
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs/promises";
import * as path from "path";
import dotenv from "dotenv";

// Load .env.local from the web app directory
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Types
interface ScrapedDocument {
  url: string;
  title: string;
  filename: string;
  category: string;
  subcategory: string;
  description: string;
  sourceUrl: string;
  scrapedAt: string;
  fileType: "pdf" | "webpage";
  localPath?: string;
  downloadStatus?: "pending" | "downloaded" | "failed";
}

interface FormField {
  name: string;
  type: "text" | "number" | "date" | "checkbox" | "select" | "address" | "signature";
  required: boolean;
  description: string;
  autoFillSource?: string;
}

interface EnrichedPermitForm {
  id: string;
  url: string;
  filename: string;
  category: string;
  subcategory: string;

  // Extracted metadata
  officialName: string;
  purpose: string;
  whenRequired: string[];
  prerequisites: string[];
  relatedForms: string[];
  estimatedCompletionTime: string;
  submissionMethod: string[];
  fees: string | null;
  fields: FormField[];
  applicableProjectTypes: string[];
  zoningDistricts: string[];
  triggers: string[];

  enrichedAt: string;
}

interface DesignRequirement {
  rule: string;
  isRequired: boolean;
  codeReference?: string;
}

interface EnrichedDesignGuideline {
  id: string;
  url: string;
  filename: string;
  category: string;
  subcategory: string;

  // Extracted metadata
  title: string;
  topic: string;
  summary: string;
  applicableZoningDistricts: string[];
  requirements: DesignRequirement[];
  bestPractices: string[];
  illustrations: string[];
  relatedTopics: string[];
  triggers: string[];

  enrichedAt: string;
}

// Configuration
const DATA_DIR = path.join(process.cwd(), "data/scraped-docs");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const ENRICHED_FORMS_PATH = path.join(DATA_DIR, "enriched/permit-forms.json");
const ENRICHED_GUIDELINES_PATH = path.join(DATA_DIR, "enriched/design-guidelines.json");

// Prompts
const PERMIT_FORM_PROMPT = `Analyze this Milwaukee city permit/application form and extract structured metadata.

Return a JSON object with these exact fields:

{
  "officialName": "The official form name/number (e.g., 'DNS-164 Home Occupation Statement')",
  "purpose": "Clear 1-2 sentence description of what this form is for",
  "whenRequired": [
    "Specific situations when this form is required (2-5 items)",
    "E.g., 'When converting commercial building to residential use'"
  ],
  "prerequisites": [
    "Other forms or approvals needed before this one (0-3 items)",
    "E.g., 'Zoning letter from DNS'"
  ],
  "relatedForms": [
    "Names of other forms often submitted together (0-3 items)"
  ],
  "estimatedCompletionTime": "How long to fill out (e.g., '15-30 minutes')",
  "submissionMethod": ["In-person", "Mail", "Online LMS"],
  "fees": "Fee amount if mentioned, or null",
  "fields": [
    {
      "name": "Field name as shown on form",
      "type": "text|number|date|checkbox|select|address|signature",
      "required": true,
      "description": "What should be entered here",
      "autoFillSource": "project.address|parcel.taxKey|applicant.name|null"
    }
  ],
  "applicableProjectTypes": [
    "Types: new_construction, renovation, addition, change_of_use, conversion, adu, deck, fence, garage, sign, home_occupation, variance, conditional_use, demolition"
  ],
  "zoningDistricts": ["all"] or ["LB1", "LB2", "RM4"],
  "triggers": [
    "Keywords/phrases that suggest this form is needed (3-5 items)",
    "E.g., 'home office', 'work from home', 'business in house'"
  ]
}

For autoFillSource, use these patterns:
- project.address, project.proposedUse, project.buildingHeight, project.unitCount, project.squareFootage
- parcel.taxKey, parcel.lotSize, parcel.zoningCode, parcel.legalDescription
- applicant.name, applicant.phone, applicant.email, applicant.address
- owner.name, owner.phone, owner.email, owner.address
- contractor.name, contractor.license, contractor.phone
- null if cannot be auto-filled

Be thorough - list every fillable field on the form.`;

const DESIGN_GUIDELINE_PROMPT = `Analyze this Milwaukee design guideline document and extract structured metadata.

Return a JSON object with these exact fields:

{
  "title": "Official title of the guideline",
  "topic": "One of: site_layout, parking, vehicle_access, pedestrian_access, bicycle_facilities, transit, landscaping, parking_lot_landscaping, facades, entrances, signage, wall_signs, streetscape, structured_parking, residential_design, materials",
  "summary": "2-3 sentence summary of what this guideline covers",
  "applicableZoningDistricts": ["all"] or specific districts like ["LB1", "LB2", "IO"],
  "requirements": [
    {
      "rule": "Specific requirement (e.g., '60% glazing on ground floor street-facing facades')",
      "isRequired": true,
      "codeReference": "Section 295-405 or null"
    }
  ],
  "bestPractices": [
    "Recommended but not required practices (3-5 items)"
  ],
  "illustrations": [
    "Descriptions of key diagrams/images in the document (if any)"
  ],
  "relatedTopics": [
    "Other design topics this relates to (e.g., 'landscaping', 'facades')"
  ],
  "triggers": [
    "Keywords/project features that should surface this guideline (5-8 items)",
    "E.g., 'parking lot', 'surface parking', 'landscape buffer'"
  ]
}

Focus on extracting specific, actionable requirements with code references when available.`;

// Utility functions
async function loadManifest(): Promise<ScrapedDocument[]> {
  try {
    const content = await fs.readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function loadEnrichedForms(): Promise<EnrichedPermitForm[]> {
  try {
    const content = await fs.readFile(ENRICHED_FORMS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function loadEnrichedGuidelines(): Promise<EnrichedDesignGuideline[]> {
  try {
    const content = await fs.readFile(ENRICHED_GUIDELINES_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveEnrichedForms(forms: EnrichedPermitForm[]): Promise<void> {
  await fs.mkdir(path.dirname(ENRICHED_FORMS_PATH), { recursive: true });
  await fs.writeFile(ENRICHED_FORMS_PATH, JSON.stringify(forms, null, 2));
}

async function saveEnrichedGuidelines(guidelines: EnrichedDesignGuideline[]): Promise<void> {
  await fs.mkdir(path.dirname(ENRICHED_GUIDELINES_PATH), { recursive: true });
  await fs.writeFile(ENRICHED_GUIDELINES_PATH, JSON.stringify(guidelines, null, 2));
}

function generateId(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function enrichPermitForm(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  doc: ScrapedDocument
): Promise<EnrichedPermitForm | null> {
  if (!doc.localPath) {
    console.log(`    ⚠️ No local file for ${doc.filename}`);
    return null;
  }

  try {
    // Read the PDF file
    const fileBuffer = await fs.readFile(doc.localPath);
    const base64Data = fileBuffer.toString("base64");

    // Use Gemini to analyze
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      { text: PERMIT_FORM_PROMPT },
    ]);

    const response = result.response;
    const text = response.text();

    // Extract JSON from response (might have markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const extracted = JSON.parse(jsonText.trim());

    return {
      id: generateId(doc.filename),
      url: doc.url,
      filename: doc.filename,
      category: doc.category,
      subcategory: doc.subcategory,
      ...extracted,
      enrichedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.log(`    ❌ Error enriching ${doc.filename}:`, error);
    return null;
  }
}

async function enrichDesignGuideline(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  doc: ScrapedDocument
): Promise<EnrichedDesignGuideline | null> {
  if (!doc.localPath) {
    console.log(`    ⚠️ No local file for ${doc.filename}`);
    return null;
  }

  try {
    // Build parts for Gemini
    const parts: Array<
      | { inlineData: { mimeType: string; data: string } }
      | { text: string }
    > = [];

    if (doc.fileType === "pdf") {
      const fileBuffer = await fs.readFile(doc.localPath);
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: fileBuffer.toString("base64"),
        },
      });
    } else {
      // Markdown/webpage content
      const content = await fs.readFile(doc.localPath, "utf-8");
      parts.push({ text: `Document content:\n\n${content}` });
    }

    parts.push({ text: DESIGN_GUIDELINE_PROMPT });

    const result = await model.generateContent(parts as Parameters<typeof model.generateContent>[0]);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (might have markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const extracted = JSON.parse(jsonText.trim());

    return {
      id: generateId(doc.filename),
      url: doc.url,
      filename: doc.filename,
      category: doc.category,
      subcategory: doc.subcategory,
      ...extracted,
      enrichedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.log(`    ❌ Error enriching ${doc.filename}:`, error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const showStatus = args.includes("--status");

  if (showStatus) {
    const forms = await loadEnrichedForms();
    const guidelines = await loadEnrichedGuidelines();

    console.log("\n📊 Enrichment Status\n");
    console.log(`Enriched permit forms: ${forms.length}`);
    console.log(`Enriched design guidelines: ${guidelines.length}`);

    if (forms.length > 0) {
      console.log("\nPermit Forms:");
      for (const form of forms.slice(0, 5)) {
        console.log(`  - ${form.officialName || form.filename}`);
      }
      if (forms.length > 5) console.log(`  ... and ${forms.length - 5} more`);
    }

    if (guidelines.length > 0) {
      console.log("\nDesign Guidelines:");
      for (const guide of guidelines.slice(0, 5)) {
        console.log(`  - ${guide.title || guide.filename}`);
      }
      if (guidelines.length > 5) console.log(`  ... and ${guidelines.length - 5} more`);
    }

    return;
  }

  // Check for API key (try GOOGLE_GEMINI_API_KEY first, then GEMINI_API_KEY)
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No Gemini API key found. Set GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY");
    process.exit(1);
  }
  console.log(`Using API key: ${apiKey.substring(0, 10)}...`);

  console.log("🧠 Gemini Document Enrichment\n");

  // Initialize Gemini
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Load manifest and existing enriched docs
  const manifest = await loadManifest();
  const existingForms = await loadEnrichedForms();
  const existingGuidelines = await loadEnrichedGuidelines();

  const enrichedFormIds = new Set(existingForms.map((f) => f.id));
  const enrichedGuidelineIds = new Set(existingGuidelines.map((g) => g.id));

  // Filter documents to enrich
  const downloadedDocs = manifest.filter((d) => d.downloadStatus === "downloaded");

  const permitDocs = downloadedDocs.filter(
    (d) =>
      d.category === "dns_permits" &&
      d.fileType === "pdf" &&
      !enrichedFormIds.has(generateId(d.filename))
  );

  const guidelineDocs = downloadedDocs.filter(
    (d) =>
      (d.category === "design_guidelines" || d.category === "urban_design") &&
      !enrichedGuidelineIds.has(generateId(d.filename))
  );

  console.log(`Found ${permitDocs.length} permit forms to enrich`);
  console.log(`Found ${guidelineDocs.length} design guidelines to enrich\n`);

  // Enrich permit forms
  if (permitDocs.length > 0) {
    console.log("📋 Enriching Permit Forms...\n");

    for (const doc of permitDocs) {
      console.log(`  📄 ${doc.filename}`);

      const enriched = await enrichPermitForm(model, doc);

      if (enriched) {
        existingForms.push(enriched);
        await saveEnrichedForms(existingForms);
        console.log(`    ✅ Enriched: ${enriched.officialName || doc.filename}`);
        console.log(`       Fields: ${enriched.fields?.length || 0}, Triggers: ${enriched.triggers?.length || 0}`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Enrich design guidelines
  if (guidelineDocs.length > 0) {
    console.log("\n🎨 Enriching Design Guidelines...\n");

    for (const doc of guidelineDocs) {
      console.log(`  📄 ${doc.filename}`);

      const enriched = await enrichDesignGuideline(model, doc);

      if (enriched) {
        existingGuidelines.push(enriched);
        await saveEnrichedGuidelines(existingGuidelines);
        console.log(`    ✅ Enriched: ${enriched.title || doc.filename}`);
        console.log(`       Requirements: ${enriched.requirements?.length || 0}, Triggers: ${enriched.triggers?.length || 0}`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Summary
  console.log("\n📊 Enrichment Complete\n");
  console.log(`Total enriched permit forms: ${existingForms.length}`);
  console.log(`Total enriched design guidelines: ${existingGuidelines.length}`);
  console.log(`\nFiles saved:`);
  console.log(`  ${ENRICHED_FORMS_PATH}`);
  console.log(`  ${ENRICHED_GUIDELINES_PATH}`);
}

main().catch(console.error);
