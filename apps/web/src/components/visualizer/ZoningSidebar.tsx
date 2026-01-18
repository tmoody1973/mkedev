'use client';

import { MapPin, Building2, Ruler, Layers } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * ZoningSidebar - Display zoning constraints for the selected parcel
 */
export function ZoningSidebar() {
  const { address, zoningContext } = useVisualizerStore();

  return (
    <aside className="w-72 bg-stone-50 dark:bg-stone-850 border-l-2 border-stone-300 dark:border-stone-600 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Site Context
          </h3>
        </div>

        {/* Address */}
        {address ? (
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-lg border-2 border-stone-300 dark:border-stone-600">
            <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {address}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Milwaukee, WI
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600">
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              No address specified
            </p>
          </div>
        )}

        {/* Zoning Info */}
        {zoningContext ? (
          <div className="space-y-3">
            {/* Zoning District Badge */}
            {zoningContext.zoningDistrict && (
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-lg border-2 border-stone-300 dark:border-stone-600">
                <Building2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">
                    Zoning District
                  </p>
                  <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {zoningContext.zoningDistrict}
                  </p>
                  {zoningContext.zoningCategory && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      {zoningContext.zoningCategory}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Dimensional Standards */}
            <div className="p-3 bg-white dark:bg-stone-800 rounded-lg border-2 border-stone-300 dark:border-stone-600">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">
                  Constraints
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {zoningContext.maxHeight && (
                  <div>
                    <p className="text-stone-500 dark:text-stone-400">Max Height</p>
                    <p className="font-bold text-stone-900 dark:text-stone-100">
                      {zoningContext.maxHeight} ft
                    </p>
                  </div>
                )}
                {zoningContext.maxStories && (
                  <div>
                    <p className="text-stone-500 dark:text-stone-400">Max Stories</p>
                    <p className="font-bold text-stone-900 dark:text-stone-100">
                      {zoningContext.maxStories}
                    </p>
                  </div>
                )}
                {zoningContext.maxFAR && (
                  <div>
                    <p className="text-stone-500 dark:text-stone-400">Max FAR</p>
                    <p className="font-bold text-stone-900 dark:text-stone-100">
                      {zoningContext.maxFAR}
                    </p>
                  </div>
                )}
              </div>

              {/* Setbacks */}
              {zoningContext.setbacks && (
                <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                    Setbacks (ft)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm text-center">
                    <div className="bg-stone-100 dark:bg-stone-700 rounded p-1">
                      <p className="text-xs text-stone-500 dark:text-stone-400">Front</p>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {zoningContext.setbacks.front}
                      </p>
                    </div>
                    <div className="bg-stone-100 dark:bg-stone-700 rounded p-1">
                      <p className="text-xs text-stone-500 dark:text-stone-400">Side</p>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {zoningContext.setbacks.side}
                      </p>
                    </div>
                    <div className="bg-stone-100 dark:bg-stone-700 rounded p-1">
                      <p className="text-xs text-stone-500 dark:text-stone-400">Rear</p>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {zoningContext.setbacks.rear}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Zones */}
            {zoningContext.overlayZones && zoningContext.overlayZones.length > 0 && (
              <div className="p-3 bg-white dark:bg-stone-800 rounded-lg border-2 border-stone-300 dark:border-stone-600">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">
                    Overlay Zones
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {zoningContext.overlayZones.map((zone) => (
                    <span
                      key={zone}
                      className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Historic District */}
            {zoningContext.historicDistrict && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Historic District
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Design must be architecturally compatible with the district.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600">
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              No zoning data available
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center mt-1">
              Select a parcel on the map to load zoning context
            </p>
          </div>
        )}

        {/* Info Note */}
        <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-lg border-2 border-sky-200 dark:border-sky-800">
          <p className="text-xs text-sky-700 dark:text-sky-300">
            Zoning constraints are automatically included in the AI prompt to generate
            compliant visualizations.
          </p>
        </div>
      </div>
    </aside>
  );
}
