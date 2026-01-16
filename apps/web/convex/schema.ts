import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// MKE.dev Convex Schema
// Based on types from product-plan/data-model/types.ts
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // Users - Synced from Clerk authentication
  // ---------------------------------------------------------------------------
  users: defineTable({
    clerkId: v.string(), // Clerk user ID (e.g., "user_xxx")
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // ---------------------------------------------------------------------------
  // Parcels - A specific piece of property
  // ---------------------------------------------------------------------------
  parcels: defineTable({
    taxKey: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    coordinates: v.array(v.number()), // [longitude, latitude]
    lotSize: v.number(), // square feet
    zoningDistrictId: v.id("zoningDistricts"),
    incentiveZoneIds: v.array(v.id("incentiveZones")),
    areaPlanId: v.optional(v.id("areaPlans")),
    owner: v.optional(v.string()),
    assessedValue: v.optional(v.number()),
    landUse: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_taxKey", ["taxKey"])
    .index("by_zoningDistrict", ["zoningDistrictId"])
    .index("by_areaPlan", ["areaPlanId"]),

  // ---------------------------------------------------------------------------
  // Zoning Districts - Classification defining permitted uses
  // ---------------------------------------------------------------------------
  zoningDistricts: defineTable({
    code: v.string(), // e.g., "RS6", "LB2", "RM4"
    name: v.string(),
    category: v.union(
      v.literal("residential"),
      v.literal("commercial"),
      v.literal("industrial"),
      v.literal("mixed-use"),
      v.literal("special")
    ),
    description: v.string(),
    color: v.string(), // for map display
    permittedUses: v.array(v.string()),
    conditionalUses: v.array(v.string()),
    dimensionalStandards: v.object({
      maxHeight: v.number(), // feet
      maxStories: v.optional(v.number()),
      minLotSize: v.number(), // square feet
      minLotWidth: v.number(), // feet
      maxLotCoverage: v.number(), // percentage (0-100)
      setbacks: v.object({
        front: v.number(),
        side: v.number(),
        rear: v.number(),
      }),
      maxFAR: v.optional(v.number()), // Floor Area Ratio
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_category", ["category"]),

  // ---------------------------------------------------------------------------
  // Incentive Zones - Geographic area with financial incentives
  // ---------------------------------------------------------------------------
  incentiveZones: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("tif"),
      v.literal("opportunity-zone"),
      v.literal("bid"),
      v.literal("nid"),
      v.literal("empowerment-zone"),
      v.literal("other")
    ),
    description: v.string(),
    benefits: v.array(v.string()),
    expirationDate: v.optional(v.string()),
    totalInvestment: v.optional(v.number()),
    boundaryGeojson: v.optional(v.string()), // GeoJSON polygon
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_name", ["name"]),

  // ---------------------------------------------------------------------------
  // Area Plans - Neighborhood planning document
  // ---------------------------------------------------------------------------
  areaPlans: defineTable({
    name: v.string(),
    neighborhood: v.string(),
    adoptedDate: v.string(),
    summary: v.string(),
    goals: v.array(v.string()),
    landUseRecommendations: v.array(v.string()),
    documentUrl: v.optional(v.string()),
    boundaryGeojson: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_neighborhood", ["neighborhood"])
    .index("by_name", ["name"]),

  // ---------------------------------------------------------------------------
  // Conversations - Chat sessions with user association
  // ---------------------------------------------------------------------------
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    starred: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_starred", ["userId", "starred"]),

  // ---------------------------------------------------------------------------
  // Messages - Individual messages within conversations
  // ---------------------------------------------------------------------------
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    timestamp: v.number(),
    inputMode: v.optional(v.union(v.literal("text"), v.literal("voice"))),
    parcelId: v.optional(v.id("parcels")),
    cards: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("zone-info"),
            v.literal("parcel-info"),
            v.literal("parcel-analysis"),
            v.literal("incentives-summary"),
            v.literal("area-plan-context"),
            v.literal("permit-process"),
            v.literal("code-citation"),
            v.literal("opportunity-list"),
            v.literal("home-listing"),
            v.literal("homes-list")
          ),
          data: v.any(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_timestamp", ["conversationId", "timestamp"]),

  // ---------------------------------------------------------------------------
  // Documents - Knowledge base documents for RAG (Gemini Files API)
  // ---------------------------------------------------------------------------
  documents: defineTable({
    // Core identification
    sourceId: v.string(), // Unique ID from corpusConfig.ts
    title: v.string(),
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),
    description: v.optional(v.string()),

    // Source location (local file path or URL)
    sourcePath: v.string(), // e.g., "data/zoning-code-pdfs/CH295-sub1.pdf"
    sourceType: v.union(v.literal("pdf"), v.literal("web")),

    // Gemini Files API tracking
    geminiFileUri: v.optional(v.string()), // e.g., "files/abc123"
    geminiFileName: v.optional(v.string()), // Display name in Gemini
    mimeType: v.optional(v.string()), // e.g., "application/pdf"

    // Upload lifecycle
    uploadedAt: v.optional(v.number()), // Timestamp of last upload
    expiresAt: v.optional(v.number()), // 48 hours after upload
    status: v.union(
      v.literal("pending"), // Not yet uploaded
      v.literal("uploading"), // Currently uploading
      v.literal("uploaded"), // Successfully uploaded, file URI valid
      v.literal("expired"), // Past expiration, needs refresh
      v.literal("error") // Upload failed
    ),
    errorMessage: v.optional(v.string()),

    // Metadata
    fileSizeBytes: v.optional(v.number()),
    priority: v.number(), // 1 = highest priority for refresh

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceId", ["sourceId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_category_status", ["category", "status"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_priority", ["priority"]),

  // ---------------------------------------------------------------------------
  // File Search Stores - Gemini persistent document stores
  // ---------------------------------------------------------------------------
  fileSearchStores: defineTable({
    // Store identification
    name: v.string(), // Gemini store name (e.g., "fileSearchStores/abc123")
    displayName: v.string(), // Human-readable name
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides"),
      v.literal("all") // Combined store for cross-category queries
    ),

    // Store metadata
    documentCount: v.number(),
    totalSizeBytes: v.optional(v.number()),

    // Status tracking
    status: v.union(
      v.literal("creating"),
      v.literal("active"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_name", ["name"])
    .index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // Store Documents - Documents in File Search Stores
  // ---------------------------------------------------------------------------
  storeDocuments: defineTable({
    // References
    storeId: v.id("fileSearchStores"),
    sourceId: v.string(), // Maps to corpus config ID

    // Gemini document info
    documentName: v.optional(v.string()), // Gemini doc name
    displayName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.optional(v.number()),

    // Metadata for filtering
    category: v.union(
      v.literal("zoning-codes"),
      v.literal("area-plans"),
      v.literal("policies"),
      v.literal("ordinances"),
      v.literal("guides")
    ),

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("active"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_sourceId", ["sourceId"])
    .index("by_status", ["status"])
    .index("by_storeId_status", ["storeId", "status"]),

  // ---------------------------------------------------------------------------
  // Homes For Sale - Properties from Homes MKE ESRI FeatureServer
  // ---------------------------------------------------------------------------
  homesForSale: defineTable({
    // ESRI identification
    esriObjectId: v.string(), // OBJECTID_1 from ESRI - unique identifier for sync
    taxKey: v.string(), // FK_Tax field - Milwaukee tax key

    // Location
    address: v.string(), // ADDRESSES field
    neighborhood: v.string(), // NEIGHBORHOOD_1 field
    districtName: v.optional(v.string()), // DistrictName - zoning/district
    coordinates: v.array(v.number()), // [longitude, latitude] in WGS84

    // Property details
    bedrooms: v.number(), // NumberOfBedrooms
    fullBaths: v.number(), // NumberOfFullBaths
    halfBaths: v.number(), // NumberOfHalfBaths
    buildingSqFt: v.number(), // Bldg_SF
    lotSizeSqFt: v.optional(v.number()), // Size_SF_ - lot size
    yearBuilt: v.number(), // Built
    numberOfUnits: v.optional(v.number()), // Number_of_Units
    hasOutbuildings: v.optional(v.boolean()), // Outbuildings_Present

    // Listing info
    status: v.union(
      v.literal("for_sale"),
      v.literal("sold"),
      v.literal("unknown")
    ),
    narrative: v.optional(v.string()), // Narrative field - property description
    listingUrl: v.optional(v.string()), // Link field - external listing URL
    developerName: v.optional(v.string()), // Developer_Name field

    // Images from ESRI attachments
    imageUrls: v.optional(v.array(v.string())), // Array of image URLs from ESRI attachments
    primaryImageUrl: v.optional(v.string()), // First/primary image for thumbnails

    // Sync metadata
    lastSyncedAt: v.number(), // Timestamp of last successful sync
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_neighborhood", ["neighborhood"])
    .index("by_taxKey", ["taxKey"])
    .index("by_esriObjectId", ["esriObjectId"]),

  // ---------------------------------------------------------------------------
  // Planning Documents - Crawled Milwaukee planning pages and PDFs
  // ---------------------------------------------------------------------------
  planningDocuments: defineTable({
    // Source identification
    sourceId: v.string(), // Unique ID from config.py (e.g., "home-building-sites")
    sourceUrl: v.string(), // Original URL crawled
    title: v.string(),
    contentType: v.union(v.literal("html"), v.literal("pdf")),
    category: v.union(
      v.literal("home-building"),
      v.literal("vacant-lots"),
      v.literal("commercial"),
      v.literal("overlay-zones"),
      v.literal("design-guidelines")
    ),
    syncFrequency: v.union(v.literal("weekly"), v.literal("monthly")),

    // Content storage
    markdownContent: v.optional(v.string()), // For HTML pages (converted to markdown)
    pdfStorageId: v.optional(v.id("_storage")), // For PDFs stored in Convex storage
    contentHash: v.string(), // MD5 hash for change detection

    // Gemini File Search integration
    geminiFileUri: v.optional(v.string()), // Gemini file URI after upload
    fileSearchStoreId: v.optional(v.id("fileSearchStores")), // Reference to store

    // Status tracking
    status: v.union(
      v.literal("pending"), // Not yet crawled
      v.literal("crawling"), // Currently being crawled
      v.literal("crawled"), // Successfully crawled, not yet uploaded to Gemini
      v.literal("uploading"), // Uploading to Gemini File Search
      v.literal("indexed"), // Successfully indexed in Gemini File Search
      v.literal("error") // Error during crawl or upload
    ),
    errorMessage: v.optional(v.string()),

    // Sync metadata
    lastCrawledAt: v.optional(v.number()),
    lastUploadedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceId", ["sourceId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_contentType", ["contentType"])
    .index("by_syncFrequency", ["syncFrequency"])
    .index("by_contentHash", ["contentHash"]),

  // ---------------------------------------------------------------------------
  // Agent Sessions - Real-time agent activity tracking
  // ---------------------------------------------------------------------------
  agentSessions: defineTable({
    sessionId: v.string(), // Unique session ID for this agent run
    status: v.union(
      v.literal("idle"),
      v.literal("thinking"),
      v.literal("executing_tool"),
      v.literal("generating_response"),
      v.literal("complete"),
      v.literal("error")
    ),
    currentTool: v.optional(v.string()), // Tool currently being executed
    currentToolArgs: v.optional(v.any()), // Args for display (e.g., address being geocoded)
    toolsCompleted: v.array(
      v.object({
        name: v.string(),
        success: v.boolean(),
        timestamp: v.number(),
      })
    ),
    statusMessage: v.optional(v.string()), // Human-readable status message
    error: v.optional(v.string()),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_updatedAt", ["updatedAt"]),
});
