'use client'

import { useState } from 'react'
import type { VisionCardProps } from '../types'

export function VisionCard({
  visualization,
  showBefore: controlledShowBefore,
  onToggleView,
  onRegenerate,
  onSave,
  onShare,
}: VisionCardProps) {
  const [internalShowBefore, setInternalShowBefore] = useState(false)
  const showBefore = controlledShowBefore ?? internalShowBefore

  const handleToggle = (value: boolean) => {
    if (onToggleView) {
      onToggleView(value)
    } else {
      setInternalShowBefore(value)
    }
  }

  // Get style label from id
  const styleLabel = visualization.parameters.style
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Get building type label
  const typeLabel = visualization.parameters.buildingType.toUpperCase()

  return (
    <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-black dark:border-stone-600 bg-stone-50 dark:bg-stone-900">
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100">
            {visualization.address}
          </h3>
          <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
            {visualization.neighborhood} • Your {typeLabel} Preview
          </p>
        </div>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[16/10] bg-stone-200 dark:bg-stone-700 overflow-hidden">
        {/* Placeholder visualization image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showBefore ? (
            // Before state - street view placeholder
            <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-600 dark:to-stone-700 flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-stone-500 dark:text-stone-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="font-mono text-sm text-stone-600 dark:text-stone-400">Current Street View</p>
              <p className="font-mono text-xs text-stone-500 dark:text-stone-500 mt-1">Satellite imagery of existing property</p>
            </div>
          ) : (
            // After state - generated visualization placeholder
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-amber-50 to-sky-100 dark:from-amber-900/30 dark:via-stone-800 dark:to-sky-900/30 flex flex-col items-center justify-center relative">
              {/* Decorative house illustration */}
              <div className="relative">
                <div className="w-32 h-24 bg-amber-200 dark:bg-amber-700 rounded-t-lg border-2 border-amber-400 dark:border-amber-600" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[70px] border-r-[70px] border-b-[40px] border-l-transparent border-r-transparent border-b-amber-300 dark:border-b-amber-600" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-12 bg-amber-600 dark:bg-amber-800 rounded-t-lg" />
                <div className="absolute bottom-6 left-4 w-6 h-6 bg-sky-200 dark:bg-sky-700 border border-sky-400 dark:border-sky-600" />
                <div className="absolute bottom-6 right-4 w-6 h-6 bg-sky-200 dark:bg-sky-700 border border-sky-400 dark:border-sky-600" />
              </div>
              <p className="font-heading font-bold text-amber-800 dark:text-amber-300 mt-4">{styleLabel} {typeLabel}</p>
              <p className="font-mono text-xs text-amber-600 dark:text-amber-400">{visualization.parameters.squareFootage} sq ft • {visualization.parameters.stories} story</p>

              {/* AI Generated badge */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-violet-500 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI Generated
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Before/After Toggle */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
        <button
          onClick={() => handleToggle(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-heading font-semibold text-sm transition-all ${
            showBefore
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Before
        </button>

        <div className="flex-1 max-w-32 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: showBefore ? '0%' : '100%' }}
          />
        </div>

        <button
          onClick={() => handleToggle(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-heading font-semibold text-sm transition-all ${
            !showBefore
              ? 'bg-sky-500 text-white'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600'
          }`}
        >
          After
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Specs Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-body text-xs text-stone-500 dark:text-stone-400">Style:</span>
            <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">{styleLabel}</span>
          </div>
          <div className="w-px h-4 bg-stone-300 dark:bg-stone-600" />
          <div className="flex items-center gap-1.5">
            <span className="font-body text-xs text-stone-500 dark:text-stone-400">Type:</span>
            <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">{typeLabel} ({visualization.parameters.squareFootage} sq ft)</span>
          </div>
        </div>
      </div>

      {/* Compliance Indicators */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex flex-wrap gap-3">
          {visualization.complianceChecks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono ${
                check.isCompliant
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {check.isCompliant ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{check.label}: {check.actual}</span>
              <span className="text-stone-400 dark:text-stone-500">({check.requirement})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-800">
        <button
          onClick={onRegenerate}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-stone-100 dark:bg-stone-700 border-2 border-black dark:border-stone-500 font-heading font-bold text-sm text-stone-900 dark:text-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(68,64,60,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Try Another Style
        </button>

        <button
          onClick={onSave}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-500 font-heading font-bold text-sm text-stone-900 dark:text-stone-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(68,64,60,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Save
        </button>

        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 border-2 border-black dark:border-sky-400 font-heading font-bold text-sm text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  )
}
