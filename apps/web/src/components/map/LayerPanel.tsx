'use client'

// =============================================================================
// LayerPanel Component
// Collapsible panel for managing map layer visibility and opacity
// =============================================================================

import { useState, useCallback } from 'react'
import { Layers, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useMap } from '@/contexts/MapContext'
import {
  ALL_LAYER_CONFIGS,
  HOMES_LAYER_CONFIG,
  COMMERCIAL_LAYER_CONFIG,
  DEVELOPMENT_SITES_LAYER_CONFIG,
  VACANT_LOTS_LAYER_CONFIG,
  type ESRILayerConfig,
  type HomesLayerConfig,
  type CommercialLayerConfig,
  type DevelopmentSitesLayerConfig,
  type VacantLotsLayerConfig,
} from './layers'

// Combined layer config type for display
type LayerConfig = ESRILayerConfig | HomesLayerConfig | CommercialLayerConfig | DevelopmentSitesLayerConfig | VacantLotsLayerConfig

// Combined array of all layer configs (ESRI + Homes + Commercial + Development Sites + Vacant Lots)
const ALL_LAYERS: LayerConfig[] = [
  ...ALL_LAYER_CONFIGS,
  HOMES_LAYER_CONFIG,
  COMMERCIAL_LAYER_CONFIG,
  DEVELOPMENT_SITES_LAYER_CONFIG,
  VACANT_LOTS_LAYER_CONFIG,
]

// =============================================================================
// Types
// =============================================================================

export interface LayerPanelProps {
  /** Whether the panel starts expanded */
  defaultExpanded?: boolean
  /** Custom class name for the container */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Collapsible panel for managing map layer visibility and opacity
 * Integrates with MapContext for state management
 */
export function LayerPanel({
  defaultExpanded = false,
  className = '',
}: LayerPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)

  const {
    layerVisibility,
    toggleLayerVisibility,
    layerOpacity,
    setLayerOpacity,
  } = useMap()

  // Count visible layers
  const visibleCount = ALL_LAYERS.filter(
    (config) => layerVisibility[config.id] ?? config.defaultVisible
  ).length

  const totalCount = ALL_LAYERS.length

  // Toggle panel expansion
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Toggle layer visibility
  const handleToggleLayer = useCallback(
    (layerId: string) => {
      toggleLayerVisibility(layerId)
    },
    [toggleLayerVisibility]
  )

  // Handle opacity change
  const handleOpacityChange = useCallback(
    (layerId: string, opacity: number) => {
      setLayerOpacity(layerId, opacity)
    },
    [setLayerOpacity]
  )

  // Toggle layer item expansion for opacity control
  const handleToggleLayerExpand = useCallback((layerId: string) => {
    setExpandedLayerId((prev) => (prev === layerId ? null : layerId))
  }, [])

  return (
    <div
      className={`
        absolute right-4 bottom-4
        w-72
        bg-white dark:bg-stone-900
        border-2 border-black dark:border-white
        rounded-xl
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
        transition-all duration-300 ease-out
        ${isExpanded ? 'max-h-[60vh]' : 'max-h-16'}
        overflow-hidden
        ${className}
      `}
      data-testid="layer-panel"
    >
      {/* Panel Header */}
      <button
        onClick={handleToggleExpand}
        className="
          w-full px-4 py-3
          flex items-center justify-between
          hover:bg-stone-50 dark:hover:bg-stone-800
          transition-colors
        "
        aria-expanded={isExpanded}
        aria-controls="layer-panel-content"
        data-testid="layer-panel-toggle"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black dark:border-white">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-left">
            <p className="font-sans font-bold text-stone-900 dark:text-stone-50 text-sm">
              Map Layers
            </p>
            <p
              className="font-sans text-xs text-stone-500 dark:text-stone-400"
              data-testid="layer-count"
            >
              {visibleCount} of {totalCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Drag handle indicator */}
          <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-stone-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-stone-400" />
          )}
        </div>
      </button>

      {/* Layer List */}
      <div
        id="layer-panel-content"
        className={`
          px-4 pb-4 overflow-y-auto
          ${isExpanded ? 'max-h-[calc(60vh-64px)]' : 'max-h-0 invisible'}
        `}
        data-testid="layer-panel-content"
      >
        <div className="space-y-2">
          {ALL_LAYERS.map((config) => (
            <LayerItem
              key={config.id}
              config={config}
              isVisible={layerVisibility[config.id] ?? config.defaultVisible}
              opacity={layerOpacity[config.id] ?? 1}
              isExpanded={expandedLayerId === config.id}
              onToggleVisibility={() => handleToggleLayer(config.id)}
              onOpacityChange={(opacity) => handleOpacityChange(config.id, opacity)}
              onToggleExpand={() => handleToggleLayerExpand(config.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LayerItem Sub-component
// =============================================================================

interface LayerItemProps {
  config: LayerConfig
  isVisible: boolean
  opacity: number
  isExpanded: boolean
  onToggleVisibility: () => void
  onOpacityChange: (opacity: number) => void
  onToggleExpand: () => void
}

function LayerItem({
  config,
  isVisible,
  opacity,
  isExpanded,
  onToggleVisibility,
  onOpacityChange,
  onToggleExpand,
}: LayerItemProps) {
  return (
    <div
      className={`
        rounded-lg border-2
        ${
          isVisible
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30'
            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
        }
        transition-colors
      `}
      data-testid={`layer-item-${config.id}`}
    >
      {/* Layer Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Color Swatch */}
        <div
          className="w-4 h-4 rounded border border-black dark:border-white flex-shrink-0"
          style={{ backgroundColor: config.color }}
          aria-label={`${config.name} color`}
        />

        {/* Layer Info */}
        <button
          onClick={onToggleExpand}
          className="flex-1 text-left min-w-0"
          aria-expanded={isExpanded}
        >
          <p className="font-sans font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
            {config.name}
          </p>
        </button>

        {/* Visibility Toggle Button */}
        <button
          onClick={onToggleVisibility}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            border-2 border-black dark:border-white
            transition-all duration-100
            ${
              isVisible
                ? 'bg-sky-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
                : 'bg-white dark:bg-stone-700 text-stone-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
            }
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
          `}
          aria-label={isVisible ? `Hide ${config.name}` : `Show ${config.name}`}
          data-testid={`layer-toggle-${config.id}`}
        >
          {isVisible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-3">
          {/* Description */}
          <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
            {config.description}
          </p>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Opacity
              </span>
              <span
                className="font-mono text-xs text-stone-600 dark:text-stone-300"
                data-testid={`layer-opacity-value-${config.id}`}
              >
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(opacity * 100)}
              onChange={(e) => onOpacityChange(parseInt(e.target.value, 10) / 100)}
              className="
                w-full h-2 rounded-full appearance-none cursor-pointer
                bg-stone-200 dark:bg-stone-700
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-sky-500
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-black
                [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-sky-500
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-black
                [&::-moz-range-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              "
              aria-label={`${config.name} opacity`}
              data-testid={`layer-opacity-slider-${config.id}`}
            />
          </div>

          {/* Legend Items */}
          {config.legendItems.length > 0 && (
            <div className="space-y-1">
              <span className="font-sans text-xs text-stone-500 dark:text-stone-400 font-medium">
                Legend
              </span>
              <div className="flex flex-wrap gap-2">
                {config.legendItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-700 rounded text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-sm border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-sans text-stone-700 dark:text-stone-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Source */}
          <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
            Source: {config.dataSource}
          </p>
        </div>
      )}
    </div>
  )
}
