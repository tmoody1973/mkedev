/**
 * Zoning Interpreter Agent Tools
 *
 * Export all tools used by the Zoning Interpreter Agent.
 */

export { geocodeAddressTool, geocodeAddress, type GeocodeResult } from './geocode.js';
export { queryZoningTool, queryZoningAtPoint, type ZoningResult } from './zoning.js';
export { calculateParkingTool, calculateParking, type ParkingResult } from './parking.js';
export { queryRAGTool, queryRAG, type RAGQueryResult } from './rag.js';

// All tools array for agent configuration
import { geocodeAddressTool } from './geocode.js';
import { queryZoningTool } from './zoning.js';
import { calculateParkingTool } from './parking.js';
import { queryRAGTool } from './rag.js';

export const zoningTools = [
  geocodeAddressTool,
  queryZoningTool,
  calculateParkingTool,
  queryRAGTool,
];
