"use client";

/**
 * FormActionCard - Generative UI component for displaying permit form actions
 *
 * Renders a card with form details and action buttons for downloading or
 * viewing permit application forms. Used as a Generative UI component.
 */

import { FileText, Download, ExternalLink, Clock } from "lucide-react";

interface FormActionCardProps {
  formName: string;
  formNumber?: string;
  description?: string;
  downloadUrl?: string;
  infoUrl?: string;
  deadline?: string;
  requiredFor?: string[];
  steps?: string[];
  status?: "inProgress" | "executing" | "complete";
}

export function FormActionCard({
  formName,
  formNumber,
  description,
  downloadUrl,
  infoUrl,
  deadline,
  requiredFor = [],
  steps = [],
  status = "complete",
}: FormActionCardProps) {
  const isLoading = status === "inProgress" || status === "executing";

  if (isLoading) {
    return (
      <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-sky-500" />
          <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-48" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-full" />
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg border border-sky-300 dark:border-sky-700">
          <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight">
            {formName}
          </h3>
          {formNumber && (
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Form #{formNumber}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {description}
        </p>
      )}

      {/* Deadline */}
      {deadline && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-800">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Deadline:</span> {deadline}
          </span>
        </div>
      )}

      {/* Required For */}
      {requiredFor.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Required for:
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {requiredFor.map((use, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded"
              >
                {use}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Process steps:
          </span>
          <ol className="mt-2 space-y-1.5">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-stone-700 dark:text-stone-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-200 dark:border-stone-700">
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <Download className="w-4 h-4" />
            Download Form
          </a>
        )}
        {infoUrl && (
          <a
            href={infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            More Info
          </a>
        )}
      </div>
    </div>
  );
}

export default FormActionCard;
