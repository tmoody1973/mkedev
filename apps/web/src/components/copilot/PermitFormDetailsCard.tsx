"use client";

/**
 * PermitFormDetailsCard - Generative UI component for displaying full permit form details
 *
 * Shows comprehensive permit form information:
 * - Form name and purpose
 * - When required triggers
 * - Prerequisites and related forms
 * - Submission methods and fees
 * - Applicable project types and zoning districts
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import {
  FileText,
  ExternalLink,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Building,
  MapPin,
  Send,
  Link2,
} from "lucide-react";

export interface PermitFormDetailsCardProps {
  id: string;
  officialName: string;
  purpose: string;
  category: string;
  subcategory: string;
  url: string;
  filename: string;
  whenRequired: string[];
  prerequisites: string[];
  relatedForms: string[];
  estimatedCompletionTime: string;
  submissionMethod: string[];
  fees: string | null;
  applicableProjectTypes: string[];
  zoningDistricts: string[];
  triggers: string[];
  status: "loading" | "complete";
}

export function PermitFormDetailsCard({
  officialName,
  purpose,
  category,
  subcategory,
  url,
  whenRequired,
  prerequisites,
  relatedForms,
  estimatedCompletionTime,
  submissionMethod,
  fees,
  applicableProjectTypes,
  zoningDistricts,
  status,
}: PermitFormDetailsCardProps) {
  const isLoading = status === "loading";

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="permitdetails-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        <div className="p-4 border-b-2 border-black dark:border-white bg-blue-50 dark:bg-blue-900/20">
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
      <div className="p-4 border-b-2 border-black dark:border-white bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-300 dark:border-blue-700 flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                {officialName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                  {category}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {subcategory}
                </span>
              </div>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors border-2 border-black shadow-[2px_2px_0_0_black]"
          >
            <ExternalLink className="w-4 h-4" />
            Open Form
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Purpose */}
        <div>
          <p className="text-stone-700 dark:text-stone-300">{purpose}</p>
        </div>

        {/* Quick Info Row */}
        <div className="flex flex-wrap gap-4">
          {estimatedCompletionTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-stone-400" />
              <span className="text-stone-600 dark:text-stone-400">
                {estimatedCompletionTime}
              </span>
            </div>
          )}
          {fees && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {fees}
              </span>
            </div>
          )}
          {submissionMethod.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Send className="w-4 h-4 text-stone-400" />
              <span className="text-stone-600 dark:text-stone-400">
                {submissionMethod.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* When Required */}
        {whenRequired.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              When Required
            </h4>
            <ul className="space-y-1">
              {whenRequired.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2"
                >
                  <span className="text-amber-500 mt-1">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Prerequisites
            </h4>
            <ul className="space-y-1">
              {prerequisites.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2"
                >
                  <span className="text-green-500 mt-1">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Applicable Project Types */}
        {applicableProjectTypes.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-purple-500" />
              Applicable Project Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {applicableProjectTypes.map((type, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Zoning Districts */}
        {zoningDistricts.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              Applicable Zoning Districts
            </h4>
            <div className="flex flex-wrap gap-2">
              {zoningDistricts.map((district, i) => (
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

        {/* Related Forms */}
        {relatedForms.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-stone-500" />
              Related Forms
            </h4>
            <ul className="space-y-1">
              {relatedForms.map((form, i) => (
                <li
                  key={i}
                  className="text-sm text-blue-600 dark:text-blue-400"
                >
                  {form}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default PermitFormDetailsCard;
