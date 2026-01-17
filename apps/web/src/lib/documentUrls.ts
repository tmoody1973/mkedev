/**
 * Document URL Mapping
 *
 * Maps RAG source IDs/names to downloadable PDF URLs.
 * PDFs are served from /public/docs/ folder.
 */

// Zoning Code documents (Chapter 295)
const ZONING_CODE_DOCS: Record<string, { url: string; title: string }> = {
  'zoning-introduction': {
    url: '/docs/zoning-code/CH295-sub1.pdf',
    title: 'Chapter 295 - Introduction',
  },
  'zoning-definitions': {
    url: '/docs/zoning-code/CH295-sub2.pdf',
    title: 'Chapter 295 - Definitions',
  },
  'zoning-map': {
    url: '/docs/zoning-code/CH295-sub3.pdf',
    title: 'Chapter 295 - Zoning Map',
  },
  'zoning-general': {
    url: '/docs/zoning-code/CH295-sub4.pdf',
    title: 'Chapter 295 - General Provisions',
  },
  'zoning-residential': {
    url: '/docs/zoning-code/CH295-sub5.pdf',
    title: 'Chapter 295 - Residential Districts',
  },
  'zoning-commercial': {
    url: '/docs/zoning-code/CH295-sub6.pdf',
    title: 'Chapter 295 - Commercial Districts',
  },
  'zoning-downtown': {
    url: '/docs/zoning-code/CH295-sub7.pdf',
    title: 'Chapter 295 - Downtown Districts',
  },
  'zoning-industrial': {
    url: '/docs/zoning-code/CH295-sub8.pdf',
    title: 'Chapter 295 - Industrial Districts',
  },
  'zoning-special': {
    url: '/docs/zoning-code/CH295-sub9.pdf',
    title: 'Chapter 295 - Special Districts',
  },
  'zoning-overlay': {
    url: '/docs/zoning-code/CH295-sub10.pdf',
    title: 'Chapter 295 - Overlay Zones',
  },
  'zoning-additional': {
    url: '/docs/zoning-code/CH295-SUB11.pdf',
    title: 'Chapter 295 - Additional Regulations',
  },
  'zoning-tables': {
    url: '/docs/zoning-code/CH295table.pdf',
    title: 'Chapter 295 - Zoning Tables',
  },
};

// Area Plan documents
const AREA_PLAN_DOCS: Record<string, { url: string; title: string }> = {
  'menomonee-valley-plan': {
    url: '/docs/area-plans/MenomoneeValleyPlan2.0_Final---Amendment-Notes.pdf',
    title: 'Menomonee Valley Plan 2.0',
  },
  'downtown-plan': {
    url: '/docs/area-plans/MilwaukeeDowntownPlan-FINAL-web.pdf',
    title: 'Milwaukee Downtown Plan',
  },
  'near-west-plan': {
    url: '/docs/area-plans/NearWestPlan.pdf',
    title: 'Near West Side Plan',
  },
  'southeast-plan': {
    url: '/docs/area-plans/SEPlan.pdf',
    title: 'Southeast Side Plan',
  },
  'southwest-plan': {
    url: '/docs/area-plans/SWPlan.pdf',
    title: 'Southwest Side Plan',
  },
  'northeast-plan': {
    url: '/docs/area-plans/NESplan.pdf',
    title: 'Northeast Side Plan',
  },
  'fondy-north-plan': {
    url: '/docs/area-plans/Fondy-and-North1222021REDUCED.pdf',
    title: 'Fondy & North Plan',
  },
  'citywide-plan': {
    url: '/docs/area-plans/Citywide.pdf',
    title: 'Citywide Plan',
  },
  'harbor-district-plan': {
    url: '/docs/area-plans/HarborDistrictWaterandLandUsePlanREDUCEDDecember2017.pdf',
    title: 'Harbor District Water & Land Use Plan',
  },
  'housing-element': {
    url: '/docs/area-plans/Housing-Element---FINAL-PLAN---web (1).pdf',
    title: 'Housing Element Plan',
  },
  'near-north-plan': {
    url: '/docs/area-plans/NearNorthPlan-w-CTC.pdf',
    title: 'Near North Side Plan',
  },
  'north-side-plan': {
    url: '/docs/area-plans/NSPlan.pdf',
    title: 'North Side Plan',
  },
  'northwest-plan': {
    url: '/docs/area-plans/NWSPlan.pdf',
    title: 'Northwest Side Plan',
  },
  'third-ward-plan': {
    url: '/docs/area-plans/TWPlan.pdf',
    title: 'Third Ward Plan',
  },
  'washington-park-plan': {
    url: '/docs/area-plans/WPPlan.pdf',
    title: 'Washington Park Plan',
  },
};

// Combined lookup
const ALL_DOCS = { ...ZONING_CODE_DOCS, ...AREA_PLAN_DOCS };

/**
 * Get document URL by source ID
 */
export function getDocumentUrl(sourceId: string): string | null {
  const doc = ALL_DOCS[sourceId];
  return doc?.url || null;
}

/**
 * Get document info by source ID
 */
export function getDocumentInfo(sourceId: string): { url: string; title: string } | null {
  return ALL_DOCS[sourceId] || null;
}

/**
 * Try to match a source name OR sourceId to a document URL.
 * Handles both the new sourceId format (e.g., "zoning-residential")
 * and fuzzy matching for display names.
 */
export function matchDocumentUrl(sourceNameOrId: string): { url: string; title: string } | null {
  const normalized = sourceNameOrId.toLowerCase();

  // ==========================================================================
  // PRIORITY 1: Direct sourceId match (from new RAG extraction)
  // These sourceIds come from ragV2.ts detectZoningSubchapter/detectAreaPlan
  // ==========================================================================

  // Direct key lookup - handles sourceIds like "zoning-residential", "menomonee-valley-plan"
  if (ALL_DOCS[sourceNameOrId]) {
    return ALL_DOCS[sourceNameOrId];
  }

  // Handle sourceId patterns from RAG (e.g., "zoning-general-0" -> "zoning-general")
  const baseId = sourceNameOrId.replace(/-\d+$/, ''); // Remove trailing -N suffix
  if (ALL_DOCS[baseId]) {
    return ALL_DOCS[baseId];
  }

  // ==========================================================================
  // PRIORITY 2: Zoning Code Subchapter Matching (from sourceName)
  // ==========================================================================

  if (normalized.includes('chapter 295') || normalized.includes('ch295') || normalized.includes('zoning')) {
    // Match specific subchapters by keywords in title
    if (normalized.includes('residential')) {
      return ZONING_CODE_DOCS['zoning-residential'];
    }
    if (normalized.includes('commercial')) {
      return ZONING_CODE_DOCS['zoning-commercial'];
    }
    if (normalized.includes('downtown')) {
      return ZONING_CODE_DOCS['zoning-downtown'];
    }
    if (normalized.includes('industrial')) {
      return ZONING_CODE_DOCS['zoning-industrial'];
    }
    if (normalized.includes('special')) {
      return ZONING_CODE_DOCS['zoning-special'];
    }
    if (normalized.includes('overlay')) {
      return ZONING_CODE_DOCS['zoning-overlay'];
    }
    if (normalized.includes('additional')) {
      return ZONING_CODE_DOCS['zoning-additional'];
    }
    if (normalized.includes('definition')) {
      return ZONING_CODE_DOCS['zoning-definitions'];
    }
    if (normalized.includes('table')) {
      return ZONING_CODE_DOCS['zoning-tables'];
    }
    if (normalized.includes('introduction')) {
      return ZONING_CODE_DOCS['zoning-introduction'];
    }
    if (normalized.includes('map') && !normalized.includes('area')) {
      return ZONING_CODE_DOCS['zoning-map'];
    }
    if (normalized.includes('general') || normalized.includes('parking')) {
      return ZONING_CODE_DOCS['zoning-general'];
    }
    // Don't fallback for zoning - return null so we don't show wrong doc
    // Only return general if explicitly mentioned
  }

  // ==========================================================================
  // PRIORITY 3: Area Plan Matching (from sourceName)
  // ==========================================================================

  if (normalized.includes('menomonee') || normalized.includes('valley plan')) {
    return AREA_PLAN_DOCS['menomonee-valley-plan'];
  }
  if (normalized.includes('near west')) {
    return AREA_PLAN_DOCS['near-west-plan'];
  }
  if (normalized.includes('near north')) {
    return AREA_PLAN_DOCS['near-north-plan'];
  }
  if (normalized.includes('southeast')) {
    return AREA_PLAN_DOCS['southeast-plan'];
  }
  if (normalized.includes('southwest')) {
    return AREA_PLAN_DOCS['southwest-plan'];
  }
  if (normalized.includes('northeast')) {
    return AREA_PLAN_DOCS['northeast-plan'];
  }
  if (normalized.includes('northwest')) {
    return AREA_PLAN_DOCS['northwest-plan'];
  }
  if (normalized.includes('north side') && !normalized.includes('near')) {
    return AREA_PLAN_DOCS['north-side-plan'];
  }
  if (normalized.includes('fondy')) {
    return AREA_PLAN_DOCS['fondy-north-plan'];
  }
  if (normalized.includes('harbor')) {
    return AREA_PLAN_DOCS['harbor-district-plan'];
  }
  if (normalized.includes('third ward')) {
    return AREA_PLAN_DOCS['third-ward-plan'];
  }
  if (normalized.includes('washington park')) {
    return AREA_PLAN_DOCS['washington-park-plan'];
  }
  if (normalized.includes('downtown') && normalized.includes('plan')) {
    return AREA_PLAN_DOCS['downtown-plan'];
  }
  if (normalized.includes('housing element')) {
    return AREA_PLAN_DOCS['housing-element'];
  }
  if (normalized.includes('citywide')) {
    return AREA_PLAN_DOCS['citywide-plan'];
  }

  // ==========================================================================
  // FALLBACK: Return null instead of generic doc
  // This is better than showing the wrong document
  // ==========================================================================

  console.log(`[documentUrls] No match found for: "${sourceNameOrId}"`);
  return null;
}

/**
 * Get all zoning code documents
 */
export function getZoningCodeDocs() {
  return Object.values(ZONING_CODE_DOCS);
}

/**
 * Get all area plan documents
 */
export function getAreaPlanDocs() {
  return Object.values(AREA_PLAN_DOCS);
}

export { ZONING_CODE_DOCS, AREA_PLAN_DOCS };
