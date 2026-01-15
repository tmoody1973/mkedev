"use client";

/**
 * CopilotActions - Registers generative UI renderers for agent tool calls
 *
 * This component uses CopilotKit hooks to render custom UI for backend tool calls.
 * Add this component to any page where you want generative UI to appear in the chat.
 *
 * Note: Currently used for reference/future CopilotKit Runtime integration.
 * The main chat uses our custom ChatPanel with renderCard prop instead.
 */

import { useCopilotAction } from "@copilotkit/react-core";
import { ZoneInfoCard } from "./ZoneInfoCard";
import { FormActionCard } from "./FormActionCard";

export function CopilotActions() {
  // Render zoning query results as a ZoneInfoCard
  useCopilotAction({
    name: "query_zoning_at_point",
    available: "disabled", // Render-only, don't allow frontend to call this
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <ZoneInfoCard
            zoningDistrict="..."
            status={status}
          />
        );
      }

      if (status === "complete" && result?.success) {
        return (
          <ZoneInfoCard
            zoningDistrict={result.zoningDistrict || "Unknown"}
            zoningDescription={result.zoningDescription}
            zoningCategory={result.zoningCategory}
            overlayZones={result.overlayZones}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render parking calculation results
  useCopilotAction({
    name: "calculate_parking",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse">
            <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-32" />
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Required Parking
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {result.requiredSpaces} spaces
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
              {result.calculation}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {result.codeReference}
            </p>
            {result.isReducedDistrict && (
              <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded text-xs text-amber-800 dark:text-amber-200">
                Reduced parking district - lower requirements apply
              </div>
            )}
          </div>
        );
      }

      return <></>;
    },
  });

  // Render form recommendations
  useCopilotAction({
    name: "recommend_form",
    available: "disabled",
    render: ({ status, args, result }) => {
      if (status === "inProgress" || status === "executing") {
        return <FormActionCard formName="Loading..." status={status} />;
      }

      if (status === "complete" && result) {
        return (
          <FormActionCard
            formName={result.formName || args?.formName || "Application Form"}
            formNumber={result.formNumber}
            description={result.description}
            downloadUrl={result.downloadUrl}
            infoUrl={result.infoUrl}
            deadline={result.deadline}
            requiredFor={result.requiredFor}
            steps={result.steps}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render geocode results with a mini map indicator
  useCopilotAction({
    name: "geocode_address",
    available: "disabled",
    render: ({ status, args, result }) => {
      if (status === "complete" && result?.success) {
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-full text-sm border border-stone-200 dark:border-stone-700">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            <span className="text-stone-700 dark:text-stone-300">
              {result.formattedAddress || args?.address}
            </span>
          </div>
        );
      }
      return <></>;
    },
  });

  // Render area plan query results
  useCopilotAction({
    name: "query_area_plans",
    available: "disabled",
    render: ({ status }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-lg bg-sky-50 dark:bg-sky-900/20">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Searching neighborhood plans...</span>
            </div>
          </div>
        );
      }
      return <></>;
    },
  });

  // Render zoning code query (RAG) results
  useCopilotAction({
    name: "query_zoning_code",
    available: "disabled",
    render: ({ status }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Searching zoning code...</span>
            </div>
          </div>
        );
      }
      return <></>;
    },
  });

  return null; // This component only registers hooks, doesn't render anything itself
}

export default CopilotActions;
