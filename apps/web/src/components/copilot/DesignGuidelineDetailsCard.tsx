"use client";

/**
 * DesignGuidelineDetailsCard - Generative UI component for displaying full design guideline details
 *
 * Shows comprehensive design guideline information:
 * - Title and summary
 * - Requirements (required vs recommended)
 * - Best practices
 * - Applicable zoning districts
 * - Related topics
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import {
  BookOpen,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  MapPin,
  Link2,
  Image,
} from "lucide-react";

export interface DesignRequirement {
  rule: string;
  isRequired: boolean;
  codeReference?: string | null;
}

export interface DesignGuidelineDetailsCardProps {
  id: string;
  title: string;
  topic: string;
  summary: string;
  category: string;
  subcategory: string;
  url: string;
  filename: string;
  applicableZoningDistricts: string[];
  requirements: DesignRequirement[];
  bestPractices: string[];
  illustrations: string[];
  relatedTopics: string[];
  triggers: string[];
  status: "loading" | "complete";
}

export function DesignGuidelineDetailsCard({
  title,
  topic,
  summary,
  category,
  subcategory,
  url,
  applicableZoningDistricts,
  requirements,
  bestPractices,
  illustrations,
  relatedTopics,
  status,
}: DesignGuidelineDetailsCardProps) {
  const isLoading = status === "loading";

  // Separate required vs recommended
  const requiredItems = requirements.filter((r) => r.isRequired);
  const recommendedItems = requirements.filter((r) => !r.isRequired);

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="guidelinedetails-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        <div className="p-4 border-b-2 border-black dark:border-white bg-emerald-50 dark:bg-emerald-900/20">
          <div className="h-6 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-2" />
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-1/2" />
        </div>
        <div className="p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-1/4 mb-2" />
              <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-emerald-50 dark:bg-emerald-900/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg border border-emerald-300 dark:border-emerald-700 flex-shrink-0">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-sm">
                  {topic}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {category} - {subcategory}
                </span>
              </div>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors border-2 border-black shadow-[2px_2px_0_0_black]"
          >
            <ExternalLink className="w-4 h-4" />
            Open PDF
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Summary */}
        <div>
          <p className="text-stone-700 dark:text-stone-300">{summary}</p>
        </div>

        {/* Required Items */}
        {requiredItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Requirements ({requiredItems.length})
            </h4>
            <ul className="space-y-2">
              {requiredItems.map((req, i) => (
                <li
                  key={i}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                >
                  <p className="text-sm text-stone-700 dark:text-stone-300">
                    {req.rule}
                  </p>
                  {req.codeReference && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">
                      Ref: {req.codeReference}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Items */}
        {recommendedItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Recommended ({recommendedItems.length})
            </h4>
            <ul className="space-y-2">
              {recommendedItems.map((req, i) => (
                <li
                  key={i}
                  className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3"
                >
                  <p className="text-sm text-stone-700 dark:text-stone-300">
                    {req.rule}
                  </p>
                  {req.codeReference && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">
                      Ref: {req.codeReference}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Best Practices */}
        {bestPractices.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Best Practices
            </h4>
            <ul className="space-y-1">
              {bestPractices.map((practice, i) => (
                <li
                  key={i}
                  className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2"
                >
                  <span className="text-amber-500 mt-1">-</span>
                  {practice}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Applicable Zoning Districts */}
        {applicableZoningDistricts.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              Applicable Zoning Districts
            </h4>
            <div className="flex flex-wrap gap-2">
              {applicableZoningDistricts.map((district, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded text-sm font-mono"
                >
                  {district}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Illustrations */}
        {illustrations.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-purple-500" />
              Illustrations Available
            </h4>
            <ul className="space-y-1">
              {illustrations.map((ill, i) => (
                <li
                  key={i}
                  className="text-sm text-stone-600 dark:text-stone-400"
                >
                  {ill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-stone-500" />
              Related Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignGuidelineDetailsCard;
