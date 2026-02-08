"use client";

/**
 * SiteAnalysisCard - Visual site analysis results from image assessment
 *
 * Displays structured site analysis from Gemini multimodal assessment:
 * - Site Description (lot characteristics, conditions, topography, vegetation)
 * - Context Analysis (adjacent buildings, neighborhood character, street type)
 * - Development Potential (suitable uses, capacity, considerations, challenges)
 * - Questions to Investigate (clickable items that populate chat input)
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import {
  Camera,
  Landmark,
  Trees,
  Building2,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteAnalysisCardData } from "@/components/chat/types";

// =============================================================================
// Props
// =============================================================================

export interface SiteAnalysisCardProps extends SiteAnalysisCardData {
  onAskQuestion?: (question: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function SiteAnalysisCard({
  siteDescription,
  contextAnalysis,
  developmentPotential,
  questionsToInvestigate,
  onAskQuestion,
}: SiteAnalysisCardProps) {
  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-teal-50 dark:bg-teal-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg border border-teal-300 dark:border-teal-700">
            <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
              Site Analysis
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              AI-powered visual assessment of development potential
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* -------------------------------------------------------------- */}
        {/* Site Description */}
        {/* -------------------------------------------------------------- */}
        {hasSiteDescription(siteDescription) && (
          <section>
            <SectionHeader
              icon={Trees}
              iconColor="text-green-500"
              title="Site Description"
            />
            <div className="space-y-2 mt-2">
              {siteDescription.lotCharacteristics && (
                <DescriptionRow
                  label="Lot Characteristics"
                  value={siteDescription.lotCharacteristics}
                />
              )}
              {siteDescription.existingConditions && (
                <DescriptionRow
                  label="Existing Conditions"
                  value={siteDescription.existingConditions}
                />
              )}
              {siteDescription.topography && (
                <DescriptionRow
                  label="Topography"
                  value={siteDescription.topography}
                />
              )}
              {siteDescription.vegetation && (
                <DescriptionRow
                  label="Vegetation"
                  value={siteDescription.vegetation}
                />
              )}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Context Analysis */}
        {/* -------------------------------------------------------------- */}
        {hasContextAnalysis(contextAnalysis) && (
          <section>
            <SectionHeader
              icon={Landmark}
              iconColor="text-sky-500"
              title="Context Analysis"
            />
            <div className="space-y-2 mt-2">
              {contextAnalysis.adjacentBuildings && (
                <DescriptionRow
                  label="Adjacent Buildings"
                  value={contextAnalysis.adjacentBuildings}
                />
              )}
              {contextAnalysis.neighborhoodCharacter && (
                <DescriptionRow
                  label="Neighborhood Character"
                  value={contextAnalysis.neighborhoodCharacter}
                />
              )}
              {contextAnalysis.streetType && (
                <DescriptionRow
                  label="Street Type"
                  value={contextAnalysis.streetType}
                />
              )}
              {contextAnalysis.pedestrianEnvironment && (
                <DescriptionRow
                  label="Pedestrian Environment"
                  value={contextAnalysis.pedestrianEnvironment}
                />
              )}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Development Potential */}
        {/* -------------------------------------------------------------- */}
        {hasDevelopmentPotential(developmentPotential) && (
          <section>
            <SectionHeader
              icon={Building2}
              iconColor="text-purple-500"
              title="Development Potential"
            />
            <div className="space-y-3 mt-2">
              {/* Suitable Uses */}
              {developmentPotential.suitableUses &&
                developmentPotential.suitableUses.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Suitable Uses
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {developmentPotential.suitableUses.map((use, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded border border-purple-300 dark:border-purple-700"
                        >
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Estimated Capacity */}
              {developmentPotential.estimatedCapacity && (
                <div className="flex items-start gap-2 p-2 bg-stone-50 dark:bg-stone-800 rounded">
                  <TrendingUp className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Estimated Capacity
                    </span>
                    <p className="text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                      {developmentPotential.estimatedCapacity}
                    </p>
                  </div>
                </div>
              )}

              {/* Design Considerations */}
              {developmentPotential.designConsiderations &&
                developmentPotential.designConsiderations.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Design Considerations
                    </span>
                    <ul className="mt-1 space-y-1">
                      {developmentPotential.designConsiderations.map(
                        (item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Challenges & Opportunities side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Challenges */}
                {developmentPotential.challenges &&
                  developmentPotential.challenges.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Challenges
                      </span>
                      <ul className="mt-1 space-y-1">
                        {developmentPotential.challenges.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Opportunities */}
                {developmentPotential.opportunities &&
                  developmentPotential.opportunities.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Opportunities
                      </span>
                      <ul className="mt-1 space-y-1">
                        {developmentPotential.opportunities.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Questions to Investigate */}
        {/* -------------------------------------------------------------- */}
        {questionsToInvestigate && questionsToInvestigate.length > 0 && (
          <section>
            <SectionHeader
              icon={HelpCircle}
              iconColor="text-amber-500"
              title="Questions to Investigate"
            />
            <div className="space-y-1.5 mt-2">
              {questionsToInvestigate.map((question, i) => (
                <button
                  key={i}
                  onClick={() => onAskQuestion?.(question)}
                  className={cn(
                    "w-full text-left flex items-center gap-2 p-2.5 rounded-lg border transition-all group",
                    onAskQuestion
                      ? "border-stone-200 dark:border-stone-700 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 cursor-pointer"
                      : "border-stone-200 dark:border-stone-700 cursor-default"
                  )}
                  disabled={!onAskQuestion}
                >
                  <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    {question}
                  </span>
                  {onAskQuestion && (
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-sky-500 transition-colors flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function SectionHeader({
  icon: Icon,
  iconColor,
  title,
}: {
  icon: typeof Trees;
  iconColor: string;
  title: string;
}) {
  return (
    <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
      <Icon className={cn("w-4 h-4", iconColor)} />
      {title}
    </h4>
  );
}

function DescriptionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded">
      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// Type Guards
// =============================================================================

function hasSiteDescription(
  sd: SiteAnalysisCardData["siteDescription"]
): boolean {
  return !!(
    sd.lotCharacteristics ||
    sd.existingConditions ||
    sd.topography ||
    sd.vegetation
  );
}

function hasContextAnalysis(
  ca: SiteAnalysisCardData["contextAnalysis"]
): boolean {
  return !!(
    ca.adjacentBuildings ||
    ca.neighborhoodCharacter ||
    ca.streetType ||
    ca.pedestrianEnvironment
  );
}

function hasDevelopmentPotential(
  dp: SiteAnalysisCardData["developmentPotential"]
): boolean {
  return !!(
    (dp.suitableUses && dp.suitableUses.length > 0) ||
    dp.estimatedCapacity ||
    (dp.designConsiderations && dp.designConsiderations.length > 0) ||
    (dp.challenges && dp.challenges.length > 0) ||
    (dp.opportunities && dp.opportunities.length > 0)
  );
}

export default SiteAnalysisCard;
