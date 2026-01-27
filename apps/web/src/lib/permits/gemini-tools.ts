/**
 * Gemini Function Calling Tools for Permit Forms
 *
 * These tool definitions can be used with Gemini's function calling
 * to let the AI recommend permits and guidelines based on user queries.
 */

import {
  searchPermitForms,
  searchDesignGuidelines,
  getPermitFormsByProjectType,
  getDesignGuidelinesByTopic,
  recommendPermitForms,
  recommendDesignGuidelines,
  getPermitFormById,
  getDesignGuidelineById,
  getFormStats,
} from "./index";
import type { ProjectContext, ProjectType } from "./types";

/**
 * Tool definition type for Gemini function calling (simplified)
 */
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
        items?: { type: string; enum?: string[] };
      }
    >;
    required: string[];
  };
}

const PROJECT_TYPES = [
  "new_construction",
  "renovation",
  "addition",
  "change_of_use",
  "conversion",
  "adu",
  "deck",
  "fence",
  "garage",
  "sign",
  "home_occupation",
  "variance",
  "conditional_use",
  "demolition",
];

const GUIDELINE_TOPICS = [
  "site_layout",
  "parking",
  "vehicle_access",
  "pedestrian_access",
  "bicycle_facilities",
  "transit",
  "landscaping",
  "parking_lot_landscaping",
  "facades",
  "entrances",
  "signage",
  "wall_signs",
  "streetscape",
  "structured_parking",
  "residential_design",
  "materials",
];

/**
 * Gemini function declarations for permit tools (as plain objects)
 * These can be converted to proper SDK format or used directly with REST API
 */
export const permitToolDeclarations: ToolDefinition[] = [
  {
    name: "search_permit_forms",
    description:
      "Search Milwaukee permit forms by keyword. Use when a user asks about specific permits, applications, or forms. Returns matching forms ranked by relevance.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query (e.g., 'home occupation', 'sign permit', 'variance', 'deck', 'ADU')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_design_guidelines",
    description:
      "Search Milwaukee design guidelines by keyword. Use when a user asks about design requirements, building standards, or urban design rules.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query (e.g., 'parking', 'facade', 'landscaping', 'signage')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_forms_by_project_type",
    description: `Get all permit forms applicable to a specific project type. Valid types: ${PROJECT_TYPES.join(", ")}`,
    parameters: {
      type: "object",
      properties: {
        projectType: {
          type: "string",
          description: `Type of project. One of: ${PROJECT_TYPES.join(", ")}`,
        },
      },
      required: ["projectType"],
    },
  },
  {
    name: "get_guidelines_by_topic",
    description: `Get design guidelines for a specific topic. Valid topics: ${GUIDELINE_TOPICS.join(", ")}`,
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: `Design guideline topic. One of: ${GUIDELINE_TOPICS.join(", ")}`,
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "recommend_permits_for_project",
    description:
      "Get recommended permit forms based on project details. Use this when you have enough information about what the user is planning to build or change. Returns required, recommended, and optional forms.",
    parameters: {
      type: "object",
      properties: {
        projectType: {
          type: "string",
          description: `Comma-separated project types from: ${PROJECT_TYPES.join(", ")}`,
        },
        zoningDistrict: {
          type: "string",
          description: "Zoning district code if known (e.g., 'LB1', 'RM4', 'IO')",
        },
        description: {
          type: "string",
          description: "Free-text description of the project",
        },
        keywords: {
          type: "string",
          description: "Comma-separated keywords describing the project",
        },
        hasParking: {
          type: "string",
          description: "'true' or 'false' - whether the project includes parking",
        },
        isResidential: {
          type: "string",
          description: "'true' or 'false' - whether the project is residential",
        },
        isCommercial: {
          type: "string",
          description: "'true' or 'false' - whether the project is commercial",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "recommend_design_guidelines",
    description:
      "Get relevant design guidelines based on project details. Returns guidelines that apply to the project.",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Free-text description of the project",
        },
        zoningDistrict: {
          type: "string",
          description: "Zoning district code if known",
        },
        keywords: {
          type: "string",
          description: "Comma-separated keywords like 'parking', 'retail', 'facade'",
        },
        hasParking: {
          type: "string",
          description: "'true' or 'false' - whether the project includes parking",
        },
        isResidential: {
          type: "string",
          description: "'true' or 'false' - whether residential",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "get_permit_form_details",
    description:
      "Get full details about a specific permit form including all fields, requirements, and submission info. Use when a user wants to know more about a specific form.",
    parameters: {
      type: "object",
      properties: {
        formId: {
          type: "string",
          description: "The form ID (e.g., 'bozainfo', 'footing', 'sign-permits')",
        },
      },
      required: ["formId"],
    },
  },
  {
    name: "get_guideline_details",
    description:
      "Get full details about a specific design guideline including requirements, best practices, and code references.",
    parameters: {
      type: "object",
      properties: {
        guidelineId: {
          type: "string",
          description: "The guideline ID",
        },
      },
      required: ["guidelineId"],
    },
  },
  {
    name: "get_permit_stats",
    description:
      "Get statistics about available permit forms and design guidelines. Use to answer questions like 'how many forms are there' or 'what types of permits exist'.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a permit tool call
 */
export function executePermitTool(
  toolName: string,
  args: Record<string, unknown>
): unknown {
  switch (toolName) {
    case "search_permit_forms": {
      const results = searchPermitForms(args.query as string);
      return results.slice(0, 10).map((form) => ({
        id: form.id,
        name: form.officialName,
        purpose: form.purpose,
        url: form.url,
        projectTypes: form.applicableProjectTypes,
        estimatedTime: form.estimatedCompletionTime,
      }));
    }

    case "search_design_guidelines": {
      const results = searchDesignGuidelines(args.query as string);
      return results.slice(0, 10).map((guide) => ({
        id: guide.id,
        title: guide.title,
        topic: guide.topic,
        summary: guide.summary,
        url: guide.url,
      }));
    }

    case "get_forms_by_project_type": {
      const results = getPermitFormsByProjectType(args.projectType as ProjectType);
      return results.map((form) => ({
        id: form.id,
        name: form.officialName,
        purpose: form.purpose,
        url: form.url,
      }));
    }

    case "get_guidelines_by_topic": {
      const results = getDesignGuidelinesByTopic(args.topic as string);
      return results.map((guide) => ({
        id: guide.id,
        title: guide.title,
        summary: guide.summary,
        requirements: guide.requirements?.length || 0,
        url: guide.url,
      }));
    }

    case "recommend_permits_for_project": {
      // Parse comma-separated values and booleans
      const projectTypes = args.projectType
        ? (args.projectType as string).split(",").map((t) => t.trim()) as ProjectType[]
        : undefined;
      const keywords = args.keywords
        ? (args.keywords as string).split(",").map((k) => k.trim())
        : undefined;

      const context: ProjectContext = {
        projectType: projectTypes,
        zoningDistrict: args.zoningDistrict as string,
        description: args.description as string,
        keywords,
        hasParking: args.hasParking === "true",
        isResidential: args.isResidential === "true",
        isCommercial: args.isCommercial === "true",
      };
      const { required, recommended, optional } = recommendPermitForms(context);
      return {
        required: required.map((f) => ({
          id: f.id,
          name: f.officialName,
          purpose: f.purpose,
          url: f.url,
        })),
        recommended: recommended.map((f) => ({
          id: f.id,
          name: f.officialName,
          purpose: f.purpose,
          url: f.url,
        })),
        optional: optional.map((f) => ({
          id: f.id,
          name: f.officialName,
          purpose: f.purpose,
          url: f.url,
        })),
      };
    }

    case "recommend_design_guidelines": {
      const keywords = args.keywords
        ? (args.keywords as string).split(",").map((k) => k.trim())
        : undefined;

      const context: ProjectContext = {
        description: args.description as string,
        zoningDistrict: args.zoningDistrict as string,
        keywords,
        hasParking: args.hasParking === "true",
        isResidential: args.isResidential === "true",
      };
      const results = recommendDesignGuidelines(context);
      return results.map((guide) => ({
        id: guide.id,
        title: guide.title,
        topic: guide.topic,
        summary: guide.summary,
        requirementsCount: guide.requirements?.length || 0,
        url: guide.url,
      }));
    }

    case "get_permit_form_details": {
      const form = getPermitFormById(args.formId as string);
      if (!form) {
        return { error: `Form not found: ${args.formId}` };
      }
      return {
        id: form.id,
        name: form.officialName,
        purpose: form.purpose,
        whenRequired: form.whenRequired,
        prerequisites: form.prerequisites,
        relatedForms: form.relatedForms,
        estimatedTime: form.estimatedCompletionTime,
        submissionMethods: form.submissionMethod,
        fees: form.fees,
        fields: form.fields?.map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          description: f.description,
          autoFillable: !!f.autoFillSource && f.autoFillSource !== "null",
        })),
        url: form.url,
      };
    }

    case "get_guideline_details": {
      const guide = getDesignGuidelineById(args.guidelineId as string);
      if (!guide) {
        return { error: `Guideline not found: ${args.guidelineId}` };
      }
      return {
        id: guide.id,
        title: guide.title,
        topic: guide.topic,
        summary: guide.summary,
        applicableZoning: guide.applicableZoningDistricts,
        requirements: guide.requirements,
        bestPractices: guide.bestPractices,
        relatedTopics: guide.relatedTopics,
        url: guide.url,
      };
    }

    case "get_permit_stats": {
      return getFormStats();
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Format tool result for display
 */
export function formatToolResultForDisplay(
  toolName: string,
  result: unknown
): string {
  if (typeof result === "object" && result !== null && "error" in result) {
    return `Error: ${(result as { error: string }).error}`;
  }

  switch (toolName) {
    case "search_permit_forms":
    case "get_forms_by_project_type": {
      const forms = result as Array<{ name: string; purpose: string; url: string }>;
      if (forms.length === 0) return "No matching forms found.";
      return forms
        .map((f, i) => `${i + 1}. **${f.name}**\n   ${f.purpose}\n   [View Form](${f.url})`)
        .join("\n\n");
    }

    case "search_design_guidelines":
    case "get_guidelines_by_topic": {
      const guides = result as Array<{ title: string; summary: string; url: string }>;
      if (guides.length === 0) return "No matching guidelines found.";
      return guides
        .map((g, i) => `${i + 1}. **${g.title}**\n   ${g.summary}\n   [View Guideline](${g.url})`)
        .join("\n\n");
    }

    case "recommend_permits_for_project": {
      const rec = result as {
        required: Array<{ name: string; url: string }>;
        recommended: Array<{ name: string; url: string }>;
        optional: Array<{ name: string; url: string }>;
      };
      let output = "";
      if (rec.required.length > 0) {
        output += "**Required Forms:**\n" + rec.required.map((f) => `- ${f.name}`).join("\n");
      }
      if (rec.recommended.length > 0) {
        output +=
          "\n\n**Recommended Forms:**\n" + rec.recommended.map((f) => `- ${f.name}`).join("\n");
      }
      if (rec.optional.length > 0) {
        output +=
          "\n\n**Optional/Related Forms:**\n" + rec.optional.map((f) => `- ${f.name}`).join("\n");
      }
      return output || "No specific forms recommended for this project.";
    }

    default:
      return JSON.stringify(result, null, 2);
  }
}
