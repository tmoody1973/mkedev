'use client'

// =============================================================================
// Zoning Tooltip Component
// Displays zone code on hover over zoning districts
// =============================================================================

import { getZoningCategory, getZoningColor } from './layer-config'

export interface ZoningTooltipProps {
  /** Zone code to display (e.g., "RS6", "LB2") */
  zoneCode: string
  /** Tooltip position coordinates [x, y] in pixels */
  position?: { x: number; y: number }
  /** Whether to show the tooltip */
  visible?: boolean
}

/**
 * Tooltip component for displaying zoning information on hover
 * Styled with neobrutalist design matching the app theme
 */
export function ZoningTooltip({
  zoneCode,
  position,
  visible = true,
}: ZoningTooltipProps) {
  if (!visible || !zoneCode) return null

  const category = getZoningCategory(zoneCode)
  const color = getZoningColor(zoneCode)

  // Format category label
  const categoryLabel =
    category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')

  return (
    <div
      className="
        absolute z-50 pointer-events-none
        bg-white dark:bg-stone-900
        border-2 border-black dark:border-white
        rounded-lg
        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
        dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]
        px-3 py-2
        min-w-[120px]
      "
      style={
        position
          ? {
              left: position.x + 10,
              top: position.y + 10,
            }
          : undefined
      }
    >
      {/* Zone Code */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm border border-black/30"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
          {zoneCode}
        </span>
      </div>

      {/* Category */}
      <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">
        {categoryLabel}
      </p>
    </div>
  )
}
