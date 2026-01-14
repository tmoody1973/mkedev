declare module 'mapbox-pmtiles' {
  export interface PMTilesHeader {
    minZoom: number
    maxZoom: number
    tileType: number
    centerZoom: number
    centerLon: number
    centerLat: number
  }

  export class PmTilesSource {
    static SOURCE_TYPE: string
    static getHeader(url: string): Promise<PMTilesHeader>
  }
}
