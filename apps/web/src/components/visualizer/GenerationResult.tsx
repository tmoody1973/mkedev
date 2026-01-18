'use client';

import { useCallback, useState } from 'react';
import { Download, Save, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * GenerationResult - Before/after comparison view
 */
export function GenerationResult() {
  const {
    sourceImage,
    generatedImage,
    prompt,
    setMode,
    address,
    zoningContext,
  } = useVisualizerStore();

  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mkedev-visualization-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage]);

  // Handle save to gallery
  const handleSave = useCallback(async () => {
    if (!generatedImage || !sourceImage) return;

    setIsSaving(true);
    try {
      // TODO: Call Convex mutation to save visualization
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Saved to your gallery!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save visualization');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, sourceImage]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    setMode('edit');
  }, [setMode]);

  // Handle slider drag
  const handleSliderMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const position = ((clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, position)));
    },
    []
  );

  if (!sourceImage || !generatedImage) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-stone-500">No visualization available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-4 p-3 bg-stone-100 dark:bg-stone-800 border-b-2 border-stone-300 dark:border-stone-600">
        <button
          onClick={() => setViewMode('side-by-side')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-black
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            transition-all duration-100
            ${
              viewMode === 'side-by-side'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
            }
          `}
        >
          Side by Side
        </button>
        <button
          onClick={() => setViewMode('slider')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-black
            shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            transition-all duration-100
            ${
              viewMode === 'slider'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
            }
          `}
        >
          Slider Compare
        </button>
      </div>

      {/* Image Comparison */}
      <div className="flex-1 overflow-hidden p-4 bg-stone-200 dark:bg-stone-800">
        {viewMode === 'side-by-side' ? (
          <div className="h-full flex gap-4">
            {/* Original */}
            <div className="flex-1 flex flex-col">
              <p className="text-center text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                Original
              </p>
              <div className="flex-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-stone-300 dark:border-stone-600 overflow-hidden">
                <img
                  src={sourceImage}
                  alt="Original site"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Generated */}
            <div className="flex-1 flex flex-col">
              <p className="text-center text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                AI Visualization
              </p>
              <div className="flex-1 bg-white dark:bg-stone-900 rounded-lg border-2 border-purple-400 dark:border-purple-600 overflow-hidden">
                <img
                  src={generatedImage}
                  alt="AI generated visualization"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="h-full relative cursor-ew-resize select-none"
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
          >
            {/* Original (full) */}
            <div className="absolute inset-0 overflow-hidden rounded-lg border-2 border-stone-300 dark:border-stone-600">
              <img
                src={sourceImage}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Generated (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden rounded-lg border-2 border-purple-400"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white border-2 border-black"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-lg">
                <ChevronLeft className="w-3 h-3" />
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-stone-900/75 text-white text-xs rounded">
              Original
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600/90 text-white text-xs rounded">
              AI Visualization
            </div>
          </div>
        )}
      </div>

      {/* Info & Actions */}
      <div className="p-4 bg-white dark:bg-stone-900 border-t-2 border-stone-300 dark:border-stone-600">
        {/* Prompt used */}
        <div className="mb-4 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
            Prompt used:
          </p>
          <p className="text-sm text-stone-700 dark:text-stone-300">{prompt}</p>
          {zoningContext?.zoningDistrict && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
              Zoning context: {zoningContext.zoningDistrict}
              {address && ` at ${address}`}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTryAgain}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black
              bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
              hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black
              bg-sky-500 text-white font-medium
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
              hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              disabled:opacity-50
              transition-all duration-100"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save to Gallery'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black
              bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
              hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
          This AI-generated visualization is for conceptual purposes only and does not
          represent actual architectural plans or guarantee zoning approval.
        </p>
      </div>
    </div>
  );
}
