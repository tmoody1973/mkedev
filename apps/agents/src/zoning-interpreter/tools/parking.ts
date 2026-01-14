/**
 * Calculate Parking Tool
 *
 * Calculates required parking spaces based on Milwaukee Zoning Code
 * Section 295-403 requirements.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Districts with reduced parking requirements (downtown districts)
 */
const REDUCED_PARKING_DISTRICTS = [
  'DC',   // Downtown Core
  'DL1',  // Downtown Living 1
  'DL2',  // Downtown Living 2
  'DL3',  // Downtown Living 3
  'DL4',  // Downtown Living 4
  'DR1',  // Downtown Retail 1
  'DR2',  // Downtown Retail 2
];

/**
 * Parking ratios by use type
 * Format: sqft per space (e.g., 100 means 1 space per 100 sqft)
 */
const PARKING_RATIOS: Record<string, { standard: number; reduced: number; min: number }> = {
  restaurant: { standard: 100, reduced: 400, min: 0 },
  retail: { standard: 300, reduced: 600, min: 3 },
  office: { standard: 400, reduced: 1000, min: 3 },
  medical: { standard: 200, reduced: 400, min: 5 },
  industrial: { standard: 1000, reduced: 1000, min: 3 },
  warehouse: { standard: 2000, reduced: 2000, min: 2 },
  assembly: { standard: 50, reduced: 100, min: 10 }, // per seat, not sqft
  residential: { standard: 1, reduced: 0.5, min: 0 }, // per unit
};

/**
 * Result type for parking calculations
 */
export interface ParkingResult {
  requiredSpaces: number;
  ratio: string;
  isReducedDistrict: boolean;
  zoningDistrict: string;
  useType: string;
  calculation: string;
  notes: string;
  codeReference: string;
}

/**
 * Calculate required parking spaces.
 */
async function calculateParking(params: {
  useType: string;
  grossFloorArea: number;
  zoningDistrict: string;
  seatingCapacity?: number;
  units?: number;
}): Promise<ParkingResult> {
  const { useType, grossFloorArea, zoningDistrict, seatingCapacity, units } = params;

  const useTypeLower = useType.toLowerCase();
  const isReducedDistrict = REDUCED_PARKING_DISTRICTS.includes(zoningDistrict.toUpperCase());

  // Get ratio config for this use type
  const ratioConfig = PARKING_RATIOS[useTypeLower] || PARKING_RATIOS.retail;
  const ratio = isReducedDistrict ? ratioConfig.reduced : ratioConfig.standard;

  let requiredSpaces: number;
  let calculation: string;
  let ratioString: string;

  // Special handling for residential (per unit)
  if (useTypeLower === 'residential' && units !== undefined) {
    requiredSpaces = Math.ceil(units * ratio);
    calculation = `${units} units × ${ratio} spaces/unit = ${units * ratio} → ${requiredSpaces} spaces`;
    ratioString = `${ratio} space(s) per unit`;
  }
  // Special handling for assembly (per seat)
  else if (useTypeLower === 'assembly' && seatingCapacity !== undefined) {
    requiredSpaces = Math.ceil(seatingCapacity / ratio);
    calculation = `${seatingCapacity} seats ÷ ${ratio} = ${(seatingCapacity / ratio).toFixed(2)} → ${requiredSpaces} spaces`;
    ratioString = `1 space per ${ratio} seats`;
  }
  // Standard calculation (per sqft)
  else {
    requiredSpaces = Math.ceil(grossFloorArea / ratio);
    calculation = `${grossFloorArea.toLocaleString()} sq ft ÷ ${ratio} = ${(grossFloorArea / ratio).toFixed(2)} → ${requiredSpaces} spaces`;
    ratioString = `1 space per ${ratio} sq ft`;
  }

  // Apply minimum
  requiredSpaces = Math.max(requiredSpaces, ratioConfig.min);

  // Build notes
  const notes: string[] = [];

  if (isReducedDistrict) {
    notes.push(`The ${zoningDistrict} district has reduced parking requirements.`);
    notes.push('Shared parking agreements may be available.');
    notes.push('In-lieu fee payment to the city parking fund may be an option.');
    notes.push('Bicycle parking credits can reduce requirements by up to 10%.');
  } else {
    notes.push('Standard parking requirements apply.');
    if (requiredSpaces > 20) {
      notes.push('Consider consulting with DCD about potential parking reductions.');
    }
  }

  return {
    requiredSpaces,
    ratio: ratioString,
    isReducedDistrict,
    zoningDistrict,
    useType,
    calculation,
    notes: notes.join(' '),
    codeReference: 'Section 295-403 (Off-Street Parking Requirements)',
  };
}

/**
 * FunctionTool for calculating parking in the agent.
 */
export const calculateParkingTool = new FunctionTool({
  name: 'calculate_parking',
  description: 'Calculate required parking spaces based on use type, building size, and zoning district. Use this after determining the zoning district to give specific parking requirements.',
  parameters: z.object({
    useType: z.enum([
      'restaurant',
      'retail',
      'office',
      'medical',
      'industrial',
      'warehouse',
      'assembly',
      'residential',
    ]).describe('Type of use (e.g., restaurant, retail, office)'),
    grossFloorArea: z.number().describe('Gross floor area in square feet'),
    zoningDistrict: z.string().describe('Zoning district code (e.g., DC, RS6, LB2)'),
    seatingCapacity: z.number().optional().describe('Seating capacity (for assembly uses like theaters)'),
    units: z.number().optional().describe('Number of dwelling units (for residential)'),
  }),
  execute: calculateParking,
});

export { calculateParking };
