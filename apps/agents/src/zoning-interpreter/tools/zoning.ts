/**
 * Query Zoning at Point Tool
 *
 * Queries Milwaukee's ESRI REST services to get zoning information
 * at a specific coordinate point.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const ESRI_BASE = 'https://gis.milwaukee.gov/arcgis/rest/services';

/**
 * Result type for zoning queries
 */
export interface ZoningResult {
  success: boolean;
  zoningDistrict?: string;
  zoningDescription?: string;
  overlayZones?: string[];
  taxKey?: string;
  error?: string;
}

/**
 * Query zoning district at a coordinate point.
 */
async function queryZoningAtPoint(params: {
  longitude: number;
  latitude: number;
}): Promise<ZoningResult> {
  const { longitude, latitude } = params;

  try {
    // Query the zoning layer
    const zoningUrl = new URL(`${ESRI_BASE}/planning/zoning/MapServer/11/query`);
    zoningUrl.searchParams.set('geometry', `${longitude},${latitude}`);
    zoningUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    zoningUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    zoningUrl.searchParams.set('outFields', '*');
    zoningUrl.searchParams.set('returnGeometry', 'false');
    zoningUrl.searchParams.set('f', 'json');

    const zoningResponse = await fetch(zoningUrl.toString());

    if (!zoningResponse.ok) {
      return {
        success: false,
        error: `Zoning service error: ${zoningResponse.status}`,
      };
    }

    const zoningData = await zoningResponse.json();
    const zoning = zoningData.features?.[0]?.attributes;

    if (!zoning) {
      return {
        success: false,
        error: 'No zoning information found at this location. The point may be outside Milwaukee city limits.',
      };
    }

    // Query overlay zones (TIF, Historic, etc.)
    const overlays: string[] = [];

    // Query TIF districts
    try {
      const tifUrl = new URL(`${ESRI_BASE}/planning/special_districts/MapServer/8/query`);
      tifUrl.searchParams.set('geometry', `${longitude},${latitude}`);
      tifUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      tifUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      tifUrl.searchParams.set('outFields', 'TIF_NAME,TIF_ID');
      tifUrl.searchParams.set('returnGeometry', 'false');
      tifUrl.searchParams.set('f', 'json');

      const tifResponse = await fetch(tifUrl.toString());
      if (tifResponse.ok) {
        const tifData = await tifResponse.json();
        const tif = tifData.features?.[0]?.attributes;
        if (tif?.TIF_NAME) {
          overlays.push(`TIF District: ${tif.TIF_NAME}`);
        }
      }
    } catch {
      // TIF query failed, continue without it
    }

    // Query Opportunity Zones
    try {
      const ozUrl = new URL(`${ESRI_BASE}/planning/special_districts/MapServer/9/query`);
      ozUrl.searchParams.set('geometry', `${longitude},${latitude}`);
      ozUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      ozUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      ozUrl.searchParams.set('outFields', '*');
      ozUrl.searchParams.set('returnGeometry', 'false');
      ozUrl.searchParams.set('f', 'json');

      const ozResponse = await fetch(ozUrl.toString());
      if (ozResponse.ok) {
        const ozData = await ozResponse.json();
        if (ozData.features?.length > 0) {
          overlays.push('Opportunity Zone');
        }
      }
    } catch {
      // OZ query failed, continue without it
    }

    // Query Historic Districts
    try {
      const historicUrl = new URL(`${ESRI_BASE}/planning/special_districts/MapServer/17/query`);
      historicUrl.searchParams.set('geometry', `${longitude},${latitude}`);
      historicUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      historicUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      historicUrl.searchParams.set('outFields', 'NAME');
      historicUrl.searchParams.set('returnGeometry', 'false');
      historicUrl.searchParams.set('f', 'json');

      const historicResponse = await fetch(historicUrl.toString());
      if (historicResponse.ok) {
        const historicData = await historicResponse.json();
        const historic = historicData.features?.[0]?.attributes;
        if (historic?.NAME) {
          overlays.push(`Historic District: ${historic.NAME}`);
        }
      }
    } catch {
      // Historic query failed, continue without it
    }

    return {
      success: true,
      zoningDistrict: zoning.ZONING || zoning.ZONE || 'Unknown',
      zoningDescription: zoning.ZONING_DESC || zoning.ZONE_DESC || '',
      overlayZones: overlays,
      taxKey: zoning.TAXKEY,
    };
  } catch (error) {
    return {
      success: false,
      error: `Zoning query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * FunctionTool for querying zoning in the agent.
 */
export const queryZoningTool = new FunctionTool({
  name: 'query_zoning_at_point',
  description: 'Get zoning district and overlay information (TIF, Opportunity Zone, Historic District) for a specific location. Requires longitude and latitude coordinates from geocoding.',
  parameters: z.object({
    longitude: z.number().describe('Longitude coordinate (e.g., -87.9095)'),
    latitude: z.number().describe('Latitude coordinate (e.g., 43.0389)'),
  }),
  execute: queryZoningAtPoint,
});

export { queryZoningAtPoint };
