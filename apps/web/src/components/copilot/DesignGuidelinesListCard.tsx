"use client";

/**
 * DesignGuidelinesListCard - Generative UI component for displaying design guideline search results
 *
 * Shows a list of design guidelines with:
 * - Result count header
 * - Compact list items with title, topic, summary
 * - Links to PDF guidelines
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { BookOpen, ChevronRight, ExternalLink } from "lucide-react";

export interface DesignGuidelineListItem {
  id: string;
  title: string;
  topic: string;
  summary: string;
  category: string;
  subcategory: string;
  url: string;
}

export interface DesignGuidelinesListCardProps {
  guidelines: DesignGuidelineListItem[];
  query?: string;
  onGuidelineSelect?: (guideline: DesignGuidelineListItem) => void;
  status: "loading" | "complete";
}

export function DesignGuidelinesListCard({
  guidelines,
  query,
  onGuidelineSelect,
  status,
}: DesignGuidelinesListCardProps) {
  const isLoading = status === "loading";

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="guidelines-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        {/* Header skeleton */}
        <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-300 dark:bg-stone-600 rounded-lg" />
            <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-48" />
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
  if (guidelines.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No design guidelines found{query ? ` for "${query}"` : ""}.
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Try a different search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header with count */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg border border-emerald-300 dark:border-emerald-700">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100">
              Found {guidelines.length} design guideline{guidelines.length !== 1 ? "s" : ""}
            </h3>
            {query && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                for &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Guidelines list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {guidelines.map((guideline) => (
          <div
            key={guideline.id}
            className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="font-medium text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {guideline.title}
                </div>

                {/* Summary */}
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                  {guideline.summary}
                </p>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-2 text-sm text-stone-500 dark:text-stone-400">
                  {/* Topic */}
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs">
                    {guideline.topic}
                  </span>

                  {/* Category */}
                  <span className="text-stone-400 dark:text-stone-500">
                    {guideline.category}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {onGuidelineSelect && (
                  <button
                    onClick={() => onGuidelineSelect(guideline)}
                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
                  </button>
                )}
                <a
                  href={guideline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded transition-colors"
                  title="Open guideline PDF"
                >
                  <ExternalLink className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DesignGuidelinesListCard;
