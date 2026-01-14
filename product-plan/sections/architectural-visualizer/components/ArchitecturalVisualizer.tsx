'use client'

import { useState } from 'react'
import type { ArchitecturalVisualizerProps } from '../types'
import { VisionCard } from './VisionCard'
import { PromptInput } from './PromptInput'
import { PresetSelector } from './PresetSelector'
import { GenerationStatus } from './GenerationStatus'
import { CompliancePanel } from './CompliancePanel'

export function ArchitecturalVisualizer({
  visualization,
  buildingTypes,
  buildingStyles,
  storyOptions,
  generationStates,
  onPromptSubmit,
  onPresetsChange,
  onRegenerate,
  onSave,
  onShare,
}: ArchitecturalVisualizerProps) {
  const [prompt, setPrompt] = useState('')
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [showBefore, setShowBefore] = useState(false)
  const [isComplianceExpanded, setIsComplianceExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState(visualization.parameters.buildingType)
  const [selectedStyle, setSelectedStyle] = useState(visualization.parameters.style)
  const [selectedStories, setSelectedStories] = useState(visualization.parameters.stories)

  const handlePromptSubmit = (value: string) => {
    onPromptSubmit?.(value)
    setPrompt('')
  }

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId)
    onPresetsChange?.({ buildingType: typeId })
  }

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId)
    onPresetsChange?.({ style: styleId })
  }

  const handleStoriesChange = (stories: number) => {
    setSelectedStories(stories)
    onPresetsChange?.({ stories })
  }

  const isGenerating = ['analyzing', 'fetching', 'generating'].includes(visualization.status)
  const showResult = visualization.status === 'completed'

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-mono text-xs font-bold mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI-Powered Visualization
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 mb-2">
            Architectural Visualizer
          </h1>
          <p className="font-body text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
            Describe your vision and see it come to life. Our AI generates photorealistic renders that respect Milwaukee's zoning codes.
          </p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col items-center space-y-6">
          {/* Prompt Input */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            isVoiceActive={isVoiceActive}
            onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
            isDisabled={isGenerating}
            placeholder="Show me what a small apartment for my mom would look like in my backyard..."
          />

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <div className="flex-1 h-px bg-stone-300 dark:bg-stone-700" />
            <span className="font-mono text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              or use presets
            </span>
            <div className="flex-1 h-px bg-stone-300 dark:bg-stone-700" />
          </div>

          {/* Preset Selector */}
          <PresetSelector
            buildingTypes={buildingTypes}
            buildingStyles={buildingStyles}
            storyOptions={storyOptions}
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            selectedStories={selectedStories}
            onTypeChange={handleTypeChange}
            onStyleChange={handleStyleChange}
            onStoriesChange={handleStoriesChange}
          />
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="flex justify-center">
            <GenerationStatus
              status={visualization.status}
              states={generationStates}
              progress={generationStates[visualization.status]?.progress}
            />
          </div>
        )}

        {/* Result Section */}
        {showResult && (
          <div className="space-y-6">
            {/* Vision Card */}
            <div className="flex justify-center">
              <VisionCard
                visualization={visualization}
                showBefore={showBefore}
                onToggleView={setShowBefore}
                onRegenerate={onRegenerate}
                onSave={onSave}
                onShare={onShare}
              />
            </div>

            {/* Compliance Panel */}
            <div className="flex justify-center">
              <CompliancePanel
                constraints={visualization.zoningConstraints}
                checks={visualization.complianceChecks}
                isExpanded={isComplianceExpanded}
                onToggleExpand={() => setIsComplianceExpanded(!isComplianceExpanded)}
              />
            </div>

            {/* Voice Narration */}
            {visualization.voiceNarration && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-xs text-amber-600 dark:text-amber-400 mb-1">AI Voice Summary</p>
                    <p className="font-body text-sm text-amber-900 dark:text-amber-100">
                      {visualization.voiceNarration}
                    </p>
                  </div>
                  <button className="flex-shrink-0 p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {visualization.status === 'idle' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-stone-400 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-lg text-stone-700 dark:text-stone-300 mb-2">
              Ready to visualize
            </h3>
            <p className="font-body text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Enter a prompt or select presets above to generate an AI visualization of your property.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
