'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useVisualizerStore } from '@/stores';

const PROMPT_SUGGESTIONS = [
  { label: 'Modern townhomes', prompt: 'Add modern 3-story townhomes with contemporary design' },
  { label: 'Mixed-use building', prompt: 'Replace with a 4-story mixed-use building with retail on ground floor' },
  { label: 'Green space', prompt: 'Transform into a community park with trees and walking paths' },
  { label: 'Infill housing', prompt: 'Add a single-family home that matches the neighborhood character' },
  { label: 'Parking structure', prompt: 'Add a modern parking structure with ground-floor retail' },
  { label: 'Urban garden', prompt: 'Convert to an urban community garden with raised beds' },
];

/**
 * PromptInput - User prompt input and generate button
 */
export function PromptInput() {
  const {
    prompt,
    setPrompt,
    isGenerating,
    setIsGenerating,
    setGenerationError,
    setMode,
    sourceImage,
    zoningContext,
    setGeneratedImage,
  } = useVisualizerStore();

  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  // TODO: Wire up to Convex action when created
  // const generateVisualization = useMutation(api.visualization.generate);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxChars) {
        setPrompt(value);
        setCharCount(value.length);
      }
    },
    [setPrompt]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (suggestion.length <= maxChars) {
        setPrompt(suggestion);
        setCharCount(suggestion.length);
      }
    },
    [setPrompt]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !sourceImage) return;

    setIsGenerating(true);
    setGenerationError(null);
    setMode('generate');

    try {
      // TODO: Call Convex action for Gemini 3 Pro Image generation
      // For now, simulate generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Placeholder - will be replaced with actual generation
      setGeneratedImage(sourceImage); // Just show the original for now
      setMode('result');
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to generate visualization'
      );
      setMode('edit');
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt,
    sourceImage,
    setIsGenerating,
    setGenerationError,
    setMode,
    setGeneratedImage,
  ]);

  const canGenerate = prompt.trim().length > 0 && sourceImage && !isGenerating;

  return (
    <div className="bg-white dark:bg-stone-900 border-t-2 border-stone-300 dark:border-stone-600 p-4">
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
          Suggestions:
        </span>
        {PROMPT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => handleSuggestionClick(suggestion.prompt)}
            className="px-2 py-1 text-xs font-medium rounded-full
              bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300
              hover:bg-purple-200 dark:hover:bg-purple-800
              transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      {/* Prompt Input */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Describe what you want to add or change (e.g., 'Add a 3-story mixed-use building with brick facade')"
            className="w-full h-20 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800
              border-2 border-stone-300 dark:border-stone-600 rounded-lg
              focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200
              resize-none"
            disabled={isGenerating}
          />
          <span className="absolute bottom-2 right-2 text-xs text-stone-400">
            {charCount}/{maxChars}
          </span>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-black
            font-bold text-white
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            active:translate-y-2 active:shadow-none
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            transition-all duration-100
            ${
              canGenerate
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                : 'bg-stone-400'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Zoning context indicator */}
      {zoningContext && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          Zoning context ({zoningContext.zoningDistrict}) will be automatically included
          in the generation prompt.
        </p>
      )}
    </div>
  );
}
