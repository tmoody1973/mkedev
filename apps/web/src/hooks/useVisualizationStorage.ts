'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useCallback, useState } from 'react';

/**
 * Hook for uploading images to Convex storage and saving visualizations.
 */
export function useVisualizationStorage() {
  const generateUploadUrl = useMutation(api.visualization.gallery.generateUploadUrl);
  const saveVisualizationMutation = useMutation(api.visualization.gallery.saveVisualization);
  const deleteVisualizationMutation = useMutation(api.visualization.gallery.deleteVisualization);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Upload a base64 image to Convex storage.
   * Returns the storage ID.
   */
  const uploadImage = useCallback(
    async (base64Data: string): Promise<Id<"_storage">> => {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload to storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/png',
        },
        body: blob,
      });

      if (!result.ok) {
        throw new Error('Failed to upload image');
      }

      const { storageId } = await result.json();
      return storageId as Id<"_storage">;
    },
    [generateUploadUrl]
  );

  /**
   * Save a complete visualization with all images.
   */
  const saveVisualization = useCallback(
    async (params: {
      sourceImage: string;
      generatedImage: string;
      maskImage?: string;
      prompt: string;
      enhancedPrompt?: string;
      sourceType: 'map_screenshot' | 'street_view' | 'upload';
      address?: string;
      coordinates?: [number, number];
      zoningContext?: {
        zoningDistrict?: string;
        zoningCategory?: string;
        maxHeight?: number;
        maxStories?: number;
        setbacks?: { front: number; side: number; rear: number };
        maxFAR?: number;
        overlayZones?: string[];
        historicDistrict?: boolean;
        neighborhood?: string;
      };
      generationTimeMs?: number;
    }): Promise<Id<"visualizations">> => {
      setIsUploading(true);
      setUploadError(null);

      try {
        // Upload images in parallel
        const uploadPromises: Promise<Id<"_storage">>[] = [
          uploadImage(params.sourceImage),
          uploadImage(params.generatedImage),
        ];

        if (params.maskImage) {
          uploadPromises.push(uploadImage(params.maskImage));
        }

        const [sourceImageId, generatedImageId, maskImageId] = await Promise.all(uploadPromises);

        // Save to database
        const visualizationId = await saveVisualizationMutation({
          sourceImageId,
          generatedImageId,
          maskImageId: maskImageId || undefined,
          prompt: params.prompt,
          enhancedPrompt: params.enhancedPrompt,
          sourceType: params.sourceType,
          address: params.address,
          coordinates: params.coordinates,
          zoningContext: params.zoningContext,
          generationTimeMs: params.generationTimeMs,
        });

        return visualizationId;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save visualization';
        setUploadError(message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadImage, saveVisualizationMutation]
  );

  /**
   * Delete a visualization.
   */
  const deleteVisualization = useCallback(
    async (id: Id<"visualizations">) => {
      await deleteVisualizationMutation({ id });
    },
    [deleteVisualizationMutation]
  );

  return {
    uploadImage,
    saveVisualization,
    deleteVisualization,
    isUploading,
    uploadError,
  };
}

/**
 * Hook for fetching user's visualizations from Convex.
 */
export function useUserVisualizations(limit?: number) {
  const visualizations = useQuery(api.visualization.gallery.getUserVisualizations, {
    limit,
  });

  const count = useQuery(api.visualization.gallery.getVisualizationCount);

  return {
    visualizations: visualizations ?? [],
    count: count ?? 0,
    isLoading: visualizations === undefined,
  };
}

/**
 * Hook for fetching a single visualization.
 */
export function useVisualization(id: Id<"visualizations"> | null) {
  const visualization = useQuery(
    api.visualization.gallery.getVisualization,
    id ? { id } : 'skip'
  );

  return {
    visualization,
    isLoading: visualization === undefined,
  };
}
