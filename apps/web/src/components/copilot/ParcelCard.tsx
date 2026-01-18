"use client";

/**
 * ParcelCard - Rich property analysis card with Street View images
 *
 * Adapted for Milwaukee data sources:
 * - Zoning Agent tool results (geocode, zoning query, area plans)
 * - Milwaukee ESRI parcel services
 * - Google Street View Static API
 *
 * Tabs:
 * - Overview: Address, coordinates, neighborhood
 * - Zoning: District, category, overlays, what's allowed
 * - Area Plans: Neighborhood development context
 * - Development: Height, setbacks, parking requirements
 */

import { useState } from "react";
import { MapPin, Navigation, Copy, ExternalLink, ChevronLeft, ChevronRight, Building2, FileText, Compass, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

// Google Street View Static API
const STREET_VIEW_BASE = "https://maps.googleapis.com/maps/api/streetview";

interface ParcelCardProps {
  // Basic Info
  address: string;
  neighborhood?: string;
  coordinates?: { latitude: number; longitude: number };

  // Zoning Data (from query_zoning_at_point)
  zoningDistrict?: string;
  zoningCategory?: string;
  zoningType?: string;
  zoningDescription?: string;
  overlayZones?: string[];

  // Area Plan Context (from query_area_plans)
  areaPlanName?: string;
  areaPlanContext?: string;
  developmentGoals?: string[];

  // Development Standards (from query_zoning_code or calculated)
  maxHeight?: string;
  minSetbacks?: string;
  parkingRequired?: string;
  permittedUses?: string[];

  // Loading state
  status?: "inProgress" | "executing" | "complete";

  // Actions
  onOpenStreetView?: (coordinates: { latitude: number; longitude: number }, address: string) => void;
}

type TabType = "overview" | "zoning" | "area-plans" | "development";

export function ParcelCard({
  address,
  neighborhood,
  coordinates,
  zoningDistrict,
  zoningCategory,
  zoningType,
  zoningDescription,
  overlayZones = [],
  areaPlanName,
  areaPlanContext,
  developmentGoals = [],
  maxHeight,
  minSetbacks,
  parkingRequired,
  permittedUses = [],
  status = "complete",
  onOpenStreetView,
}: ParcelCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [streetViewHeading, setStreetViewHeading] = useState(0);

  const isLoading = status === "inProgress" || status === "executing";

  // Get Google Maps API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Build Street View URL
  const getStreetViewUrl = (heading: number, size = "400x200") => {
    if (!apiKey) return null;
    const location = coordinates
      ? `${coordinates.latitude},${coordinates.longitude}`
      : `${address}, Milwaukee, WI`;
    return `${STREET_VIEW_BASE}?size=${size}&location=${encodeURIComponent(location)}&heading=${heading}&pitch=0&fov=90&key=${apiKey}`;
  };

  // Navigate street view
  const rotateStreetView = (direction: "left" | "right") => {
    setStreetViewHeading((prev) => {
      const delta = direction === "right" ? 90 : -90;
      return (prev + delta + 360) % 360;
    });
  };

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(`${address}, Milwaukee, WI`);
  };

  // Open in Google Maps
  const openInMaps = () => {
    const query = coordinates
      ? `${coordinates.latitude},${coordinates.longitude}`
      : encodeURIComponent(`${address}, Milwaukee, WI`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  // Open Milwaukee city property search
  const openCityRecords = () => {
    window.open("https://assessments.milwaukee.gov/", "_blank");
  };

  if (isLoading) {
    return (
      <div className="border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse overflow-hidden">
        <div className="h-40 bg-stone-300 dark:bg-stone-600" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-stone-300 dark:bg-stone-600 rounded w-3/4" />
          <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: typeof Building2 }[] = [
    { id: "overview", label: "Overview", icon: MapPin },
    { id: "zoning", label: "Zoning", icon: Building2 },
    { id: "area-plans", label: "Area Plans", icon: FileText },
    { id: "development", label: "Development", icon: Compass },
  ];

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg border border-sky-300 dark:border-sky-700">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
              {address}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {zoningDistrict && (
                <span className="px-2 py-0.5 text-xs font-mono bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded border border-sky-300 dark:border-sky-700">
                  {zoningDistrict}
                </span>
              )}
              {zoningCategory && (
                <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
                  {zoningCategory}
                </span>
              )}
              {overlayZones.map((zone, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs font-mono bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700"
                >
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Street View */}
      {apiKey ? (
        <div className="relative bg-stone-200 dark:bg-stone-700">
          <div className="flex h-40">
            <div className="w-1/2 relative">
              <img
                src={getStreetViewUrl(streetViewHeading) || ""}
                alt={`Street view of ${address}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-1/2 relative">
              <img
                src={getStreetViewUrl((streetViewHeading + 90) % 360) || ""}
                alt={`Street view - alternate angle`}
                className="w-full h-full object-cover"
              />
              {/* Nav arrows */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={() => rotateStreetView("left")}
                  className="w-7 h-7 bg-white/90 dark:bg-stone-800/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => rotateStreetView("right")}
                  className="w-7 h-7 bg-white/90 dark:bg-stone-800/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Street View
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-3 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        {coordinates && onOpenStreetView && (
          <button
            onClick={() => onOpenStreetView(coordinates, address)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border-2 border-black dark:border-white bg-sky-500 hover:bg-sky-600 text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Street View
          </button>
        )}
        <button
          onClick={openInMaps}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border-2 border-black dark:border-white bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Directions
        </button>
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border-2 border-black dark:border-white bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        <button
          onClick={openCityRecords}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border-2 border-black dark:border-white bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          City Records
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black dark:border-white overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-r-2 border-black dark:border-white last:border-r-0 transition-colors",
                activeTab === tab.id
                  ? "bg-sky-500 text-white"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "overview" && (
          <div className="space-y-0">
            <DetailRow label="Address" value={address} />
            <DetailRow label="City" value="Milwaukee, WI" />
            {neighborhood && <DetailRow label="Neighborhood" value={neighborhood} />}
            {coordinates && (
              <DetailRow
                label="Coordinates"
                value={`${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`}
              />
            )}
          </div>
        )}

        {activeTab === "zoning" && (
          <div className="space-y-3">
            <div className="space-y-0">
              <DetailRow label="District Code" value={zoningDistrict} />
              <DetailRow label="Category" value={zoningCategory} />
              <DetailRow label="Type" value={zoningType} />
              {overlayZones.length > 0 && (
                <DetailRow label="Overlay Zones" value={overlayZones.join(", ")} />
              )}
            </div>
            {zoningDescription && (
              <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-800 rounded text-sm text-stone-600 dark:text-stone-300">
                {zoningDescription}
              </div>
            )}
          </div>
        )}

        {activeTab === "area-plans" && (
          <div className="max-h-48 overflow-y-auto space-y-3">
            {areaPlanName ? (
              <>
                <div className="font-medium text-stone-900 dark:text-stone-100 sticky top-0 bg-white dark:bg-stone-900 pb-1">
                  {areaPlanName}
                </div>
                {areaPlanContext && (
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {areaPlanContext}
                  </p>
                )}
                {developmentGoals.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Development Goals
                    </span>
                    <ul className="mt-2 space-y-1">
                      {developmentGoals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center">
                No area plan data available for this location.
                <br />
                <span className="text-xs">Try asking about neighborhood development goals.</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "development" && (
          <div className="space-y-3">
            <div className="space-y-0">
              <DetailRow label="Max Height" value={maxHeight} />
              <DetailRow label="Setbacks" value={minSetbacks} />
              <DetailRow label="Parking Required" value={parkingRequired} />
            </div>
            {permittedUses.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Permitted Uses
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {permittedUses.map((use, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!maxHeight && !minSetbacks && !parkingRequired && permittedUses.length === 0 && (
              <div className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center">
                Ask about specific development standards for this property.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-b-0">
      <span className="text-stone-500 dark:text-stone-400 text-sm">{label}</span>
      <span className="text-stone-900 dark:text-stone-100 text-sm font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

export default ParcelCard;
