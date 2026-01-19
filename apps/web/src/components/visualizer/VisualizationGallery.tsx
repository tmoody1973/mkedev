'use client';

import { useCallback } from 'react';
import { Camera, Sparkles, X, MapPin, Clock, Trash2, Loader2, Cloud } from 'lucide-react';
import { useVisualizerStore } from '@/stores';
import { useUserVisualizations, useVisualizationStorage } from '@/hooks/useVisualizationStorage';
import { Id } from '../../../convex/_generated/dataModel';

/**
 * VisualizationGallery - Shows all screenshots and generated visualizations
 */
export function VisualizationGallery() {
  const {
    screenshots,
    visualizations: localVisualizations,
    selectScreenshot,
    removeScreenshot,
    loadVisualization: loadLocalVisualization,
    removeVisualization: removeLocalVisualization,
    setSourceImage,
    setGeneratedImage,
    setMaskImage,
    setPrompt,
    setMode,
    setParcelContext,
    setZoningContext,
  } = useVisualizerStore();

  // Fetch visualizations from Convex (persisted)
  const { visualizations: convexVisualizations, isLoading: isLoadingConvex } = useUserVisualizations(50);
  const { deleteVisualization: deleteConvexVisualization } = useVisualizationStorage();

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSelectScreenshot = useCallback(
    (id: string) => {
      selectScreenshot(id);
    },
    [selectScreenshot]
  );

  const handleRemoveScreenshot = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeScreenshot(id);
    },
    [removeScreenshot]
  );

  // Load a local visualization
  const handleLoadLocalVisualization = useCallback(
    (id: string) => {
      loadLocalVisualization(id);
    },
    [loadLocalVisualization]
  );

  // Remove a local visualization
  const handleRemoveLocalVisualization = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeLocalVisualization(id);
    },
    [removeLocalVisualization]
  );

  // Load a Convex visualization into the editor
  const handleLoadConvexVisualization = useCallback(
    (viz: typeof convexVisualizations[0]) => {
      if (viz.sourceUrl && viz.generatedUrl) {
        setSourceImage(viz.sourceUrl);
        setGeneratedImage(viz.generatedUrl);
        setMaskImage(viz.maskUrl || null);
        setPrompt(viz.prompt);
        if (viz.address || viz.coordinates) {
          setParcelContext({
            address: viz.address || undefined,
            coordinates: viz.coordinates as [number, number] | undefined,
          });
        }
        if (viz.zoningContext) {
          setZoningContext(viz.zoningContext);
        }
        setMode('result');
      }
    },
    [setSourceImage, setGeneratedImage, setMaskImage, setPrompt, setParcelContext, setZoningContext, setMode]
  );

  // Delete a Convex visualization
  const handleDeleteConvexVisualization = useCallback(
    async (e: React.MouseEvent, id: Id<"visualizations">) => {
      e.stopPropagation();
      if (confirm('Delete this visualization permanently?')) {
        await deleteConvexVisualization(id);
      }
    },
    [deleteConvexVisualization]
  );

  const hasContent = screenshots.length > 0 || localVisualizations.length > 0 || convexVisualizations.length > 0;

  if (!hasContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          No visualizations yet
        </h3>
        <p className="text-stone-600 dark:text-stone-400 max-w-md">
          Take screenshots using the camera button on the map, then use AI to visualize
          development possibilities. Your work will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="p-6 border-b-2 border-stone-200 dark:border-stone-700">
        <h2 className="text-2xl font-bold font-head text-stone-900 dark:text-stone-100">
          Your Gallery
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {convexVisualizations.length + localVisualizations.length} visualizations, {screenshots.length} screenshots
          {isLoadingConvex && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Convex Visualizations (Persisted/Cloud) */}
        {convexVisualizations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cloud className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Saved Visualizations ({convexVisualizations.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {convexVisualizations.map((viz) => (
                <button
                  key={viz._id}
                  onClick={() => handleLoadConvexVisualization(viz)}
                  className="group relative bg-white dark:bg-stone-800 rounded-xl overflow-hidden
                    border-2 border-stone-300 dark:border-stone-600
                    hover:border-sky-500 hover:shadow-[4px_4px_0px_0px_rgba(14,165,233,0.5)]
                    transition-all duration-100 text-left"
                >
                  {/* Before/After Images */}
                  <div className="flex">
                    <div className="w-1/2 aspect-video relative">
                      {viz.sourceUrl ? (
                        <img
                          src={viz.sourceUrl}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                        Before
                      </span>
                    </div>
                    <div className="w-1/2 aspect-video relative">
                      {viz.generatedUrl ? (
                        <img
                          src={viz.generatedUrl}
                          alt="Generated"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-sky-600 text-white text-xs rounded">
                        After
                      </span>
                    </div>
                  </div>

                  {/* Cloud badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-sky-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Saved
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2">
                      {viz.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
                      {viz.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          {viz.address.split(',')[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(viz.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteConvexVisualization(e, viz._id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      hover:bg-red-600 transition-all shadow-lg"
                    aria-label="Delete visualization"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Local Visualizations (Session only) */}
        {localVisualizations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                This Session ({localVisualizations.length})
              </h3>
              <span className="text-xs text-stone-400">(not yet saved)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localVisualizations.map((viz) => (
                <button
                  key={viz.id}
                  onClick={() => handleLoadLocalVisualization(viz.id)}
                  className="group relative bg-white dark:bg-stone-800 rounded-xl overflow-hidden
                    border-2 border-stone-300 dark:border-stone-600
                    hover:border-purple-500 hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,0.5)]
                    transition-all duration-100 text-left"
                >
                  {/* Before/After Images */}
                  <div className="flex">
                    <div className="w-1/2 aspect-video relative">
                      <img
                        src={viz.sourceImage}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                        Before
                      </span>
                    </div>
                    <div className="w-1/2 aspect-video relative">
                      <img
                        src={viz.generatedImage}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded">
                        After
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2">
                      {viz.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
                      {viz.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          {viz.address.split(',')[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(viz.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleRemoveLocalVisualization(e, viz.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      hover:bg-red-600 transition-all shadow-lg"
                    aria-label="Delete visualization"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Screenshots ({screenshots.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {screenshots.map((screenshot) => (
                <button
                  key={screenshot.id}
                  onClick={() => handleSelectScreenshot(screenshot.id)}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-stone-300 dark:border-stone-600
                    hover:border-sky-500 hover:shadow-[4px_4px_0px_0px_rgba(14,165,233,0.5)]
                    transition-all duration-100"
                >
                  <img
                    src={screenshot.image}
                    alt={screenshot.address || 'Map screenshot'}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">
                        {screenshot.address || 'Map view'}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatTime(screenshot.timestamp)}
                      </p>
                    </div>
                  </div>
                  {/* Source type badge */}
                  {screenshot.sourceType && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded capitalize">
                      {screenshot.sourceType.replace('_', ' ')}
                    </span>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleRemoveScreenshot(e, screenshot.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      hover:bg-red-600 transition-opacity"
                    aria-label="Remove screenshot"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
