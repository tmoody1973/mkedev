"use client";

/**
 * VacantLotsListCard - Generative UI component for displaying multiple vacant lot search results
 *
 * Shows a condensed list of city-owned vacant lots with:
 * - Result count header
 * - Compact list items with address, neighborhood, zoning, status
 * - Clickable items that trigger flyTo and selection
 *
 * Follows RetroUI neobrutalist styling patterns from HomesListCard.
 */

import { LandPlot, MapPin, Building2, ChevronRight } from "lucide-react";

export interface VacantLotListItem {
  id: string;
  address: string;
  neighborhood?: string;
  coordinates: [number, number]; // [lng, lat]
  status: "available" | "pending" | "sold" | "unknown";
  zoning?: string;
}

export interface VacantLotsListCardProps {
  lots: VacantLotListItem[];
  onLotSelect: (lot: VacantLotListItem) => void;
  status: "loading" | "complete";
}

export function VacantLotsListCard({
  lots,
  onLotSelect,
  status,
}: VacantLotsListCardProps) {
  const isLoading = status === "loading";

  // Status badge colors
  const statusColors = {
    available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    sold: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    unknown: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="vacantlotslist-loading"
        className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden animate-pulse"
      >
        {/* Header skeleton */}
        <div className="p-4 border-b-2 border-black dark:border-white bg-green-50 dark:bg-green-900/30">
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
  if (lots.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <LandPlot className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No vacant lots found matching your criteria.
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
      <div className="p-4 border-b-2 border-black dark:border-white bg-green-50 dark:bg-green-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
            <LandPlot className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">
            Found {lots.length} vacant lot{lots.length !== 1 ? "s" : ""}
          </h3>
        </div>
      </div>

      {/* Lots list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {lots.map((lot) => (
          <button
            key={lot.id}
            onClick={() => onLotSelect(lot)}
            className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Address */}
                <div className="font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {lot.address}
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {/* Zoning */}
                  {lot.zoning && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {lot.zoning}
                    </span>
                  )}

                  {/* Neighborhood */}
                  {lot.neighborhood && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lot.neighborhood}
                    </span>
                  )}

                  {/* Status badge */}
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold rounded ${statusColors[lot.status]}`}
                  >
                    {lot.status.toUpperCase()}
                  </span>
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

export default VacantLotsListCard;
