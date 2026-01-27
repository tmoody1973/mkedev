"use client";

/**
 * PermitRecommendationsCard - Generative UI component for displaying recommended permits
 *
 * Shows recommended permits for a project with:
 * - Project context header
 * - Prioritized list of recommended forms
 * - Links to PDF forms
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { FileCheck, ChevronRight, Clock, ExternalLink, Lightbulb } from "lucide-react";

export interface PermitRecommendationItem {
  id: string;
  officialName: string;
  purpose: string;
  category: string;
  subcategory: string;
  url: string;
  estimatedCompletionTime?: string;
  fees?: string | null;
}

export interface PermitRecommendationsCardProps {
  recommendations: PermitRecommendationItem[];
  projectDescription?: string;
  projectType?: string;
  onFormSelect?: (form: PermitRecommendationItem) => void;
  status: "loading" | "complete";
}

export function PermitRecommendationsCard({
  recommendations = [],
  projectDescription,
  projectType,
  onFormSelect,
  status,
}: PermitRecommendationsCardProps) {
  const isLoading = status === "loading";

  // Ensure recommendations is always an array
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  // Format project type for display
  const formatProjectType = (type?: string): string => {
    if (!type) return "";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="permitrecs-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        {/* Header skeleton */}
        <div className="p-4 border-b-2 border-black dark:border-white bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-300 dark:bg-stone-600 rounded-lg" />
            <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-56" />
          </div>
        </div>

        {/* List items skeleton */}
        <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-1/2" />
                </div>
                <div className="w-5 h-5 bg-stone-300 dark:bg-stone-600 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (safeRecommendations.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <FileCheck className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No specific permits identified for this project type.
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Try providing more details about your project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header with context */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg border border-amber-300 dark:border-amber-700">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100">
              Recommended Permits ({safeRecommendations.length})
            </h3>
            {(projectType || projectDescription) && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                {projectType && (
                  <span className="font-medium">{formatProjectType(projectType)}</span>
                )}
                {projectType && projectDescription && " - "}
                {projectDescription && (
                  <span className="line-clamp-1">{projectDescription}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {safeRecommendations.map((form, index) => (
          <div
            key={form.id}
            className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              {/* Priority indicator */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm font-bold">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0 ml-2">
                {/* Form Name */}
                <div className="font-medium text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {form.officialName}
                </div>

                {/* Purpose */}
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                  {form.purpose}
                </p>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-2 text-sm text-stone-500 dark:text-stone-400">
                  {/* Category */}
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs">
                    {form.category}
                  </span>

                  {/* Completion Time */}
                  {form.estimatedCompletionTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {form.estimatedCompletionTime}
                    </span>
                  )}

                  {/* Fees */}
                  {form.fees && (
                    <span className="text-green-600 dark:text-green-400">
                      {form.fees}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {onFormSelect && (
                  <button
                    onClick={() => onFormSelect(form)}
                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-amber-500 transition-colors" />
                  </button>
                )}
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900 rounded transition-colors"
                  title="Open form PDF"
                >
                  <ExternalLink className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PermitRecommendationsCard;
