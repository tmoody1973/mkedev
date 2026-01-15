/**
 * Corpus Configuration for MKE.dev Document Ingestion
 *
 * This file defines all target sources for the document ingestion pipeline.
 * Sources are categorized by ingestion method:
 * - Gemini File Search: For local PDF documents (zoning codes, housing element)
 * - Firecrawl: For web-based content (neighborhood plans, incentive documentation)
 */

// =============================================================================
// Types
// =============================================================================

export type IngestionMethod = "gemini-file-search" | "firecrawl";

export type DocumentCategory =
  | "zoning-codes"
  | "area-plans"
  | "policies"
  | "ordinances"
  | "guides";

export interface CorpusSource {
  /** Unique identifier for the source */
  id: string;
  /** Human-readable title */
  title: string;
  /** Document category for classification */
  category: DocumentCategory;
  /** Ingestion method to use */
  method: IngestionMethod;
  /** Source URL or file path */
  source: string;
  /** Description of the document contents */
  description: string;
  /** Whether this source should be included in automated refresh */
  autoRefresh: boolean;
  /** Priority for ingestion (1 = highest) */
  priority: number;
}

// =============================================================================
// PDF Sources (Gemini File Search)
// =============================================================================

/**
 * Local PDF documents to be processed via Gemini File Search.
 * These are stored in the data/ directory.
 */
export const PDF_SOURCES: CorpusSource[] = [
  // Milwaukee Zoning Code - Chapter 295
  {
    id: "zoning-ch295-sub1",
    title: "Milwaukee Zoning Code - Subchapter 1: General Provisions",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub1.pdf",
    description:
      "General provisions and definitions for Milwaukee zoning regulations",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub2",
    title: "Milwaukee Zoning Code - Subchapter 2: Residential Districts",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub2.pdf",
    description:
      "Regulations for residential zoning districts (RS, RT, RM, RO)",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub3",
    title: "Milwaukee Zoning Code - Subchapter 3: Commercial Districts",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub3.pdf",
    description:
      "Regulations for commercial zoning districts (LB, NS, CS, RB, etc.)",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub4",
    title: "Milwaukee Zoning Code - Subchapter 4: Downtown Districts",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub4.pdf",
    description: "Regulations for downtown zoning districts",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub5",
    title: "Milwaukee Zoning Code - Subchapter 5: Industrial Districts",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub5.pdf",
    description: "Regulations for industrial zoning districts (IL, IM, IH)",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub6",
    title: "Milwaukee Zoning Code - Subchapter 6: Special Purpose Districts",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub6.pdf",
    description: "Regulations for special purpose zoning districts (PD, IC, PS)",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub7",
    title: "Milwaukee Zoning Code - Subchapter 7: Overlay Zones",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub7.pdf",
    description: "Overlay zone regulations including historic districts",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub8",
    title: "Milwaukee Zoning Code - Subchapter 8: Site Development Standards",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub8.pdf",
    description: "Site development standards for all districts",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub9",
    title: "Milwaukee Zoning Code - Subchapter 9: Parking and Loading",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub9.pdf",
    description: "Off-street parking and loading requirements",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "zoning-ch295-sub10",
    title: "Milwaukee Zoning Code - Subchapter 10: Signs",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-sub10.pdf",
    description: "Sign regulations and standards",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "zoning-ch295-sub11",
    title: "Milwaukee Zoning Code - Subchapter 11: Administration",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295-SUB11.pdf",
    description: "Administration and enforcement procedures",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "zoning-ch295-table",
    title: "Milwaukee Zoning Code - Use Tables",
    category: "zoning-codes",
    method: "gemini-file-search",
    source: "data/zoning-code-pdfs/CH295table.pdf",
    description: "Comprehensive use tables for all zoning districts",
    autoRefresh: false,
    priority: 1,
  },
  // City Plans
  {
    id: "housing-element",
    title: "Milwaukee Housing Element Plan",
    category: "policies",
    method: "gemini-file-search",
    source: "data/plans/Housing-Element---FINAL-PLAN---web (1).pdf",
    description:
      "City of Milwaukee comprehensive housing element plan addressing housing needs and strategies",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "citywide-plan",
    title: "Milwaukee Citywide Policy Plan",
    category: "policies",
    method: "gemini-file-search",
    source: "data/plans/Citywide.pdf",
    description:
      "Citywide policy plan guiding land use and development decisions",
    autoRefresh: false,
    priority: 1,
  },
  {
    id: "downtown-plan",
    title: "Milwaukee Downtown Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/MilwaukeeDowntownPlan-FINAL-web.pdf",
    description:
      "Comprehensive plan for downtown Milwaukee development and revitalization",
    autoRefresh: false,
    priority: 1,
  },
  // Neighborhood Area Plans
  {
    id: "fondy-north-plan",
    title: "Fondy and North Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/Fondy-and-North1222021REDUCED.pdf",
    description:
      "Area plan for the Fondy and North neighborhoods covering land use, housing, and economic development",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "harbor-district-plan",
    title: "Harbor District Water and Land Use Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/HarborDistrictWaterandLandUsePlanREDUCEDDecember2017.pdf",
    description:
      "Comprehensive plan for Milwaukee's Harbor District including waterfront development and land use",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "menomonee-valley-plan",
    title: "Menomonee Valley Plan 2.0",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/MenomoneeValleyPlan2.0_Final---Amendment-Notes.pdf",
    description:
      "Updated plan for the Menomonee Valley industrial corridor and mixed-use development",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "near-north-plan",
    title: "Near North Side Comprehensive Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/NearNorthPlan-w-CTC.pdf",
    description:
      "Comprehensive neighborhood plan for Milwaukee's Near North Side",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "near-west-plan",
    title: "Near West Side Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/NearWestPlan.pdf",
    description:
      "Area plan for Milwaukee's Near West Side neighborhood",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "northeast-side-plan",
    title: "Northeast Side Comprehensive Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/NESplan.pdf",
    description:
      "Comprehensive plan for Milwaukee's Northeast Side neighborhoods",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "north-side-plan",
    title: "North Side Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/NSPlan.pdf",
    description:
      "Area plan for Milwaukee's North Side neighborhoods",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "northwest-side-plan",
    title: "Northwest Side Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/NWSPlan.pdf",
    description:
      "Area plan for Milwaukee's Northwest Side neighborhoods",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "southeast-side-plan",
    title: "Southeast Side Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/SEPlan.pdf",
    description:
      "Area plan for Milwaukee's Southeast Side neighborhoods including Bay View",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "southwest-side-plan",
    title: "Southwest Side Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/SWPlan.pdf",
    description:
      "Area plan for Milwaukee's Southwest Side neighborhoods",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "third-ward-plan",
    title: "Third Ward/Walker's Point Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/TWPlan.pdf",
    description:
      "Area plan for Milwaukee's Historic Third Ward and Walker's Point neighborhoods",
    autoRefresh: false,
    priority: 2,
  },
  {
    id: "washington-park-plan",
    title: "Washington Park Area Plan",
    category: "area-plans",
    method: "gemini-file-search",
    source: "data/plans/WPPlan.pdf",
    description:
      "Area plan for the Washington Park neighborhood and surrounding areas",
    autoRefresh: false,
    priority: 2,
  },
];

// =============================================================================
// Web Sources (Firecrawl)
// =============================================================================

/**
 * Web-based sources to be crawled via Firecrawl.
 * These are public URLs that contain relevant planning and incentive information.
 */
export const WEB_SOURCES: CorpusSource[] = [
  // Neighborhood Plans
  {
    id: "neighborhood-plans-index",
    title: "Milwaukee Neighborhood Plans Index",
    category: "area-plans",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/DCD/Planning/Plans/Neighborhood-Plans",
    description: "Index page for all Milwaukee neighborhood plans",
    autoRefresh: true,
    priority: 1,
  },
  // TIF and Incentive Programs
  {
    id: "tif-districts",
    title: "Milwaukee TIF Districts",
    category: "policies",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/DCD/BID/TIF",
    description:
      "Tax Incremental Financing district information and available incentives",
    autoRefresh: true,
    priority: 1,
  },
  {
    id: "opportunity-zones",
    title: "Milwaukee Opportunity Zones",
    category: "policies",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/DCD/BID/Opportunity-Zones",
    description: "Federal Opportunity Zone program information for Milwaukee",
    autoRefresh: true,
    priority: 1,
  },
  {
    id: "business-improvement-districts",
    title: "Milwaukee Business Improvement Districts",
    category: "policies",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/DCD/BID",
    description:
      "Business Improvement District (BID) information and boundaries",
    autoRefresh: true,
    priority: 2,
  },
  // Development Guides
  {
    id: "development-guide",
    title: "Milwaukee Development Guide",
    category: "guides",
    method: "firecrawl",
    source:
      "https://city.milwaukee.gov/DCD/Planning/PlanningResources/MilwaukeeDevelopmentGuide",
    description:
      "Guide for navigating the development process in Milwaukee",
    autoRefresh: true,
    priority: 1,
  },
  {
    id: "historic-preservation",
    title: "Milwaukee Historic Preservation",
    category: "ordinances",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/hpc",
    description:
      "Historic Preservation Commission guidelines and local historic districts",
    autoRefresh: true,
    priority: 2,
  },
  // Housing Programs
  {
    id: "housing-programs",
    title: "Milwaukee Housing Authority Programs",
    category: "policies",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/housing",
    description:
      "Housing assistance programs and resources for Milwaukee residents",
    autoRefresh: true,
    priority: 2,
  },
  // Zoning Information Online
  {
    id: "zoning-info-online",
    title: "Milwaukee Zoning Information",
    category: "guides",
    method: "firecrawl",
    source: "https://city.milwaukee.gov/DCD/Planning/Zoning",
    description:
      "Online zoning resources and permit application information",
    autoRefresh: true,
    priority: 1,
  },
];

// =============================================================================
// Combined Corpus
// =============================================================================

/**
 * All corpus sources combined, sorted by priority.
 */
export const ALL_SOURCES: CorpusSource[] = [...PDF_SOURCES, ...WEB_SOURCES].sort(
  (a, b) => a.priority - b.priority
);

/**
 * Sources that should be included in automated daily refresh.
 */
export const AUTO_REFRESH_SOURCES: CorpusSource[] = ALL_SOURCES.filter(
  (source) => source.autoRefresh
);

/**
 * Get sources by ingestion method.
 */
export function getSourcesByMethod(method: IngestionMethod): CorpusSource[] {
  return ALL_SOURCES.filter((source) => source.method === method);
}

/**
 * Get sources by category.
 */
export function getSourcesByCategory(category: DocumentCategory): CorpusSource[] {
  return ALL_SOURCES.filter((source) => source.category === category);
}

/**
 * Get a single source by ID.
 */
export function getSourceById(id: string): CorpusSource | undefined {
  return ALL_SOURCES.find((source) => source.id === id);
}
