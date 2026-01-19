'use client'

import { useState, useRef, useEffect } from 'react'
import { Layers, Check, ChevronDown } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'

/**
 * Layer configuration for the dropdown
 */
const LAYER_OPTIONS = [
  { id: 'parcels', label: 'Parcels', description: 'Property boundaries' },
  { id: 'zoning', label: 'Zoning', description: 'Zoning districts' },
  { id: 'homes', label: 'Homes For Sale', description: 'MLS listings' },
  { id: 'commercialProperties', label: 'Commercial', description: 'Commercial properties' },
  { id: 'developmentSites', label: 'Development Sites', description: 'Available sites' },
  { id: 'tif', label: 'TIF Districts', description: 'Tax increment financing' },
  { id: 'opportunityZones', label: 'Opportunity Zones', description: 'Federal OZ areas' },
  { id: 'historic', label: 'Historic Districts', description: 'Historic preservation' },
  { id: 'arb', label: 'ARB Areas', description: 'Architectural review' },
  { id: 'cityOwned', label: 'City-Owned Lots', description: 'City properties' },
] as const

/**
 * LayersDropdown - Header dropdown for toggling map layers
 * Replaces the simple layers button with a dropdown menu
 */
export function LayersDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    layerVisibility,
    toggleLayerVisibility,
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

              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="
                    w-full flex items-center gap-3 px-4 py-3
                    hover:bg-stone-100 dark:hover:bg-stone-700
                    border-b border-stone-100 dark:border-stone-700 last:border-b-0
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
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
