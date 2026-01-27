"use client";

/**
 * PermitFormsListCard - Generative UI component for displaying permit form search results
 *
 * Shows a list of permit forms with:
 * - Result count header
 * - Compact list items with name, category, completion time
 * - Links to PDF forms
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { FileText, ChevronRight, Clock, ExternalLink } from "lucide-react";

export interface PermitFormListItem {
  id: string;
  officialName: string;
  purpose: string;
  category: string;
  subcategory: string;
  url: string;
  estimatedCompletionTime?: string;
  fees?: string | null;
}

export interface PermitFormsListCardProps {
  forms: PermitFormListItem[];
  query?: string;
  onFormSelect?: (form: PermitFormListItem) => void;
  status: "loading" | "complete";
}

export function PermitFormsListCard({
  forms,
  query,
  onFormSelect,
  status,
}: PermitFormsListCardProps) {
  const isLoading = status === "loading";

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="permitforms-loading"
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
  if (forms.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <FileText className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No permit forms found{query ? ` for "${query}"` : ""}.
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
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-300 dark:border-blue-700">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100">
              Found {forms.length} permit form{forms.length !== 1 ? "s" : ""}
            </h3>
            {query && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                for &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forms list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {forms.map((form) => (
          <div
            key={form.id}
            className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Form Name */}
                <div className="font-medium text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {form.officialName}
                </div>

                {/* Purpose */}
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                  {form.purpose}
                </p>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-2 text-sm text-stone-500 dark:text-stone-400">
                  {/* Category */}
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
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
                    <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-blue-500 transition-colors" />
                  </button>
                )}
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                  title="Open form PDF"
                >
                  <ExternalLink className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PermitFormsListCard;
