'use client';

import { useCallback } from 'react';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Trees,
  Compass,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { useVisualizerStore } from '@/stores';

/**
 * SiteAnalysisResultView - Displays structured site analysis results
 * from the Gemini 3 Flash multimodal analysis action.
 * Uses RetroUI neobrutalist styling consistent with other cards.
 */
export function SiteAnalysisResultView() {
  const {
    analysisResult,
    sourceImage,
    address,
    setMode,
    setAnalysisResult,
    setAnalysisError,
  } = useVisualizerStore();

  const handleBackToEdit = useCallback(() => {
    setMode('edit');
    setAnalysisResult(null);
    setAnalysisError(null);
  }, [setMode, setAnalysisResult, setAnalysisError]);

  if (!analysisResult) return null;

  const { siteDescription, contextAnalysis, developmentPotential, questionsToInvestigate, analysisTimeMs } = analysisResult;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
              border-2 border-black dark:border-white
              bg-white dark:bg-stone-800
              shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]
              hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </button>
          {address && (
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{address}</span>
            </div>
          )}
          {analysisTimeMs && (
            <div className="flex items-center gap-1 text-xs text-stone-400 ml-auto">
              <Clock className="w-3 h-3" />
              <span>Analyzed in {(analysisTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* Source image preview */}
        {sourceImage && (
          <div className="border-2 border-black dark:border-white rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
            <img
              src={sourceImage}
              alt="Analyzed site"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Site Description */}
        <section className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <h2 className="flex items-center gap-2 text-lg font-bold font-head mb-3">
            <MapPin className="w-5 h-5 text-sky-500" />
            Site Description
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {siteDescription.lotCharacteristics && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Lot Characteristics</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{siteDescription.lotCharacteristics}</p>
              </div>
            )}
            {siteDescription.existingConditions && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Existing Conditions</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{siteDescription.existingConditions}</p>
              </div>
            )}
            {siteDescription.topography && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Topography</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{siteDescription.topography}</p>
              </div>
            )}
            {siteDescription.vegetation && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  <Trees className="w-3 h-3 inline mr-1" />
                  Vegetation
                </p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{siteDescription.vegetation}</p>
              </div>
            )}
          </div>
        </section>

        {/* Context Analysis */}
        <section className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <h2 className="flex items-center gap-2 text-lg font-bold font-head mb-3">
            <Building2 className="w-5 h-5 text-amber-500" />
            Context Analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contextAnalysis.adjacentBuildings && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Adjacent Buildings</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{contextAnalysis.adjacentBuildings}</p>
              </div>
            )}
            {contextAnalysis.neighborhoodCharacter && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Neighborhood Character</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{contextAnalysis.neighborhoodCharacter}</p>
              </div>
            )}
            {contextAnalysis.streetType && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  <Compass className="w-3 h-3 inline mr-1" />
                  Street Type
                </p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{contextAnalysis.streetType}</p>
              </div>
            )}
            {contextAnalysis.pedestrianEnvironment && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Pedestrian Environment</p>
                <p className="text-sm text-stone-800 dark:text-stone-200">{contextAnalysis.pedestrianEnvironment}</p>
              </div>
            )}
          </div>
        </section>

        {/* Development Potential */}
        <section className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
          <h2 className="flex items-center gap-2 text-lg font-bold font-head mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Development Potential
          </h2>

          {/* Suitable Uses */}
          {developmentPotential.suitableUses && developmentPotential.suitableUses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Suitable Uses</p>
              <div className="flex flex-wrap gap-2">
                {developmentPotential.suitableUses.map((use, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Capacity */}
          {developmentPotential.estimatedCapacity && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Estimated Capacity</p>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{developmentPotential.estimatedCapacity}</p>
            </div>
          )}

          {/* Design Considerations */}
          {developmentPotential.designConsiderations && developmentPotential.designConsiderations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Design Considerations</p>
              <ul className="space-y-1">
                {developmentPotential.designConsiderations.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges and Opportunities side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {developmentPotential.challenges && developmentPotential.challenges.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Challenges</p>
                <ul className="space-y-1">
                  {developmentPotential.challenges.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {developmentPotential.opportunities && developmentPotential.opportunities.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Opportunities</p>
                <ul className="space-y-1">
                  {developmentPotential.opportunities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                      <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Questions to Investigate */}
        {questionsToInvestigate && questionsToInvestigate.length > 0 && (
          <section className="border-2 border-black dark:border-white rounded-lg p-4 bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
            <h2 className="flex items-center gap-2 text-lg font-bold font-head mb-3">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              Questions to Investigate
            </h2>
            <ul className="space-y-2">
              {questionsToInvestigate.map((question, i) => (
                <li
                  key={i}
                  className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300"
                >
                  {question}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
