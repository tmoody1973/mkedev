'use client'

import { useState, useRef, useEffect } from 'react'
import { Layers, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'

/**
 * Layer configuration for the dropdown with default opacity
 */
const LAYER_OPTIONS = [
  { id: 'parcels', label: 'Parcels', description: 'Property boundaries', defaultOpacity: 0 },
  { id: 'zoning', label: 'Zoning', description: 'Zoning districts', defaultOpacity: 0.5 },
  { id: 'homes', label: 'Homes For Sale', description: 'MLS listings', defaultOpacity: 0.8 },
  { id: 'commercialProperties', label: 'Commercial', description: 'Commercial properties', defaultOpacity: 0.7 },
  { id: 'developmentSites', label: 'Development Sites', description: 'Available sites', defaultOpacity: 0.7 },
  { id: 'tif', label: 'TIF Districts', description: 'Tax increment financing', defaultOpacity: 0.3 },
  { id: 'opportunityZones', label: 'Opportunity Zones', description: 'Federal OZ areas', defaultOpacity: 0.25 },
  { id: 'historic', label: 'Historic Districts', description: 'Historic preservation', defaultOpacity: 0.25 },
  { id: 'arb', label: 'ARB Areas', description: 'Architectural review', defaultOpacity: 0.2 },
  { id: 'cityOwned', label: 'City-Owned Lots', description: 'City properties', defaultOpacity: 0.4 },
] as const

/**
 * LayersDropdown - Header dropdown for toggling map layers
 * Replaces the simple layers button with a dropdown menu
 */
export function LayersDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    layerVisibility,
    toggleLayerVisibility,
    layerOpacity,
    setLayerOpacity,
    is3DMode,
    toggle3DMode,
  } = useMap()

  // Count active layers
  const activeCount = Object.values(layerVisibility).filter(Boolean).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center gap-1 h-12 px-3 rounded-lg border-2 border-black
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          active:translate-y-2 active:shadow-none
          transition-all duration-100
          ${
            isOpen
              ? 'bg-sky-500 text-white'
              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
          }
        `}
        aria-label="Toggle layers menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Layers className="w-5 h-5" />
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {activeCount > 0 && (
          <span className={`
            ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full
            ${isOpen ? 'bg-white text-sky-600' : 'bg-sky-500 text-white'}
          `}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-2 w-64 z-50
            bg-white dark:bg-stone-800
            border-2 border-black dark:border-stone-600
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b-2 border-stone-200 dark:border-stone-700">
            <h3 className="font-bold text-stone-900 dark:text-stone-100">Layers</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {activeCount} of {LAYER_OPTIONS.length} active
            </p>
          </div>

          {/* Layer List */}
          <div className="max-h-80 overflow-y-auto">
            {/* 3D Mode Toggle */}
            <button
              onClick={toggle3DMode}
              className="
                w-full flex items-center gap-3 px-4 py-3
                hover:bg-stone-100 dark:hover:bg-stone-700
                border-b border-stone-200 dark:border-stone-700
                transition-colors
              "
            >
              <div
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-all
                  ${
                    is3DMode
                      ? 'bg-sky-500 border-sky-600'
                      : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-500'
                  }
                `}
              >
                {is3DMode && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium text-stone-900 dark:text-stone-100">3D Mode</span>
                <p className="text-xs text-stone-500 dark:text-stone-400">Extruded buildings</p>
              </div>
            </button>

            {/* Layer Options */}
            {LAYER_OPTIONS.map((layer) => {
              const isActive = layerVisibility[layer.id] ?? false
              const isExpanded = expandedLayer === layer.id
              const opacity = layerOpacity[layer.id] ?? layer.defaultOpacity

              return (
                <div key={layer.id} className="border-b border-stone-100 dark:border-stone-700 last:border-b-0">
                  <div className="flex items-center">
                    {/* Toggle Checkbox */}
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="
                        flex items-center gap-3 px-4 py-3 flex-1
                        hover:bg-stone-100 dark:hover:bg-stone-700
                        transition-colors
                      "
                    >
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          transition-all
                          ${
                            isActive
                              ? 'bg-sky-500 border-sky-600'
                              : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-500'
                          }
                        `}
                      >
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-stone-900 dark:text-stone-100">{layer.label}</span>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{layer.description}</p>
                      </div>
                    </button>

                    {/* Expand Button for Opacity Slider */}
                    {isActive && (
                      <button
                        onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                        className="
                          px-3 py-3
                          hover:bg-stone-100 dark:hover:bg-stone-700
                          transition-colors
                        "
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} opacity control for ${layer.label}`}
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Opacity Slider (expanded) */}
                  {isActive && isExpanded && (
                    <div className="px-4 pb-3 pt-1 bg-stone-50 dark:bg-stone-750">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-500 dark:text-stone-400 w-16">Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(opacity * 100)}
                          onChange={(e) => setLayerOpacity(layer.id, parseInt(e.target.value) / 100)}
                          className="
                            flex-1 h-2 rounded-full appearance-none cursor-pointer
                            bg-stone-200 dark:bg-stone-600
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-sky-500
                            [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-sky-600
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-moz-range-thumb]:w-4
                            [&::-moz-range-thumb]:h-4
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-sky-500
                            [&::-moz-range-thumb]:border-2
                            [&::-moz-range-thumb]:border-sky-600
                            [&::-moz-range-thumb]:cursor-pointer
                          "
                        />
                        <span className="text-xs font-mono text-stone-600 dark:text-stone-400 w-10 text-right">
                          {Math.round(opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
