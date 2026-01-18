"use client";

/**
 * DevelopmentSiteCard - Generative UI component for displaying development site details
 *
 * Displays development site information including:
 * - Address/site name and zoning
 * - Lot size, asking price
 * - Current and proposed use
 * - Incentives (TIF, Opportunity Zone, etc.)
 * - Description
 * - Contact info
 * - Actions: View Listing, Fly to Location
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import {
  Construction,
  LandPlot,
  DollarSign,
  ExternalLink,
  Navigation,
  Phone,
  FileText,
  Sparkles,
  Building,
  Target,
} from "lucide-react";

export interface DevelopmentSiteCardProps {
  // Location
  address: string;
  coordinates?: [number, number]; // [lng, lat]
  siteName?: string;
  zoning?: string;

  // Property details
  lotSizeSqFt?: number;
  askingPrice?: number;
  currentUse?: string;
  proposedUse?: string;

  // Incentives
  incentives?: string[];

  // Listing info
  description?: string;
  contactInfo?: string;
  listingUrl?: string;

  // Loading state
  status?: "inProgress" | "executing" | "complete";

  // Actions
  onFlyTo?: (coordinates: [number, number]) => void;
}

export function DevelopmentSiteCard({
  address,
  coordinates,
  siteName,
  zoning,
  lotSizeSqFt,
  askingPrice,
  currentUse,
  proposedUse,
  incentives,
  description,
  contactInfo,
  listingUrl,
  status = "complete",
  onFlyTo,
}: DevelopmentSiteCardProps) {
  const isLoading = status === "inProgress" || status === "executing";

  // Format lot size for display
  const formatLotSize = (sqft?: number): string => {
    if (!sqft) return "";
    if (sqft >= 43560) {
      const acres = sqft / 43560;
      return `${acres.toFixed(2)} acres`;
    }
    return `${sqft.toLocaleString()} sqft`;
  };

  // Handle View Listing click
  const handleViewListing = () => {
    if (listingUrl) {
      window.open(listingUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Handle Fly to Location click
  const handleFlyTo = () => {
    if (coordinates && onFlyTo) {
      onFlyTo(coordinates);
    }
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="sitecard-loading"
        className="p-4 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse"
      >
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-stone-300 dark:bg-stone-600 rounded-lg" />
          <div className="flex-1">
            <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-2" />
            <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-1/2" />
          </div>
        </div>

        {/* Details skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-stone-300 dark:bg-stone-600 rounded mb-1" />
              <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>

        {/* Incentives skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-stone-300 dark:bg-stone-600 rounded w-20" />
          <div className="h-6 bg-stone-300 dark:bg-stone-600 rounded w-24" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-3 border-t border-stone-300 dark:border-stone-600">
          <div className="h-10 bg-stone-300 dark:bg-stone-600 rounded flex-1" />
          <div className="h-10 bg-stone-300 dark:bg-stone-600 rounded flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
            <Construction className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
              {siteName || address}
            </h3>
            {siteName && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {address}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {zoning && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded">
                  Zone: {zoning}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b-2 border-black dark:border-white">
        {/* Lot Size */}
        {lotSizeSqFt && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <LandPlot className="w-4 h-4 text-green-500" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {formatLotSize(lotSizeSqFt)}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              lot size
            </span>
          </div>
        )}

        {/* Asking Price */}
        {askingPrice && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {askingPrice >= 1000000
                  ? `${(askingPrice / 1000000).toFixed(1)}M`
                  : `${(askingPrice / 1000).toFixed(0)}K`}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              asking price
            </span>
          </div>
        )}
      </div>

      {/* Current/Proposed Use */}
      {(currentUse || proposedUse) && (
        <div className="px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex flex-wrap gap-4 text-sm">
            {currentUse && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <Building className="w-4 h-4 text-stone-500" />
                <span>Current: {currentUse}</span>
              </div>
            )}
            {proposedUse && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <Target className="w-4 h-4 text-green-500" />
                <span>Proposed: {proposedUse}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incentives */}
      {incentives && incentives.length > 0 && (
        <div className="p-4 border-b-2 border-black dark:border-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="font-medium text-sm text-stone-700 dark:text-stone-300">
              Available Incentives
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {incentives.map((incentive, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs font-medium"
              >
                {incentive}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="p-4 border-b-2 border-black dark:border-white">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-4 h-4 text-stone-400 mt-0.5" />
            <h4 className="font-medium text-sm text-stone-700 dark:text-stone-300">
              Description
            </h4>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed pl-6">
            {description}
          </p>
        </div>
      )}

      {/* Contact Info */}
      {contactInfo && (
        <div className="px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <Phone className="w-4 h-4 text-stone-500" />
            <span>{contactInfo}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 p-4 bg-stone-50 dark:bg-stone-800">
        {listingUrl && (
          <button
            onClick={handleViewListing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            View Listing
          </button>
        )}
        {coordinates && onFlyTo && (
          <button
            onClick={handleFlyTo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-900 dark:text-stone-100 font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <Navigation className="w-4 h-4" />
            Fly to Location
          </button>
        )}
      </div>
    </div>
  );
}

export default DevelopmentSiteCard;
