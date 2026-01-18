"use client";

/**
 * CommercialPropertiesListCard - Generative UI component for displaying commercial property search results
 *
 * Shows a condensed list of commercial properties with:
 * - Result count header
 * - Compact list items with address, type, sqft, price
 * - Clickable items that trigger flyTo and selection
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { Building2, ChevronRight, DollarSign, Square } from "lucide-react";

export interface CommercialPropertyListItem {
  id: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  propertyType?: string;
  buildingSqFt?: number;
  askingPrice?: number;
  zoning?: string;
}

export interface CommercialPropertiesListCardProps {
  properties: CommercialPropertyListItem[];
  onPropertySelect: (property: CommercialPropertyListItem) => void;
  status: "loading" | "complete";
}

export function CommercialPropertiesListCard({
  properties,
  onPropertySelect,
  status,
}: CommercialPropertiesListCardProps) {
  const isLoading = status === "loading";

  // Format property type for display
  const formatPropertyType = (type?: string): string => {
    if (!type) return "Commercial";
    return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
  };

  // Format price for display
  const formatPrice = (price?: number): string => {
    if (!price) return "Price TBD";
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="commerciallist-loading"
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
  if (properties.length === 0) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
        <div className="p-6 text-center">
          <Building2 className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">
            No commercial properties found matching your criteria.
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg border border-purple-300 dark:border-purple-700">
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100">
            Found {properties.length} commercial propert{properties.length !== 1 ? "ies" : "y"}
          </h3>
        </div>
      </div>

      {/* Properties list */}
      <div className="divide-y-2 divide-stone-200 dark:divide-stone-700">
        {properties.map((property) => (
          <button
            key={property.id}
            onClick={() => onPropertySelect(property)}
            className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Address */}
                <div className="font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {property.address}
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {/* Property Type */}
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                    {formatPropertyType(property.propertyType)}
                  </span>

                  {/* Square Footage */}
                  {property.buildingSqFt && (
                    <span className="flex items-center gap-1">
                      <Square className="w-3 h-3" />
                      {property.buildingSqFt.toLocaleString()} sqft
                    </span>
                  )}

                  {/* Price */}
                  <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                    <DollarSign className="w-3 h-3" />
                    {formatPrice(property.askingPrice)}
                  </span>
                </div>
              </div>

              {/* Chevron indicator */}
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-purple-500 transition-colors flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CommercialPropertiesListCard;
