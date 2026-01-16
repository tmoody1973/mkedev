"use client";

/**
 * HomesListCard - Generative UI component for displaying multiple home search results
 *
 * Shows a condensed list of homes for sale with:
 * - Result count header
 * - Compact list items with address, beds/baths, neighborhood
 * - Clickable items that trigger flyTo and selection
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { Home, MapPin, ChevronRight } from "lucide-react";

export interface HomeListItem {
  id: string;
  address: string;
  neighborhood: string;
  coordinates: [number, number]; // [lng, lat]
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
}

export interface HomesListCardProps {
  homes: HomeListItem[];
  onHomeSelect: (home: HomeListItem) => void;
  status: "loading" | "complete";
}

export function HomesListCard({
  homes,
  onHomeSelect,
  status,
}: HomesListCardProps) {
  const isLoading = status === "loading";

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="homeslist-loading"
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
  if (homes.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <Home className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No homes found matching your criteria.
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
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg border border-sky-300 dark:border-sky-700">
            <Home className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">
            Found {homes.length} home{homes.length !== 1 ? "s" : ""} for sale
          </h3>
        </div>
      </div>

      {/* Homes list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {homes.map((home) => {
          const totalBaths = home.fullBaths + home.halfBaths * 0.5;
          const bathsDisplay =
            totalBaths % 1 === 0 ? totalBaths : totalBaths.toFixed(1);

          return (
            <button
              key={home.id}
              onClick={() => onHomeSelect(home)}
              className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* Address */}
                  <div className="font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {home.address}
                  </div>

                  {/* Details row */}
                  <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {/* Beds/Baths */}
                    <span>
                      {home.bedrooms} bed{home.bedrooms !== 1 ? "s" : ""} /{" "}
                      {bathsDisplay} bath
                      {totalBaths !== 1 ? "s" : ""}
                    </span>

                    {/* Neighborhood */}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {home.neighborhood}
                    </span>
                  </div>
                </div>

                {/* Chevron indicator */}
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-sky-500 transition-colors flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HomesListCard;
