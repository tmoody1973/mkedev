/**
 * Permit Forms and Design Guidelines Library
 *
 * Provides access to enriched Milwaukee permit forms and design guidelines
 * with search, filtering, and recommendation capabilities.
 */

import permitFormsData from "../../../data/scraped-docs/enriched/permit-forms.json";
import designGuidelinesData from "../../../data/scraped-docs/enriched/design-guidelines.json";
import type {
  EnrichedPermitForm,
  EnrichedDesignGuideline,
  ProjectContext,
  ProjectType,
} from "./types";

// Type assertion for JSON imports
const permitForms = permitFormsData as EnrichedPermitForm[];
const designGuidelines = designGuidelinesData as EnrichedDesignGuideline[];

/**
 * Get all permit forms
 */
export function getAllPermitForms(): EnrichedPermitForm[] {
  return permitForms;
}

/**
 * Get all design guidelines
 */
export function getAllDesignGuidelines(): EnrichedDesignGuideline[] {
  return designGuidelines;
}

/**
 * Get a permit form by ID
 */
export function getPermitFormById(id: string): EnrichedPermitForm | undefined {
  return permitForms.find((form) => form.id === id);
}

/**
 * Get a design guideline by ID
 */
export function getDesignGuidelineById(id: string): EnrichedDesignGuideline | undefined {
  return designGuidelines.find((guide) => guide.id === id);
}

/**
 * Search permit forms by keyword (searches triggers, purpose, officialName)
 */
export function searchPermitForms(query: string): EnrichedPermitForm[] {
  const normalizedQuery = query.toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/);

  return permitForms
    .map((form) => {
      let score = 0;

      // Check triggers (highest weight)
      const triggerMatches =
        form.triggers?.filter((trigger) =>
          queryTerms.some((term) => trigger.toLowerCase().includes(term))
        ).length || 0;
      score += triggerMatches * 10;

      // Check purpose
      if (form.purpose?.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }

      // Check official name
      if (form.officialName?.toLowerCase().includes(normalizedQuery)) {
        score += 8;
      }

      // Check whenRequired
      const whenRequiredMatches =
        form.whenRequired?.filter((when) =>
          queryTerms.some((term) => when.toLowerCase().includes(term))
        ).length || 0;
      score += whenRequiredMatches * 3;

      return { form, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.form);
}

/**
 * Search design guidelines by keyword
 */
export function searchDesignGuidelines(query: string): EnrichedDesignGuideline[] {
  const normalizedQuery = query.toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/);

  return designGuidelines
    .map((guide) => {
      let score = 0;

      // Check triggers (highest weight)
      const triggerMatches =
        guide.triggers?.filter((trigger) =>
          queryTerms.some((term) => trigger.toLowerCase().includes(term))
        ).length || 0;
      score += triggerMatches * 10;

      // Check title
      if (guide.title?.toLowerCase().includes(normalizedQuery)) {
        score += 8;
      }

      // Check summary
      if (guide.summary?.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }

      // Check topic
      if (guide.topic?.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }

      // Check best practices
      const practiceMatches =
        guide.bestPractices?.filter((practice) =>
          queryTerms.some((term) => practice.toLowerCase().includes(term))
        ).length || 0;
      score += practiceMatches * 2;

      return { guide, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.guide);
}

/**
 * Get permit forms by project type
 */
export function getPermitFormsByProjectType(projectType: ProjectType): EnrichedPermitForm[] {
  return permitForms.filter((form) =>
    form.applicableProjectTypes?.includes(projectType)
  );
}

/**
 * Get permit forms by category
 */
export function getPermitFormsByCategory(category: string): EnrichedPermitForm[] {
  return permitForms.filter((form) => form.category === category);
}

/**
 * Get permit forms by subcategory
 */
export function getPermitFormsBySubcategory(subcategory: string): EnrichedPermitForm[] {
  return permitForms.filter((form) => form.subcategory === subcategory);
}

/**
 * Get design guidelines by topic
 */
export function getDesignGuidelinesByTopic(topic: string): EnrichedDesignGuideline[] {
  return designGuidelines.filter((guide) => guide.topic === topic);
}

/**
 * Get design guidelines applicable to a zoning district
 */
export function getDesignGuidelinesByZoning(
  zoningDistrict: string
): EnrichedDesignGuideline[] {
  return designGuidelines.filter(
    (guide) =>
      guide.applicableZoningDistricts?.includes("all") ||
      guide.applicableZoningDistricts?.includes(zoningDistrict)
  );
}

/**
 * Recommend permit forms based on project context
 */
export function recommendPermitForms(context: ProjectContext): {
  required: EnrichedPermitForm[];
  recommended: EnrichedPermitForm[];
  optional: EnrichedPermitForm[];
} {
  const projectTypes = Array.isArray(context.projectType)
    ? context.projectType
    : context.projectType
      ? [context.projectType]
      : [];

  const allKeywords = [
    ...(context.keywords || []),
    ...(context.description?.toLowerCase().split(/\s+/) || []),
    ...projectTypes,
  ];

  // Score each form
  const scoredForms = permitForms.map((form) => {
    let score = 0;
    let isRequired = false;

    // Project type match (high importance)
    for (const pt of projectTypes) {
      if (form.applicableProjectTypes?.includes(pt)) {
        score += 20;
        isRequired = true;
      }
    }

    // Zoning district match
    if (context.zoningDistrict) {
      if (
        form.zoningDistricts?.includes("all") ||
        form.zoningDistricts?.includes(context.zoningDistrict)
      ) {
        score += 5;
      }
    }

    // Keyword/trigger matches
    const triggerMatches =
      form.triggers?.filter((trigger) =>
        allKeywords.some((keyword) =>
          trigger.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length || 0;
    score += triggerMatches * 8;

    // Special conditions
    if (context.hasParking && form.triggers?.some((t) => t.includes("parking"))) {
      score += 10;
    }

    if (
      context.isResidential &&
      form.applicableProjectTypes?.some((t) => ["adu", "renovation", "addition"].includes(t))
    ) {
      score += 5;
    }

    if (
      context.isCommercial &&
      form.applicableProjectTypes?.some((t) => ["sign", "change_of_use"].includes(t))
    ) {
      score += 5;
    }

    return { form, score, isRequired };
  });

  // Sort by score
  const sorted = scoredForms.sort((a, b) => b.score - a.score);

  // Categorize
  const required = sorted.filter((item) => item.isRequired && item.score >= 20).map((item) => item.form);
  const recommended = sorted
    .filter((item) => !item.isRequired && item.score >= 15)
    .map((item) => item.form);
  const optional = sorted
    .filter((item) => !item.isRequired && item.score >= 5 && item.score < 15)
    .slice(0, 5)
    .map((item) => item.form);

  return { required, recommended, optional };
}

/**
 * Recommend design guidelines based on project context
 */
export function recommendDesignGuidelines(context: ProjectContext): EnrichedDesignGuideline[] {
  const allKeywords = [
    ...(context.keywords || []),
    ...(context.description?.toLowerCase().split(/\s+/) || []),
  ];

  // Score each guideline
  const scoredGuidelines = designGuidelines.map((guide) => {
    let score = 0;

    // Zoning district match
    if (context.zoningDistrict) {
      if (
        guide.applicableZoningDistricts?.includes("all") ||
        guide.applicableZoningDistricts?.includes(context.zoningDistrict)
      ) {
        score += 10;
      }
    }

    // Keyword/trigger matches
    const triggerMatches =
      guide.triggers?.filter((trigger) =>
        allKeywords.some((keyword) =>
          trigger.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length || 0;
    score += triggerMatches * 5;

    // Special conditions
    if (context.hasParking) {
      if (guide.topic === "parking" || guide.topic === "structured_parking") {
        score += 15;
      }
    }

    if (context.isResidential && guide.topic === "residential_design") {
      score += 10;
    }

    return { guide, score };
  });

  // Sort and return top matches
  return scoredGuidelines
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.guide);
}

/**
 * Get form statistics
 */
export function getFormStats(): {
  totalForms: number;
  totalGuidelines: number;
  formsByCategory: Record<string, number>;
  guidelinesByTopic: Record<string, number>;
  projectTypes: string[];
} {
  const formsByCategory: Record<string, number> = {};
  const guidelinesByTopic: Record<string, number> = {};
  const projectTypeSet = new Set<string>();

  permitForms.forEach((form) => {
    formsByCategory[form.category] = (formsByCategory[form.category] || 0) + 1;
    form.applicableProjectTypes?.forEach((pt) => projectTypeSet.add(pt));
  });

  designGuidelines.forEach((guide) => {
    if (guide.topic) {
      guidelinesByTopic[guide.topic] = (guidelinesByTopic[guide.topic] || 0) + 1;
    }
  });

  return {
    totalForms: permitForms.length,
    totalGuidelines: designGuidelines.length,
    formsByCategory,
    guidelinesByTopic,
    projectTypes: Array.from(projectTypeSet),
  };
}

// Re-export types
export type { EnrichedPermitForm, EnrichedDesignGuideline, ProjectContext, ProjectType } from "./types";
