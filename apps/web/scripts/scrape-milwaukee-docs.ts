/**
 * Milwaukee Document Scraper
 *
 * Scrapes DNS permits, urban design guidelines, and design resources
 * from city.milwaukee.gov using Firecrawl.
 *
 * Usage:
 *   pnpm scrape-docs           # Scrape all sources
 *   pnpm scrape-docs --download # Also download PDFs
 *   pnpm scrape-docs --status   # Check scraping status
 */

import Firecrawl from "@mendable/firecrawl-js";
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

interface ScrapeTarget {
  name: string;
  urls: string[];
  category: string;
}

// Configuration
const DATA_DIR = path.join(process.cwd(), "data/scraped-docs");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");

// Scraping targets
const SCRAPE_TARGETS: ScrapeTarget[] = [
  // DNS Permits & Forms
  {
    name: "DNS Permits & Forms",
    urls: [
      "https://city.milwaukee.gov/DNS/permits/info",
      "https://city.milwaukee.gov/DNS/permits",
      "https://city.milwaukee.gov/BOZA/VarianceAppeals",
    ],
    category: "dns_permits",
  },

  // Urban Design Components
  {
    name: "Urban Design Components",
    urls: [
      "https://city.milwaukee.gov/Designguidelines/UrbanDesignComponents.htm",
      "https://city.milwaukee.gov/Designguidelines/UrbanDesignComponents/Signage-Regulations",
      "https://city.milwaukee.gov/Designguidelines/UrbanDesignComponents/Vehicle-and-Pedestrian-Access.htm",
      "https://city.milwaukee.gov/Designguidelines/Citywide.htm",
      "https://city.milwaukee.gov/Designguidelines/Streetscape-Guidelines.htm",
    ],
    category: "urban_design",
  },

  // DCD Design Guidelines
  {
    name: "Design Guidelines PDFs",
    urls: [
      "https://city.milwaukee.gov/DCD/Planning/UrbanDesign/DesignGuidelines",
      "https://city.milwaukee.gov/DCD/Planning/UrbanDesign/UrbanDesignResources",
      "https://city.milwaukee.gov/DCD/Planning/UrbanDesign",
    ],
    category: "design_guidelines",
  },

  // Zoning Resources
  {
    name: "Zoning Resources",
    urls: [
      "https://city.milwaukee.gov/DCD/Planning/PlanningAdministration/Zoning",
    ],
    category: "zoning",
  },
];

// Known PDF URLs to ensure we capture (from web search results)
const KNOWN_PDFS = [
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/planning/plans/Streetscape/pdf/FunctionalRequirements.pdf",
    title: "Milwaukee Streetscape Guidelines - Functional Requirements",
    category: "design_guidelines",
    subcategory: "streetscape",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/planning/plans/Streetscape/pdf/StreetscapeElements.pdf",
    title: "Milwaukee Streetscape Guidelines - Streetscape Elements",
    category: "design_guidelines",
    subcategory: "streetscape",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/planning/plans/Urban-Design-Resouces/StructuredParkingDesignGuidelines.pdf",
    title: "Structured Parking Design Guidelines",
    category: "design_guidelines",
    subcategory: "structured_parking",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/realestate/pdfs/TraditionalHouseDesignStandard.pdf",
    title: "Traditional House Design Standards",
    category: "design_guidelines",
    subcategory: "residential_design",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/Milwaukee-Housing-TIF-Guidelines-04222025.pdf",
    title: "Milwaukee Housing TIF Guidelines",
    category: "design_guidelines",
    subcategory: "incentives",
  },
  {
    url: "https://city.milwaukee.gov/DNS/planning/bozainfo.pdf",
    title: "Board of Zoning Appeals General Information",
    category: "dns_permits",
    subcategory: "variance",
  },
  {
    url: "https://city.milwaukee.gov/DNS/planning/footing.pdf",
    title: "Footing and Foundation Permits",
    category: "dns_permits",
    subcategory: "construction",
  },
  {
    url: "https://city.milwaukee.gov/DNS/planning/signs.pdf",
    title: "Sign Permits",
    category: "dns_permits",
    subcategory: "signage",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/Commercial-Enforcement/forms/DNS-164HomeOccupationApp.pdf",
    title: "Home Occupation Statement Application",
    category: "dns_permits",
    subcategory: "residential",
  },
  {
    url: "https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/Commercial-to-Residential-Conversion-2025-07-031.pdf",
    title: "Commercial to Residential Conversion Application",
    category: "dns_permits",
    subcategory: "conversion",
  },
];

// Utility functions
function extractFilename(url: string): string {
  const filename = url.split("/").pop()?.split("?")[0] || "unknown";
  return decodeURIComponent(filename);
}

function detectSubcategory(url: string, context: string): string {
  const lower = (url + " " + context).toLowerCase();

  if (lower.includes("streetscape")) return "streetscape";
  if (lower.includes("facade") || lower.includes("building design"))
    return "facade_design";
  if (lower.includes("parking") && lower.includes("structure"))
    return "structured_parking";
  if (lower.includes("parking") && lower.includes("landscape"))
    return "parking_landscaping";
  if (lower.includes("sign")) return "signage";
  if (lower.includes("traditional") && lower.includes("house"))
    return "residential_design";
  if (lower.includes("landscape")) return "landscaping";
  if (lower.includes("tif") || lower.includes("housing")) return "incentives";
  if (lower.includes("variance") || lower.includes("boza")) return "variance";
  if (lower.includes("conditional")) return "conditional_use";
  if (lower.includes("occupancy")) return "occupancy";
  if (lower.includes("residential") || lower.includes("home"))
    return "residential";
  if (lower.includes("commercial")) return "commercial";
  if (lower.includes("conversion")) return "conversion";

  return "general";
}

function extractPDFLinksFromMarkdown(
  markdown: string,
  sourceUrl: string
): Array<{ url: string; title: string; context: string }> {
  const links: Array<{ url: string; title: string; context: string }> = [];

  // Match markdown links to PDFs
  const linkRegex = /\[([^\]]*)\]\(([^)]+\.pdf[^)]*)\)/gi;
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const [fullMatch, title, url] = match;
    const start = Math.max(0, match.index - 150);
    const end = Math.min(markdown.length, match.index + fullMatch.length + 150);
    const context = markdown.slice(start, end).replace(/\n+/g, " ").trim();

    // Make absolute URL
    let absoluteUrl = url;
    if (url.startsWith("/")) {
      absoluteUrl = `https://city.milwaukee.gov${url}`;
    } else if (!url.startsWith("http")) {
      const base = new URL(sourceUrl);
      absoluteUrl = `${base.origin}/${url}`;
    }

    links.push({
      url: absoluteUrl,
      title: title.trim() || extractFilename(absoluteUrl),
      context,
    });
  }

  // Also match raw PDF URLs in text
  const rawPdfRegex = /(https?:\/\/[^\s<>"]+\.pdf)/gi;
  while ((match = rawPdfRegex.exec(markdown)) !== null) {
    const url = match[1];
    if (!links.some((l) => l.url === url)) {
      links.push({
        url,
        title: extractFilename(url),
        context: "",
      });
    }
  }

  return links;
}

async function loadExistingManifest(): Promise<ScrapedDocument[]> {
  try {
    const content = await fs.readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveManifest(documents: ScrapedDocument[]): Promise<void> {
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(documents, null, 2));
}

async function downloadPDF(
  url: string,
  category: string,
  filename: string
): Promise<string | null> {
  const categoryDir = path.join(DATA_DIR, category);
  await fs.mkdir(categoryDir, { recursive: true });

  const localPath = path.join(categoryDir, filename);

  try {
    console.log(`    📥 Downloading: ${filename}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.log(`    ❌ Failed (${response.status}): ${filename}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(buffer));
    console.log(
      `    ✅ Downloaded: ${filename} (${(buffer.byteLength / 1024).toFixed(1)}KB)`
    );

    return localPath;
  } catch (error) {
    console.log(`    ❌ Error downloading ${filename}:`, error);
    return null;
  }
}

async function scrapeWithFirecrawl(
  firecrawl: Firecrawl,
  target: ScrapeTarget
): Promise<ScrapedDocument[]> {
  const documents: ScrapedDocument[] = [];

  for (const url of target.urls) {
    console.log(`  🔗 Scraping: ${url}`);

    try {
      // Use scrape for individual pages with better content extraction
      const result = await firecrawl.scrape(url, {
        formats: ["markdown", "links"],
      });

      const markdown = result.markdown || "";
      const links = result.links || [];

      // Extract PDF links from markdown content
      const pdfLinks = extractPDFLinksFromMarkdown(markdown, url);

      console.log(`    📄 Found ${pdfLinks.length} PDF links`);

      for (const pdf of pdfLinks) {
        const filename = extractFilename(pdf.url);
        const subcategory = detectSubcategory(pdf.url, pdf.context);

        documents.push({
          url: pdf.url,
          title: pdf.title,
          filename,
          category: target.category,
          subcategory,
          description: pdf.context.slice(0, 500),
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          fileType: "pdf",
          downloadStatus: "pending",
        });
      }

      // Also check the links array for PDFs
      for (const link of links) {
        if (link.endsWith(".pdf") && !documents.some((d) => d.url === link)) {
          const filename = extractFilename(link);
          documents.push({
            url: link,
            title: filename.replace(".pdf", "").replace(/-/g, " "),
            filename,
            category: target.category,
            subcategory: detectSubcategory(link, ""),
            description: "",
            sourceUrl: url,
            scrapedAt: new Date().toISOString(),
            fileType: "pdf",
            downloadStatus: "pending",
          });
        }
      }

      // Save webpage content if substantial (for design guidelines)
      if (
        markdown.length > 2000 &&
        (url.includes("Designguidelines") || url.includes("UrbanDesign"))
      ) {
        const webpageDir = path.join(DATA_DIR, target.category, "webpages");
        await fs.mkdir(webpageDir, { recursive: true });

        const slug = url
          .split("/")
          .pop()
          ?.replace(/\.htm[l]?$/, "") || "page";
        const mdPath = path.join(webpageDir, `${slug}.md`);
        await fs.writeFile(mdPath, markdown);

        documents.push({
          url,
          title: slug.replace(/-/g, " "),
          filename: `${slug}.md`,
          category: target.category,
          subcategory: "web_content",
          description: markdown.slice(0, 300),
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          fileType: "webpage",
          localPath: mdPath,
          downloadStatus: "downloaded",
        });

        console.log(`    📝 Saved webpage content: ${slug}.md`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.log(`    ❌ Error scraping ${url}:`, error);
    }
  }

  return documents;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDownload = args.includes("--download");
  const showStatus = args.includes("--status");

  // Ensure data directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  if (showStatus) {
    const manifest = await loadExistingManifest();
    console.log("\n📊 Scraping Status\n");
    console.log(`Total documents: ${manifest.length}`);

    const byCategory = manifest.reduce(
      (acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\nBy category:");
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${count}`);
    }

    const downloaded = manifest.filter(
      (d) => d.downloadStatus === "downloaded"
    ).length;
    const pending = manifest.filter(
      (d) => d.downloadStatus === "pending"
    ).length;
    console.log(`\nDownload status: ${downloaded} downloaded, ${pending} pending`);

    return;
  }

  // Check for API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("❌ FIRECRAWL_API_KEY not found in environment variables");
    console.error("   Add it to apps/web/.env.local");
    process.exit(1);
  }

  console.log("🔥 Milwaukee Document Scraper\n");
  console.log("Initializing Firecrawl...");

  const firecrawl = new Firecrawl({ apiKey });

  // Load existing manifest to avoid duplicates
  const existingDocs = await loadExistingManifest();
  const existingUrls = new Set(existingDocs.map((d) => d.url));

  console.log(`Found ${existingDocs.length} existing documents\n`);

  const allDocuments: ScrapedDocument[] = [...existingDocs];

  // Add known PDFs first
  console.log("📋 Adding known PDF documents...");
  for (const pdf of KNOWN_PDFS) {
    if (!existingUrls.has(pdf.url)) {
      allDocuments.push({
        url: pdf.url,
        title: pdf.title,
        filename: extractFilename(pdf.url),
        category: pdf.category,
        subcategory: pdf.subcategory,
        description: "",
        sourceUrl: "known",
        scrapedAt: new Date().toISOString(),
        fileType: "pdf",
        downloadStatus: "pending",
      });
      existingUrls.add(pdf.url);
    }
  }
  console.log(`  Added ${KNOWN_PDFS.length} known PDFs\n`);

  // Scrape each target
  for (const target of SCRAPE_TARGETS) {
    console.log(`\n📂 ${target.name}`);

    const newDocs = await scrapeWithFirecrawl(firecrawl, target);

    // Add only new documents
    let addedCount = 0;
    for (const doc of newDocs) {
      if (!existingUrls.has(doc.url)) {
        allDocuments.push(doc);
        existingUrls.add(doc.url);
        addedCount++;
      }
    }

    console.log(`  ✅ Added ${addedCount} new documents`);
  }

  // Deduplicate by URL
  const uniqueDocs = Array.from(
    new Map(allDocuments.map((d) => [d.url, d])).values()
  );

  // Save manifest
  await saveManifest(uniqueDocs);
  console.log(`\n💾 Saved manifest with ${uniqueDocs.length} documents`);

  // Download PDFs if requested
  if (shouldDownload) {
    console.log("\n📥 Downloading PDFs...\n");

    const pendingDocs = uniqueDocs.filter(
      (d) => d.fileType === "pdf" && d.downloadStatus === "pending"
    );

    console.log(`Found ${pendingDocs.length} PDFs to download\n`);

    for (const doc of pendingDocs) {
      const localPath = await downloadPDF(doc.url, doc.category, doc.filename);

      if (localPath) {
        doc.localPath = localPath;
        doc.downloadStatus = "downloaded";
      } else {
        doc.downloadStatus = "failed";
      }

      // Save progress incrementally
      await saveManifest(uniqueDocs);

      // Rate limit downloads
      await new Promise((r) => setTimeout(r, 500));
    }

    const successCount = pendingDocs.filter(
      (d) => d.downloadStatus === "downloaded"
    ).length;
    console.log(`\n✅ Downloaded ${successCount}/${pendingDocs.length} PDFs`);
  }

  // Summary
  console.log("\n📊 Summary\n");

  const byCategory = uniqueDocs.reduce(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count} documents`);
  }

  console.log(`\nTotal: ${uniqueDocs.length} documents`);

  if (!shouldDownload) {
    console.log("\n💡 Run with --download to download all PDFs:");
    console.log("   pnpm scrape-docs --download");
  }
}

main().catch(console.error);
