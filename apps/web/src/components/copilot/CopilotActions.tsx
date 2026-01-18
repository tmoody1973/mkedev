"use client";

/**
 * CopilotActions - Registers generative UI renderers for agent tool calls
 *
 * This component uses CopilotKit hooks to render custom UI for backend tool calls.
 * Add this component to any page where you want generative UI to appear in the chat.
 *
 * Note: Currently used for reference/future CopilotKit Runtime integration.
 * The main chat uses our custom ChatPanel with renderCard prop instead.
 */

import { useCopilotAction } from "@copilotkit/react-core";
import { ZoneInfoCard } from "./ZoneInfoCard";
import { FormActionCard } from "./FormActionCard";
import { HomeCard } from "./HomeCard";
import { HomesListCard, type HomeListItem } from "./HomesListCard";
import { CommercialPropertyCard } from "./CommercialPropertyCard";
import { CommercialPropertiesListCard, type CommercialPropertyListItem } from "./CommercialPropertiesListCard";
import { DevelopmentSiteCard } from "./DevelopmentSiteCard";
import { DevelopmentSitesListCard, type DevelopmentSiteListItem } from "./DevelopmentSitesListCard";

interface CopilotActionsProps {
  /** Callback to fly map to coordinates */
  onFlyTo?: (coordinates: [number, number]) => void;
  /** Callback to highlight homes on map */
  onHighlightHomes?: (homeIds: string[]) => void;
  /** Callback when a home is selected from the list */
  onHomeSelect?: (home: HomeListItem) => void;
  /** Callback to highlight commercial properties on map */
  onHighlightCommercialProperties?: (propertyIds: string[]) => void;
  /** Callback when a commercial property is selected */
  onCommercialPropertySelect?: (property: CommercialPropertyListItem) => void;
  /** Callback to highlight development sites on map */
  onHighlightDevelopmentSites?: (siteIds: string[]) => void;
  /** Callback when a development site is selected */
  onDevelopmentSiteSelect?: (site: DevelopmentSiteListItem) => void;
}

export function CopilotActions({
  onFlyTo,
  onHighlightHomes,
  onHomeSelect,
  onHighlightCommercialProperties,
  onCommercialPropertySelect,
  onHighlightDevelopmentSites,
  onDevelopmentSiteSelect,
}: CopilotActionsProps = {}) {
  // Render zoning query results as a ZoneInfoCard
  useCopilotAction({
    name: "query_zoning_at_point",
    available: "disabled", // Render-only, don't allow frontend to call this
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <ZoneInfoCard
            zoningDistrict="..."
            status={status}
          />
        );
      }

      if (status === "complete" && result?.success) {
        return (
          <ZoneInfoCard
            zoningDistrict={result.zoningDistrict || "Unknown"}
            zoningDescription={result.zoningDescription}
            zoningCategory={result.zoningCategory}
            overlayZones={result.overlayZones}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render parking calculation results
  useCopilotAction({
    name: "calculate_parking",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-black dark:border-white rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse">
            <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-32" />
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Required Parking
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {result.requiredSpaces} spaces
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
              {result.calculation}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {result.codeReference}
            </p>
            {result.isReducedDistrict && (
              <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded text-xs text-amber-800 dark:text-amber-200">
                Reduced parking district - lower requirements apply
              </div>
            )}
          </div>
        );
      }

      return <></>;
    },
  });

  // Render form recommendations
  useCopilotAction({
    name: "recommend_form",
    available: "disabled",
    render: ({ status, args, result }) => {
      if (status === "inProgress" || status === "executing") {
        return <FormActionCard formName="Loading..." status={status} />;
      }

      if (status === "complete" && result) {
        return (
          <FormActionCard
            formName={result.formName || args?.formName || "Application Form"}
            formNumber={result.formNumber}
            description={result.description}
            downloadUrl={result.downloadUrl}
            infoUrl={result.infoUrl}
            deadline={result.deadline}
            requiredFor={result.requiredFor}
            steps={result.steps}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render geocode results with a mini map indicator
  useCopilotAction({
    name: "geocode_address",
    available: "disabled",
    render: ({ status, args, result }) => {
      if (status === "complete" && result?.success) {
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-full text-sm border border-stone-200 dark:border-stone-700">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            <span className="text-stone-700 dark:text-stone-300">
              {result.formattedAddress || args?.address}
            </span>
          </div>
        );
      }
      return <></>;
    },
  });

  // Render area plan query results
  useCopilotAction({
    name: "query_area_plans",
    available: "disabled",
    render: ({ status }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-lg bg-sky-50 dark:bg-sky-900/20">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Searching neighborhood plans...</span>
            </div>
          </div>
        );
      }
      return <></>;
    },
  });

  // Render zoning code query (RAG) results
  useCopilotAction({
    name: "query_zoning_code",
    available: "disabled",
    render: ({ status }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="p-3 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Searching zoning code...</span>
            </div>
          </div>
        );
      }
      return <></>;
    },
  });

  // ==========================================================================
  // Home Tools - Homes MKE Integration
  // ==========================================================================

  // Render search_homes_for_sale results as HomesListCard
  useCopilotAction({
    name: "search_homes_for_sale",
    available: "disabled", // Render-only, backend executes
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <HomesListCard
            homes={[]}
            onHomeSelect={() => {}}
            status="loading"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          homes?: Array<{
            homeId: string;
            address: string;
            neighborhood: string;
            coordinates?: [number, number];
            bedrooms: number;
            fullBaths: number;
            halfBaths: number;
          }>;
        };

        // Convert to HomeListItem format
        const homes: HomeListItem[] = (resultData.homes || []).map((h) => ({
          id: h.homeId,
          address: h.address,
          neighborhood: h.neighborhood,
          coordinates: h.coordinates || [-87.9065, 43.0389], // Default to Milwaukee center
          bedrooms: h.bedrooms,
          fullBaths: h.fullBaths,
          halfBaths: h.halfBaths,
        }));

        // Trigger map highlighting when results arrive
        if (onHighlightHomes && homes.length > 0) {
          const homeIds = homes.map((h) => h.id);
          onHighlightHomes(homeIds);
        }

        // Handler for home selection from list
        const handleHomeSelect = (home: HomeListItem) => {
          // Fly to the selected home
          if (onFlyTo) {
            onFlyTo(home.coordinates);
          }
          // Highlight just this home
          if (onHighlightHomes) {
            onHighlightHomes([home.id]);
          }
          // Notify parent
          if (onHomeSelect) {
            onHomeSelect(home);
          }
        };

        return (
          <HomesListCard
            homes={homes}
            onHomeSelect={handleHomeSelect}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render get_home_details results as HomeCard
  useCopilotAction({
    name: "get_home_details",
    available: "disabled", // Render-only, backend executes
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <HomeCard
            address="Loading..."
            status="inProgress"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          home?: {
            homeId: string;
            address: string;
            neighborhood: string;
            coordinates: [number, number];
            bedrooms: number;
            fullBaths: number;
            halfBaths: number;
            buildingSqFt: number;
            yearBuilt: number;
            narrative?: string;
            listingUrl?: string;
            primaryImageUrl?: string;
            imageUrls?: string[];
          };
        };

        if (!resultData.home) {
          return <></>;
        }

        const home = resultData.home;

        // Handler for fly to location
        const handleFlyTo = (coordinates: [number, number]) => {
          if (onFlyTo) {
            onFlyTo(coordinates);
          }
          // Also highlight this home on the map
          if (onHighlightHomes) {
            onHighlightHomes([home.homeId]);
          }
        };

        return (
          <HomeCard
            address={home.address}
            neighborhood={home.neighborhood}
            coordinates={home.coordinates}
            bedrooms={home.bedrooms}
            fullBaths={home.fullBaths}
            halfBaths={home.halfBaths}
            buildingSqFt={home.buildingSqFt}
            yearBuilt={home.yearBuilt}
            narrative={home.narrative}
            listingUrl={home.listingUrl}
            primaryImageUrl={home.primaryImageUrl}
            imageUrls={home.imageUrls}
            status="complete"
            onFlyTo={handleFlyTo}
          />
        );
      }

      return <></>;
    },
  });

  // ==========================================================================
  // Commercial Properties Tools
  // ==========================================================================

  // Render search_commercial_properties results as CommercialPropertiesListCard
  useCopilotAction({
    name: "search_commercial_properties",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <CommercialPropertiesListCard
            properties={[]}
            onPropertySelect={() => {}}
            status="loading"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          properties?: Array<{
            propertyId: string;
            address: string;
            coordinates?: [number, number];
            propertyType?: string;
            buildingSqFt?: number;
            askingPrice?: number;
            zoning?: string;
          }>;
        };

        // Convert to CommercialPropertyListItem format
        const properties: CommercialPropertyListItem[] = (resultData.properties || []).map((p) => ({
          id: p.propertyId,
          address: p.address,
          coordinates: p.coordinates || [-87.9065, 43.0389],
          propertyType: p.propertyType,
          buildingSqFt: p.buildingSqFt,
          askingPrice: p.askingPrice,
          zoning: p.zoning,
        }));

        // Trigger map highlighting when results arrive
        if (onHighlightCommercialProperties && properties.length > 0) {
          const propertyIds = properties.map((p) => p.id);
          onHighlightCommercialProperties(propertyIds);
        }

        // Handler for property selection from list
        const handlePropertySelect = (property: CommercialPropertyListItem) => {
          if (onFlyTo) {
            onFlyTo(property.coordinates);
          }
          if (onHighlightCommercialProperties) {
            onHighlightCommercialProperties([property.id]);
          }
          if (onCommercialPropertySelect) {
            onCommercialPropertySelect(property);
          }
        };

        return (
          <CommercialPropertiesListCard
            properties={properties}
            onPropertySelect={handlePropertySelect}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render get_commercial_property_details results as CommercialPropertyCard
  useCopilotAction({
    name: "get_commercial_property_details",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <CommercialPropertyCard
            address="Loading..."
            status="inProgress"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          property?: {
            propertyId: string;
            address: string;
            coordinates: [number, number];
            propertyType?: string;
            buildingSqFt?: number;
            lotSizeSqFt?: number;
            zoning?: string;
            askingPrice?: number;
            pricePerSqFt?: number;
            contactInfo?: string;
            listingUrl?: string;
            description?: string;
          };
        };

        if (!resultData.property) {
          return <></>;
        }

        const property = resultData.property;

        const handleFlyTo = (coordinates: [number, number]) => {
          if (onFlyTo) {
            onFlyTo(coordinates);
          }
          if (onHighlightCommercialProperties) {
            onHighlightCommercialProperties([property.propertyId]);
          }
        };

        return (
          <CommercialPropertyCard
            address={property.address}
            coordinates={property.coordinates}
            propertyType={property.propertyType}
            buildingSqFt={property.buildingSqFt}
            lotSizeSqFt={property.lotSizeSqFt}
            zoning={property.zoning}
            askingPrice={property.askingPrice}
            pricePerSqFt={property.pricePerSqFt}
            contactInfo={property.contactInfo}
            listingUrl={property.listingUrl}
            description={property.description}
            status="complete"
            onFlyTo={handleFlyTo}
          />
        );
      }

      return <></>;
    },
  });

  // ==========================================================================
  // Development Sites Tools
  // ==========================================================================

  // Render search_development_sites results as DevelopmentSitesListCard
  useCopilotAction({
    name: "search_development_sites",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <DevelopmentSitesListCard
            sites={[]}
            onSiteSelect={() => {}}
            status="loading"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          sites?: Array<{
            siteId: string;
            address: string;
            coordinates?: [number, number];
            siteName?: string;
            lotSizeSqFt?: number;
            askingPrice?: number;
            zoning?: string;
            incentives?: string[];
          }>;
        };

        // Convert to DevelopmentSiteListItem format
        const sites: DevelopmentSiteListItem[] = (resultData.sites || []).map((s) => ({
          id: s.siteId,
          address: s.address,
          coordinates: s.coordinates || [-87.9065, 43.0389],
          siteName: s.siteName,
          lotSizeSqFt: s.lotSizeSqFt,
          askingPrice: s.askingPrice,
          zoning: s.zoning,
          incentives: s.incentives,
        }));

        // Trigger map highlighting when results arrive
        if (onHighlightDevelopmentSites && sites.length > 0) {
          const siteIds = sites.map((s) => s.id);
          onHighlightDevelopmentSites(siteIds);
        }

        // Handler for site selection from list
        const handleSiteSelect = (site: DevelopmentSiteListItem) => {
          if (onFlyTo) {
            onFlyTo(site.coordinates);
          }
          if (onHighlightDevelopmentSites) {
            onHighlightDevelopmentSites([site.id]);
          }
          if (onDevelopmentSiteSelect) {
            onDevelopmentSiteSelect(site);
          }
        };

        return (
          <DevelopmentSitesListCard
            sites={sites}
            onSiteSelect={handleSiteSelect}
            status="complete"
          />
        );
      }

      return <></>;
    },
  });

  // Render get_development_site_details results as DevelopmentSiteCard
  useCopilotAction({
    name: "get_development_site_details",
    available: "disabled",
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <DevelopmentSiteCard
            address="Loading..."
            status="inProgress"
          />
        );
      }

      if (status === "complete" && result?.success) {
        const resultData = result as {
          success: boolean;
          site?: {
            siteId: string;
            address: string;
            coordinates: [number, number];
            siteName?: string;
            lotSizeSqFt?: number;
            zoning?: string;
            currentUse?: string;
            proposedUse?: string;
            askingPrice?: number;
            incentives?: string[];
            contactInfo?: string;
            listingUrl?: string;
            description?: string;
          };
        };

        if (!resultData.site) {
          return <></>;
        }

        const site = resultData.site;

        const handleFlyTo = (coordinates: [number, number]) => {
          if (onFlyTo) {
            onFlyTo(coordinates);
          }
          if (onHighlightDevelopmentSites) {
            onHighlightDevelopmentSites([site.siteId]);
          }
        };

        return (
          <DevelopmentSiteCard
            address={site.address}
            coordinates={site.coordinates}
            siteName={site.siteName}
            zoning={site.zoning}
            lotSizeSqFt={site.lotSizeSqFt}
            askingPrice={site.askingPrice}
            currentUse={site.currentUse}
            proposedUse={site.proposedUse}
            incentives={site.incentives}
            contactInfo={site.contactInfo}
            listingUrl={site.listingUrl}
            description={site.description}
            status="complete"
            onFlyTo={handleFlyTo}
          />
        );
      }

      return <></>;
    },
  });

  return null; // This component only registers hooks, doesn't render anything itself
}

export default CopilotActions;
