"use client";

/**
 * ZoneInfoCard - Generative UI component for displaying zoning information
 *
 * Renders a visual card showing zoning district details, overlays, and key requirements.
 * Used as a Generative UI component in the CopilotKit chat interface.
 */

import { MapPin, Building2, CarFront, Ruler, Layers } from "lucide-react";

interface ZoneInfoCardProps {
  address?: string;
  zoningDistrict: string;
  zoningDescription?: string;
  zoningCategory?: string;
  overlayZones?: string[];
  parkingRatio?: string;
  heightLimit?: string;
  setbacks?: {
    front?: string;
    side?: string;
    rear?: string;
  };
  status?: "inProgress" | "executing" | "complete";
}

export function ZoneInfoCard({
  address,
  zoningDistrict,
  zoningDescription,
  zoningCategory,
  overlayZones = [],
  parkingRatio,
  heightLimit,
  setbacks,
  status = "complete",
}: ZoneInfoCardProps) {
  const isLoading = status === "inProgress" || status === "executing";

  if (isLoading) {
    return (
      <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-sky-500" />
          <div className="h-5 bg-stone-300 dark:bg-stone-600 rounded w-48" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-32" />
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
      {/* Header */}
      {address && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-200 dark:border-stone-700">
          <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0" />
          <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
            {address}
          </span>
        </div>
      )}

      {/* Zoning District Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="px-3 py-1.5 bg-sky-500 text-white font-bold text-lg rounded border-2 border-black dark:border-white">
          {zoningDistrict}
        </div>
        {zoningCategory && (
          <span className="text-sm text-stone-600 dark:text-stone-400 capitalize">
            {zoningCategory.toLowerCase()}
          </span>
        )}
      </div>

      {/* Description */}
      {zoningDescription && (
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
          {zoningDescription}
        </p>
      )}

      {/* Key Requirements Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {heightLimit && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-stone-600 dark:text-stone-400">Height:</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {heightLimit}
            </span>
          </div>
        )}
        {parkingRatio && (
          <div className="flex items-center gap-2 text-sm">
            <CarFront className="w-4 h-4 text-amber-500" />
            <span className="text-stone-600 dark:text-stone-400">Parking:</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {parkingRatio}
            </span>
          </div>
        )}
      </div>

      {/* Setbacks */}
      {setbacks && (setbacks.front || setbacks.side || setbacks.rear) && (
        <div className="flex items-start gap-2 text-sm mb-4">
          <Ruler className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <span className="text-stone-600 dark:text-stone-400">Setbacks: </span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {[
                setbacks.front && `Front ${setbacks.front}`,
                setbacks.side && `Side ${setbacks.side}`,
                setbacks.rear && `Rear ${setbacks.rear}`,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Overlay Zones */}
      {overlayZones.length > 0 && (
        <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Overlay Zones
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overlayZones.map((zone, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded border border-amber-300 dark:border-amber-700"
              >
                {zone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ZoneInfoCard;
