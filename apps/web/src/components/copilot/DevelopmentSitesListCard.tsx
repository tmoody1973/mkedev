"use client";

/**
 * DevelopmentSitesListCard - Generative UI component for displaying development site search results
 *
 * Shows a condensed list of development sites with:
 * - Result count header
 * - Compact list items with address, lot size, price, incentives
 * - Clickable items that trigger flyTo and selection
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { Construction, ChevronRight, DollarSign, LandPlot, Sparkles } from "lucide-react";

export interface DevelopmentSiteListItem {
  id: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  siteName?: string;
  lotSizeSqFt?: number;
  askingPrice?: number;
  zoning?: string;
  incentives?: string[];
}

export interface DevelopmentSitesListCardProps {
  sites: DevelopmentSiteListItem[];
  onSiteSelect: (site: DevelopmentSiteListItem) => void;
  status: "loading" | "complete";
}

export function DevelopmentSitesListCard({
  sites,
  onSiteSelect,
  status,
}: DevelopmentSitesListCardProps) {
  const isLoading = status === "loading";

  // Format price for display
  const formatPrice = (price?: number): string => {
    if (!price) return "Price TBD";
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  // Format lot size for display
  const formatLotSize = (sqft?: number): string => {
    if (!sqft) return "";
    if (sqft >= 43560) {
      const acres = sqft / 43560;
      return `${acres.toFixed(2)} acres`;
    }
    return `${sqft.toLocaleString()} sqft`;
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="siteslist-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        {/* Header skeleton */}
        <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
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
  if (sites.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <Construction className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No development sites found matching your criteria.
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Try adjusting your search filters.
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
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
            <Construction className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">
            Found {sites.length} development site{sites.length !== 1 ? "s" : ""}
          </h3>
        </div>
      </div>

      {/* Sites list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {sites.map((site) => (
          <button
            key={site.id}
            onClick={() => onSiteSelect(site)}
            className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Address/Site Name */}
                <div className="font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {site.siteName || site.address}
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {/* Lot Size */}
                  {site.lotSizeSqFt && (
                    <span className="flex items-center gap-1">
                      <LandPlot className="w-3 h-3" />
                      {formatLotSize(site.lotSizeSqFt)}
                    </span>
                  )}

                  {/* Price */}
                  <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                    <DollarSign className="w-3 h-3" />
                    {formatPrice(site.askingPrice)}
                  </span>

                  {/* Incentives */}
                  {site.incentives && site.incentives.length > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs">
                      <Sparkles className="w-3 h-3" />
                      {site.incentives.length} incentive{site.incentives.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron indicator */}
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-green-500 transition-colors flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DevelopmentSitesListCard;
