/**
 * CopilotKit Generative UI Components
 *
 * These components provide visual representations of agent tool calls
 * in the chat interface.
 */

export { ZoneInfoCard } from "./ZoneInfoCard";
export { FormActionCard } from "./FormActionCard";
export { ParcelCard } from "./ParcelCard";
export { HomeCard } from "./HomeCard";
export { HomesListCard } from "./HomesListCard";
export { CommercialPropertyCard } from "./CommercialPropertyCard";
export { CommercialPropertiesListCard } from "./CommercialPropertiesListCard";
export { DevelopmentSiteCard } from "./DevelopmentSiteCard";
export { DevelopmentSitesListCard } from "./DevelopmentSitesListCard";

// Export props interfaces for type safety
export type { HomeCardProps } from "./HomeCard";
export type { HomeListItem, HomesListCardProps } from "./HomesListCard";
export type { CommercialPropertyCardProps } from "./CommercialPropertyCard";
export type { CommercialPropertyListItem, CommercialPropertiesListCardProps } from "./CommercialPropertiesListCard";
export type { DevelopmentSiteCardProps } from "./DevelopmentSiteCard";
export type { DevelopmentSiteListItem, DevelopmentSitesListCardProps } from "./DevelopmentSitesListCard";

// Note: CopilotActions must be imported directly from "./CopilotActions"
// to avoid SSR issues with @copilotkit/react-core
