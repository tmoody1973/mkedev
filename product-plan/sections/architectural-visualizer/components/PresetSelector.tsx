'use client'

import type { PresetSelectorProps } from '../types'

export function PresetSelector({
  buildingTypes,
  buildingStyles,
  storyOptions,
  selectedType,
  selectedStyle,
  selectedStories,
  onTypeChange,
  onStyleChange,
  onStoriesChange,
}: PresetSelectorProps) {
  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Building Type */}
      <div>
        <label className="block font-heading font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">
          Building Type
        </label>
        <div className="flex flex-wrap gap-2">
          {buildingTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeChange?.(type.id)}
              className={`
                px-3 py-2 rounded-lg font-heading font-semibold text-sm
                border-2 transition-all
                ${selectedType === type.id
                  ? 'bg-sky-500 text-white border-black dark:border-sky-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
                }
              `}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Building Style */}
      <div>
        <label className="block font-heading font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">
          Architectural Style
        </label>
        <div className="flex flex-wrap gap-2">
          {buildingStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange?.(style.id)}
              className={`
                px-3 py-2 rounded-lg font-heading font-semibold text-sm
                border-2 transition-all
                ${selectedStyle === style.id
                  ? 'bg-amber-500 text-white border-black dark:border-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
                }
              `}
              title={style.description}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories */}
      <div>
        <label className="block font-heading font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">
          Stories
        </label>
        <div className="flex flex-wrap gap-2">
          {storyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStoriesChange?.(option.value)}
              className={`
                w-12 h-12 rounded-lg font-heading font-bold text-lg
                border-2 transition-all flex items-center justify-center
                ${selectedStories === option.value
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-stone-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(68,64,60,1)]'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
                }
              `}
              title={option.label}
            >
              {option.value}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedType && selectedStyle && selectedStories && (
        <div className="mt-4 p-3 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
          <p className="font-mono text-sm text-stone-600 dark:text-stone-400">
            <span className="text-stone-900 dark:text-stone-100 font-semibold">Selected:</span>{' '}
            {selectedStories}-story{' '}
            <span className="text-amber-600 dark:text-amber-400">
              {buildingStyles.find(s => s.id === selectedStyle)?.label}
            </span>{' '}
            <span className="text-sky-600 dark:text-sky-400">
              {buildingTypes.find(t => t.id === selectedType)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
