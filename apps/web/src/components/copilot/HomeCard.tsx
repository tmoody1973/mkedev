"use client";

/**
 * HomeCard - Generative UI component for displaying home listing details
 *
 * Displays property information from the Homes MKE ESRI FeatureServer including:
 * - Address and neighborhood
 * - Bedrooms, bathrooms, square footage, year built
 * - Property narrative/description
 * - Actions: View Listing (external URL), Fly to Location (map)
 *
 * Follows RetroUI neobrutalist styling patterns from ParcelCard and ZoneInfoCard.
 */

import { Home, MapPin, BedDouble, Bath, Square, Calendar, ExternalLink, Navigation } from "lucide-react";

export interface HomeCardProps {
  // Location
  address: string;
  neighborhood?: string;
  coordinates?: [number, number]; // [lng, lat]

  // Property details
  bedrooms?: number;
  fullBaths?: number;
  halfBaths?: number;
  buildingSqFt?: number;
  yearBuilt?: number;

  // Listing info
  narrative?: string;
  listingUrl?: string;

  // Images
  primaryImageUrl?: string;
  imageUrls?: string[];

  // Loading state
  status?: "inProgress" | "executing" | "complete";

  // Actions
  onFlyTo?: (coordinates: [number, number]) => void;
}

export function HomeCard({
  address,
  neighborhood,
  coordinates,
  bedrooms,
  fullBaths = 0,
  halfBaths = 0,
  buildingSqFt,
  yearBuilt,
  narrative,
  listingUrl,
  primaryImageUrl,
  imageUrls,
  status = "complete",
  onFlyTo,
}: HomeCardProps) {
  const isLoading = status === "inProgress" || status === "executing";

  // Calculate total baths (full + half * 0.5)
  const totalBaths = fullBaths + halfBaths * 0.5;

  // Format square footage with commas
  const formattedSqFt = buildingSqFt
    ? buildingSqFt.toLocaleString("en-US")
    : undefined;

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
        data-testid="homecard-loading"
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

        {/* Property details skeleton */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-stone-300 dark:bg-stone-600 rounded mb-1" />
              <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>

        {/* Narrative skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-full" />
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-5/6" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-3 border-t border-stone-300 dark:border-stone-600">
          <div className="h-10 bg-stone-300 dark:bg-stone-600 rounded flex-1" />
          <div className="h-10 bg-stone-300 dark:bg-stone-600 rounded flex-1" />
        </div>
      </div>
    );
  }

  // Image count for badge
  const imageCount = imageUrls?.length || 0;

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Primary Image */}
      {primaryImageUrl && (
        <div className="relative h-48 bg-stone-200 dark:bg-stone-700 overflow-hidden">
          <img
            src={primaryImageUrl}
            alt={`${address} exterior`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Image count badge */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
              +{imageCount - 1} photos
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg border border-sky-300 dark:border-sky-700">
            <Home className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
              {address}
            </h3>
            {neighborhood && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  {neighborhood}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b-2 border-black dark:border-white">
        {/* Bedrooms */}
        {bedrooms !== undefined && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BedDouble className="w-4 h-4 text-sky-500" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {bedrooms}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              beds
            </span>
          </div>
        )}

        {/* Bathrooms */}
        {totalBaths > 0 && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Bath className="w-4 h-4 text-sky-500" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {totalBaths % 1 === 0 ? totalBaths : totalBaths.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              baths
            </span>
          </div>
        )}

        {/* Square Footage */}
        {formattedSqFt && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Square className="w-4 h-4 text-sky-500" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {formattedSqFt}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              sqft
            </span>
          </div>
        )}

        {/* Year Built */}
        {yearBuilt && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {yearBuilt}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              built
            </span>
          </div>
        )}
      </div>

      {/* Narrative / Description */}
      {narrative && (
        <div className="p-4 border-b-2 border-black dark:border-white">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {narrative}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 p-4 bg-stone-50 dark:bg-stone-800">
        {listingUrl && (
          <button
            onClick={handleViewListing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
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

export default HomeCard;
