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

// Export props interfaces for type safety
export type { HomeCardProps } from "./HomeCard";
export type { HomeListItem, HomesListCardProps } from "./HomesListCard";

// Note: CopilotActions must be imported directly from "./CopilotActions"
// to avoid SSR issues with @copilotkit/react-core
