'use client'

import { useState } from 'react'
import { Layers, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import type { MapLayer } from '../types'

export interface LayerPanelProps {
  layers: MapLayer[]
  isExpanded: boolean
  onLayerToggle?: (layerId: string, isVisible: boolean) => void
  onOpacityChange?: (layerId: string, opacity: number) => void
  onExpandChange?: (isExpanded: boolean) => void
}

export function LayerPanel({
  layers,
  isExpanded,
  onLayerToggle,
  onOpacityChange,
  onExpandChange,
}: LayerPanelProps) {
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)

  const visibleCount = layers.filter((l) => l.isVisible).length

  return (
    <div
      className={`
        absolute left-4 right-4 bottom-4
        bg-white dark:bg-stone-900
        border-2 border-black
        rounded-xl
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
        transition-all duration-300 ease-out
        ${isExpanded ? 'max-h-[60vh]' : 'max-h-16'}
        overflow-hidden
      `}
    >
      {/* Handle / Header */}
      <button
        onClick={() => onExpandChange?.(!isExpanded)}
        className="
          w-full px-4 py-3
          flex items-center justify-between
          hover:bg-stone-50 dark:hover:bg-stone-800
          transition-colors
        "
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center border-2 border-black">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-stone-900 dark:text-stone-50 text-sm">
              Map Layers
            </p>
            <p className="font-body text-xs text-stone-500 dark:text-stone-400">
              {visibleCount} of {layers.length} active
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
      {isExpanded && (
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(60vh-64px)]">
          <div className="space-y-2">
            {layers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isExpanded={expandedLayerId === layer.id}
                onToggle={() => onLayerToggle?.(layer.id, !layer.isVisible)}
                onOpacityChange={(opacity) => onOpacityChange?.(layer.id, opacity)}
                onExpandToggle={() =>
                  setExpandedLayerId(expandedLayerId === layer.id ? null : layer.id)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Layer Item Sub-component
// =============================================================================

interface LayerItemProps {
  layer: MapLayer
  isExpanded: boolean
  onToggle: () => void
  onOpacityChange: (opacity: number) => void
  onExpandToggle: () => void
}

function LayerItem({
  layer,
  isExpanded,
  onToggle,
  onOpacityChange,
  onExpandToggle,
}: LayerItemProps) {
  return (
    <div
      className={`
        rounded-lg border-2
        ${layer.isVisible
          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30'
          : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
        }
        transition-colors
      `}
    >
      {/* Layer Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Color Swatch */}
        <div
          className="w-4 h-4 rounded border border-black flex-shrink-0"
          style={{ backgroundColor: layer.color }}
        />

        {/* Layer Info */}
        <button
          onClick={onExpandToggle}
          className="flex-1 text-left min-w-0"
        >
          <p className="font-body font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
            {layer.name}
          </p>
        </button>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            border-2 border-black
            transition-all duration-100
            ${layer.isVisible
              ? 'bg-sky-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white dark:bg-stone-700 text-stone-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
          `}
          aria-label={layer.isVisible ? 'Hide layer' : 'Show layer'}
        >
          {layer.isVisible ? (
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
          <p className="font-body text-xs text-stone-600 dark:text-stone-400">
            {layer.description}
          </p>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-stone-500 dark:text-stone-400">
                Opacity
              </span>
              <span className="font-mono text-xs text-stone-600 dark:text-stone-300">
                {Math.round(layer.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
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
              "
            />
          </div>

          {/* Legend Items */}
          {layer.legendItems.length > 0 && (
            <div className="space-y-1">
              <span className="font-body text-xs text-stone-500 dark:text-stone-400 font-medium">
                Legend
              </span>
              <div className="flex flex-wrap gap-2">
                {layer.legendItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-700 rounded text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-sm border border-black/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-body text-stone-700 dark:text-stone-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Source */}
          <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
            Source: {layer.dataSource}
          </p>
        </div>
      )}
    </div>
  )
}
