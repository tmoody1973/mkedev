"use client";

/**
 * VacantLotCard - Generative UI component for displaying vacant lot details
 *
 * Displays city-owned vacant lot information from Strong Neighborhoods ESRI including:
 * - Address and neighborhood
 * - Zoning, property type, disposition status
 * - Aldermanic district, acquisition date, current owner
 * - Google Static Street View image
 * - Actions: Fly to Location, Open Street View, Visualize Potential
 *
 * Follows RetroUI neobrutalist styling patterns from HomeCard and ParcelCard.
 */

import {
  LandPlot,
  MapPin,
  Building2,
  FileText,
  User,
  Calendar,
  Hash,
  Navigation,
  Eye,
  Sparkles,
} from "lucide-react";

export interface VacantLotCardProps {
  // Identification
  lotId: string;
  taxKey?: string;

  // Location
  address: string;
  neighborhood?: string;
  aldermanicDistrict?: number;
  coordinates?: [number, number]; // [lng, lat]

  // Property details
  zoning?: string;
  propertyType?: string;
  lotSizeSqFt?: number;

  // Disposition info
  dispositionStatus?: string;
  dispositionStrategy?: string;
  acquisitionDate?: string;
  currentOwner?: string;

  // Status
  status?: "available" | "pending" | "sold" | "unknown";

  // Loading state
  cardStatus?: "inProgress" | "executing" | "complete";

  // Actions
  onFlyTo?: (coordinates: [number, number]) => void;
  onOpenStreetView?: (coordinates: [number, number], address: string) => void;
  onVisualize?: (lotId: string, coordinates: [number, number]) => void;
}

export function VacantLotCard({
  lotId,
  taxKey,
  address,
  neighborhood,
  aldermanicDistrict,
  coordinates,
  zoning,
  propertyType,
  lotSizeSqFt,
  dispositionStatus,
  dispositionStrategy,
  acquisitionDate,
  currentOwner,
  status = "unknown",
  cardStatus = "complete",
  onFlyTo,
  onOpenStreetView,
  onVisualize,
}: VacantLotCardProps) {
  const isLoading = cardStatus === "inProgress" || cardStatus === "executing";

  // Format lot size with commas
  const formattedLotSize = lotSizeSqFt
    ? lotSizeSqFt.toLocaleString("en-US")
    : undefined;

  // Google Static Street View URL
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const streetViewUrl = coordinates && googleApiKey
    ? `https://maps.googleapis.com/maps/api/streetview?size=600x400&fov=90&location=${coordinates[1]},${coordinates[0]}&key=${googleApiKey}`
    : null;

  // Handle Fly to Location click
  const handleFlyTo = () => {
    if (coordinates && onFlyTo) {
      onFlyTo(coordinates);
    }
  };

  // Handle Open Street View click
  const handleOpenStreetView = () => {
    if (coordinates && onOpenStreetView) {
      onOpenStreetView(coordinates, address);
    }
  };

  // Handle Visualize click
  const handleVisualize = () => {
    if (coordinates && onVisualize) {
      onVisualize(lotId, coordinates);
    }
  };

  // Status badge color
  const statusColor = {
    available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    sold: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    unknown: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  };

  // Loading state skeleton UI
  if (isLoading) {
    return (
      <div
        data-testid="vacantlotcard-loading"
        className="p-4 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse"
      >
        {/* Image skeleton */}
        <div className="h-48 bg-stone-300 dark:bg-stone-600 rounded-lg mb-4" />

        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-stone-300 dark:bg-stone-600 rounded-lg" />
          <div className="flex-1">
            <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-2" />
            <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-1/2" />
          </div>
        </div>

        {/* Property details skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-2 bg-stone-200 dark:bg-stone-700 rounded">
              <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-1/2 mb-2" />
              <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-3/4" />
            </div>
          ))}
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
      {/* Street View Image */}
      {streetViewUrl && (
        <div className="relative h-48 bg-stone-200 dark:bg-stone-700 overflow-hidden">
          <img
            src={streetViewUrl}
            alt={`Street view of ${address}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${statusColor[status]}`}
            >
              {dispositionStatus || status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-green-50 dark:bg-green-900/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
            <LandPlot className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
              {address}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {neighborhood && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {neighborhood}
                  </span>
                </div>
              )}
              {aldermanicDistrict && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                  District {aldermanicDistrict}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b-2 border-black dark:border-white">
        {/* Zoning */}
        {zoning && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                Zoning
              </span>
            </div>
            <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {zoning}
            </p>
          </div>
        )}

        {/* Property Type */}
        {propertyType && (
          <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-stone-500 dark:text-stone-400" />
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                Type
              </span>
            </div>
            <p className="text-sm text-stone-900 dark:text-stone-100 capitalize">
              {propertyType}
            </p>
          </div>
        )}

        {/* Lot Size */}
        {formattedLotSize && (
          <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-1 mb-1">
              <LandPlot className="w-3 h-3 text-stone-500 dark:text-stone-400" />
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                Lot Size
              </span>
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {formattedLotSize} sqft
            </p>
          </div>
        )}

        {/* Tax Key */}
        {taxKey && (
          <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-1 mb-1">
              <Hash className="w-3 h-3 text-stone-500 dark:text-stone-400" />
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                Tax Key
              </span>
            </div>
            <p className="font-mono text-sm text-stone-900 dark:text-stone-100">
              {taxKey}
            </p>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {(dispositionStrategy || acquisitionDate || currentOwner) && (
        <div className="px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex flex-wrap gap-3 text-sm">
            {dispositionStrategy && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <FileText className="w-4 h-4 text-stone-500" />
                <span>{dispositionStrategy}</span>
              </div>
            )}
            {acquisitionDate && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Acquired: {acquisitionDate}</span>
              </div>
            )}
            {currentOwner && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                <User className="w-4 h-4 text-stone-500" />
                <span>{currentOwner}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 p-4 bg-stone-50 dark:bg-stone-800">
        {coordinates && onOpenStreetView && (
          <button
            onClick={handleOpenStreetView}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <Eye className="w-4 h-4" />
            Street View
          </button>
        )}
        {coordinates && onVisualize && (
          <button
            onClick={handleVisualize}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm rounded border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_black] dark:hover:shadow-[3px_3px_0_0_white] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_black] dark:active:shadow-[1px_1px_0_0_white] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Visualize
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

export default VacantLotCard;
