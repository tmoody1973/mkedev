import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =============================================================================
// Site Visualizer Store - Zustand state management for AI visualization
// =============================================================================

export type VisualizerMode = 'idle' | 'capture' | 'edit' | 'generate' | 'result' | 'gallery';
export type ToolType = 'brush' | 'eraser';

export interface ZoningContext {
  zoningDistrict?: string;
  zoningCategory?: string;
  maxHeight?: number;
  maxStories?: number;
  setbacks?: {
    front: number;
    side: number;
    rear: number;
  };
  maxFAR?: number;
  overlayZones?: string[];
  historicDistrict?: boolean;
  neighborhood?: string;
}

export interface HistoryEntry {
  sourceImage: string;
  maskImage?: string;
  prompt?: string;
  generatedImage?: string;
  timestamp: number;
}

export type ScreenshotSourceType = 'map' | 'street_view' | 'upload';

export interface ScreenshotEntry {
  id: string;
  image: string;
  address?: string;
  zoneCode?: string;
  coordinates?: [number, number];
  sourceType?: ScreenshotSourceType;
  timestamp: number;
}

export interface VisualizationEntry {
  id: string;
  sourceImage: string;
  generatedImage: string;
  maskImage?: string;
  prompt: string;
  address?: string;
  zoneCode?: string;
  coordinates?: [number, number];
  sourceType?: ScreenshotSourceType;
  timestamp: number;
}

export interface VisualizerState {
  // Modal state
  isOpen: boolean;
  mode: VisualizerMode;

  // Image state
  sourceImage: string | null;
  maskImage: string | null;
  generatedImage: string | null;

  // Parcel context
  parcelId: string | null;
  address: string | null;
  coordinates: [number, number] | null;
  zoningContext: ZoningContext | null;
  sourceType: ScreenshotSourceType | null;

  // Canvas/editing state
  activeTool: ToolType;
  brushSize: number;
  isDrawing: boolean;

  // Generation state
  prompt: string;
  isGenerating: boolean;
  generationProgress: number;
  generationError: string | null;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Screenshot gallery
  screenshots: ScreenshotEntry[];

  // Visualization gallery (completed generations)
  visualizations: VisualizationEntry[];

  // Actions
  openVisualizer: () => void;
  closeVisualizer: () => void;
  setMode: (mode: VisualizerMode) => void;

  // Image actions
  setSourceImage: (image: string, parcelContext?: {
    parcelId?: string;
    address?: string;
    coordinates?: [number, number];
  }) => void;
  setMaskImage: (mask: string | null) => void;
  setGeneratedImage: (image: string | null) => void;
  clearImages: () => void;

  // Parcel context actions
  setParcelContext: (context: {
    parcelId?: string;
    address?: string;
    coordinates?: [number, number];
  }) => void;
  setZoningContext: (zoning: ZoningContext | null) => void;

  // Canvas actions
  setActiveTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setIsDrawing: (drawing: boolean) => void;
  clearMask: () => void;

  // Generation actions
  setPrompt: (prompt: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;

  // History actions
  addToHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Screenshot gallery actions
  addScreenshot: (image: string, context?: { address?: string; zoneCode?: string; coordinates?: [number, number]; sourceType?: ScreenshotSourceType }) => void;
  removeScreenshot: (id: string) => void;
  selectScreenshot: (id: string) => void;
  clearScreenshots: () => void;

  // Visualization gallery actions
  saveVisualization: () => void;
  removeVisualization: (id: string) => void;
  loadVisualization: (id: string) => void;
  clearVisualizations: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  isOpen: false,
  mode: 'idle' as VisualizerMode,
  sourceImage: null,
  maskImage: null,
  generatedImage: null,
  parcelId: null,
  address: null,
  coordinates: null,
  zoningContext: null,
  sourceType: null as ScreenshotSourceType | null,
  activeTool: 'brush' as ToolType,
  brushSize: 20,
  isDrawing: false,
  prompt: '',
  isGenerating: false,
  generationProgress: 0,
  generationError: null,
  history: [],
  historyIndex: -1,
  screenshots: [] as ScreenshotEntry[],
  visualizations: [] as VisualizationEntry[],
};

export const useVisualizerStore = create<VisualizerState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Modal actions
      openVisualizer: () => set({ isOpen: true, mode: 'capture' }),
      closeVisualizer: () => set({ isOpen: false, mode: 'idle' }),
      setMode: (mode) => set({ mode }),

      // Image actions
      setSourceImage: (image, parcelContext) => set({
        sourceImage: image,
        mode: 'edit',
        ...(parcelContext?.parcelId && { parcelId: parcelContext.parcelId }),
        ...(parcelContext?.address && { address: parcelContext.address }),
        ...(parcelContext?.coordinates && { coordinates: parcelContext.coordinates }),
      }),

      setMaskImage: (mask) => set({ maskImage: mask }),
      setGeneratedImage: (image) => set({
        generatedImage: image,
        mode: image ? 'result' : get().mode,
      }),

      clearImages: () => set({
        sourceImage: null,
        maskImage: null,
        generatedImage: null,
        mode: 'capture',
      }),

      // Parcel context actions
      setParcelContext: (context) => set({
        parcelId: context.parcelId || null,
        address: context.address || null,
        coordinates: context.coordinates || null,
      }),

      setZoningContext: (zoning) => set({ zoningContext: zoning }),

      // Canvas actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      setBrushSize: (size) => set({ brushSize: Math.max(5, Math.min(50, size)) }),
      setIsDrawing: (drawing) => set({ isDrawing: drawing }),
      clearMask: () => set({ maskImage: null }),

      // Generation actions
      setPrompt: (prompt) => set({ prompt }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      setGenerationError: (error) => set({ generationError: error }),

      // History actions
      addToHistory: (entry) => {
        const state = get();
        const newEntry: HistoryEntry = {
          ...entry,
          timestamp: Date.now(),
        };

        // Remove any "future" entries if we're not at the end
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newEntry);

        // Keep max 20 history entries
        if (newHistory.length > 20) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const prevEntry = state.history[state.historyIndex - 1];
          set({
            historyIndex: state.historyIndex - 1,
            sourceImage: prevEntry.sourceImage,
            maskImage: prevEntry.maskImage || null,
            prompt: prevEntry.prompt || '',
            generatedImage: prevEntry.generatedImage || null,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextEntry = state.history[state.historyIndex + 1];
          set({
            historyIndex: state.historyIndex + 1,
            sourceImage: nextEntry.sourceImage,
            maskImage: nextEntry.maskImage || null,
            prompt: nextEntry.prompt || '',
            generatedImage: nextEntry.generatedImage || null,
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // Screenshot gallery actions
      addScreenshot: (image, context) => {
        const newScreenshot: ScreenshotEntry = {
          id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          image,
          address: context?.address,
          zoneCode: context?.zoneCode,
          coordinates: context?.coordinates,
          sourceType: context?.sourceType,
          timestamp: Date.now(),
        };
        set((state) => ({
          screenshots: [newScreenshot, ...state.screenshots].slice(0, 20), // Keep max 20
        }));
      },

      removeScreenshot: (id) => {
        set((state) => ({
          screenshots: state.screenshots.filter((s) => s.id !== id),
        }));
      },

      selectScreenshot: (id) => {
        const screenshot = get().screenshots.find((s) => s.id === id);
        if (screenshot) {
          set({
            sourceImage: screenshot.image,
            address: screenshot.address || null,
            coordinates: screenshot.coordinates || null,
            zoningContext: screenshot.zoneCode
              ? { zoningDistrict: screenshot.zoneCode }
              : null,
            sourceType: screenshot.sourceType || null,
            mode: 'edit',
          });
        }
      },

      clearScreenshots: () => set({ screenshots: [] }),

      // Visualization gallery actions
      saveVisualization: () => {
        const state = get();
        if (!state.sourceImage || !state.generatedImage) return;

        const newVisualization: VisualizationEntry = {
          id: `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceImage: state.sourceImage,
          generatedImage: state.generatedImage,
          maskImage: state.maskImage || undefined,
          prompt: state.prompt,
          address: state.address || undefined,
          zoneCode: state.zoningContext?.zoningDistrict,
          coordinates: state.coordinates || undefined,
          sourceType: state.sourceType || undefined,
          timestamp: Date.now(),
        };

        set((s) => ({
          visualizations: [newVisualization, ...s.visualizations].slice(0, 50), // Keep max 50
        }));
      },

      removeVisualization: (id) => {
        set((state) => ({
          visualizations: state.visualizations.filter((v) => v.id !== id),
        }));
      },

      loadVisualization: (id) => {
        const visualization = get().visualizations.find((v) => v.id === id);
        if (visualization) {
          set({
            sourceImage: visualization.sourceImage,
            generatedImage: visualization.generatedImage,
            maskImage: visualization.maskImage || null,
            prompt: visualization.prompt,
            address: visualization.address || null,
            coordinates: visualization.coordinates || null,
            zoningContext: visualization.zoneCode
              ? { zoningDistrict: visualization.zoneCode }
              : null,
            sourceType: visualization.sourceType || null,
            mode: 'result',
          });
        }
      },

      clearVisualizations: () => set({ visualizations: [] }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'mkedev-visualizer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-transient state
        brushSize: state.brushSize,
        activeTool: state.activeTool,
        // Don't persist images or history in localStorage (too large)
      }),
    }
  )
);
