'use client';

import { useEffect, useCallback } from 'react';
import { X, Undo2, Redo2, AlertCircle, Images, Camera } from 'lucide-react';
import { useVisualizerStore } from '@/stores';
import { VisualizerCanvas } from './VisualizerCanvas';
import { MaskToolbar } from './MaskToolbar';
import { ZoningSidebar } from './ZoningSidebar';
import { PromptInput } from './PromptInput';
import { GenerationResult } from './GenerationResult';
import { ImageCapture } from './ImageCapture';
import { VisualizationGallery } from './VisualizationGallery';

/**
 * SiteVisualizer - Main container for AI site visualization
 * Full-screen modal for capturing images, painting masks, and generating visualizations
 */
export function SiteVisualizer() {
  const {
    isOpen,
    mode,
    sourceImage,
    generationError,
    closeVisualizer,
    setMode,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  } = useVisualizerStore();

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeVisualizer();
      }
      // Undo/Redo shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeVisualizer, undo, redo]);

  const handleClose = useCallback(() => {
    closeVisualizer();
    // Reset state after closing
    setTimeout(() => reset(), 300);
  }, [closeVisualizer, reset]);

  const handleBackToCapture = useCallback(() => {
    setMode('capture');
  }, [setMode]);

  const handleGoToGallery = useCallback(() => {
    setMode('gallery');
  }, [setMode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="AI Site Visualizer"
    >
      <div className="h-full flex flex-col bg-white dark:bg-stone-900">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b-2 border-black dark:border-stone-700">
          <div className="flex items-center gap-3">
            {/* Navigation tabs */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1 border-2 border-stone-300 dark:border-stone-600">
              <button
                onClick={handleBackToCapture}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                  ${mode === 'capture' || mode === 'edit' || mode === 'generate' || mode === 'result'
                    ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
              <button
                onClick={handleGoToGallery}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                  ${mode === 'gallery'
                    ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
              >
                <Images className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            </div>

            <h1 className="text-lg font-bold font-head">
              {mode === 'capture' && 'Capture Site Image'}
              {mode === 'edit' && 'Edit & Prompt'}
              {mode === 'generate' && 'Generating...'}
              {mode === 'result' && 'Visualization Result'}
              {mode === 'gallery' && 'Your Gallery'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons (when in edit mode) */}
            {mode === 'edit' && (
              <>
                <button
                  onClick={undo}
                  disabled={!canUndo()}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-black
                    bg-white dark:bg-stone-800
                    shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                    active:translate-y-1 active:shadow-none
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-100"
                  aria-label="Undo"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo()}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-black
                    bg-white dark:bg-stone-800
                    shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                    active:translate-y-1 active:shadow-none
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    transition-all duration-100"
                  aria-label="Redo"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-black
                bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300
                shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400
                hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                active:translate-y-1 active:shadow-none
                transition-all duration-100"
              aria-label="Close visualizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Capture Mode */}
          {mode === 'capture' && <ImageCapture />}

          {/* Edit Mode */}
          {mode === 'edit' && sourceImage && (
            <div className="h-full flex">
              {/* Canvas + Toolbar */}
              <div className="flex-1 flex flex-col">
                <MaskToolbar />
                <div className="flex-1 overflow-hidden">
                  <VisualizerCanvas />
                </div>
                {/* Error Display */}
                {generationError && (
                  <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-300">Generation Failed</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{generationError}</p>
                    </div>
                  </div>
                )}
                <PromptInput />
              </div>

              {/* Zoning Sidebar */}
              <ZoningSidebar />
            </div>
          )}

          {/* Generate Mode */}
          {mode === 'generate' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin w-16 h-16 mx-auto border-4 border-purple-500 border-t-transparent rounded-full" />
                <p className="text-lg font-medium text-stone-600 dark:text-stone-400">
                  Generating visualization with Gemini 3 Pro Image...
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-500">
                  This may take up to 30 seconds
                </p>
              </div>
            </div>
          )}

          {/* Result Mode */}
          {mode === 'result' && <GenerationResult />}

          {/* Gallery Mode */}
          {mode === 'gallery' && <VisualizationGallery />}
        </main>
      </div>
    </div>
  );
}
