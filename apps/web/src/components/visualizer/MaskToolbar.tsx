'use client';

import { Paintbrush, Eraser, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * MaskToolbar - Brush, eraser, size controls, and zoom for mask painting
 */
export function MaskToolbar() {
  const {
    activeTool,
    brushSize,
    setActiveTool,
    setBrushSize,
    clearMask,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useVisualizerStore();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-stone-100 dark:bg-stone-800 border-b-2 border-stone-300 dark:border-stone-600">
      {/* Tool Buttons */}
      <div className="flex items-center gap-1">
        {/* Brush */}
        <button
          onClick={() => setActiveTool('brush')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
            transition-all duration-100
            ${
              activeTool === 'brush'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label="Brush tool"
          aria-pressed={activeTool === 'brush'}
          title="Brush - paint areas to edit"
        >
          <Paintbrush className="w-5 h-5" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
            transition-all duration-100
            ${
              activeTool === 'eraser'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300'
            }
          `}
          aria-label="Eraser tool"
          aria-pressed={activeTool === 'eraser'}
          title="Eraser - remove from mask"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Brush Size Slider */}
      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <label className="text-sm font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap">
          Size
        </label>
        <input
          type="range"
          min={5}
          max={50}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1 h-2 bg-stone-300 dark:bg-stone-600 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-purple-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-black
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-purple-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-black
            [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Brush size"
        />
        <span className="text-sm font-mono w-8 text-stone-600 dark:text-stone-400">
          {brushSize}
        </span>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearMask}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-black
          bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
          shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400
          hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
          active:translate-y-1 active:shadow-none
          transition-all duration-100"
        aria-label="Clear mask"
        title="Clear all painted areas"
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm font-medium">Clear</span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-stone-300 dark:bg-stone-600" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-black
            bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
            transition-all duration-100
            disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom out"
          title="Zoom out (scroll down)"
          disabled={zoomLevel <= 0.5}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-sm font-mono w-12 text-center text-stone-600 dark:text-stone-400">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-black
            bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
            transition-all duration-100
            disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom in"
          title="Zoom in (scroll up)"
          disabled={zoomLevel >= 5}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={resetZoom}
          className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-black
            bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-1 active:shadow-none
            transition-all duration-100"
          aria-label="Reset zoom"
          title="Reset to fit (100%)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions */}
      <p className="text-sm text-stone-500 dark:text-stone-400 ml-auto hidden lg:block">
        Scroll to zoom • Space+drag to pan
      </p>
    </div>
  );
}
