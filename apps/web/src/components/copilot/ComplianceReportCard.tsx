"use client";

/**
 * ComplianceReportCard - Full compliance analysis report card
 *
 * The centerpiece visual output for the hackathon demo. Displays a structured
 * compliance report with 8 collapsible sections, color-coded badges, and
 * rich data tables. Receives the full ComplianceAnalysisResult from the
 * Gemini HIGH thinking analysis pipeline.
 *
 * Follows RetroUI neobrutalist styling patterns.
 */

import { useState } from "react";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Ruler,
  Building2,
  MapPin,
  Scale,
  Sparkles,
  ListOrdered,
  AlertOctagon,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ComplianceReportCardData,
  DimensionalComplianceItem,
  UseComplianceItem,
  VarianceRequiredItem,
  IncentiveOpportunityItem,
  RecommendedNextStep,
  RiskAssessmentItem,
} from "@/components/chat/types";

// =============================================================================
// Props
// =============================================================================

export interface ComplianceReportCardProps extends ComplianceReportCardData {}

// =============================================================================
// Status Helpers
// =============================================================================

const OVERALL_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof CheckCircle }
> = {
  compliant: {
    label: "Compliant",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-500",
    icon: CheckCircle,
  },
  variances_required: {
    label: "Variances Required",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-400",
    icon: AlertTriangle,
  },
  non_compliant: {
    label: "Non-Compliant",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-500",
    icon: XCircle,
  },
};

const DIMENSIONAL_STATUS_ICON: Record<
  string,
  { icon: typeof CheckCircle; color: string }
> = {
  compliant: { icon: CheckCircle, color: "text-green-500" },
  variance_required: { icon: AlertTriangle, color: "text-amber-500" },
  non_compliant: { icon: XCircle, color: "text-red-500" },
};

const PERMISSION_LEVEL_COLORS: Record<string, string> = {
  permitted:
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
  conditional:
    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  prohibited:
    "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
};

const LIKELIHOOD_COLORS: Record<string, string> = {
  high: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  medium: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  low: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
};

const ELIGIBILITY_COLORS: Record<string, string> = {
  eligible:
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
  possibly_eligible:
    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  not_eligible:
    "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-600",
};

const ELIGIBILITY_LABELS: Record<string, string> = {
  eligible: "Eligible",
  possibly_eligible: "Possibly Eligible",
  not_eligible: "Not Eligible",
};

// =============================================================================
// Collapsible Section Component
// =============================================================================

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  icon: typeof FileText;
  iconColor: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stone-200 dark:border-stone-700 last:border-b-0">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", iconColor)} />
          <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
            {title}
          </span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ComplianceReportCard({
  address,
  zoningDistrict,
  analysisDate,
  overallStatus,
  analysis,
}: ComplianceReportCardProps) {
  const statusConfig =
    OVERALL_STATUS_CONFIG[overallStatus] || OVERALL_STATUS_CONFIG.non_compliant;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="border-2 border-black dark:border-white rounded-lg bg-white dark:bg-stone-900 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Header / Status */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg border border-purple-300 dark:border-purple-700">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
              Compliance Analysis
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {address && (
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  {address}
                </span>
              )}
              {zoningDistrict && (
                <span className="px-2 py-0.5 text-xs font-mono bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded border border-sky-300 dark:border-sky-700">
                  {zoningDistrict}
                </span>
              )}
            </div>
            {analysisDate && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {analysisDate}
                </span>
              </div>
            )}
          </div>
          {/* Overall status badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-bold text-sm border-2 border-black dark:border-white shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white]",
              statusConfig.bgColor
            )}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Collapsible Sections */}
      {/* ------------------------------------------------------------------ */}
      <div>
        {/* Executive Summary */}
        <CollapsibleSection
          title="Executive Summary"
          icon={FileText}
          iconColor="text-purple-500"
          defaultOpen={true}
        >
          <div className="space-y-3">
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {analysis.executiveSummary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.approvalPathway && (
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Approval Pathway
                  </span>
                  <p className="text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                    {analysis.approvalPathway}
                  </p>
                </div>
              )}
              {analysis.estimatedTimeline && (
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Estimated Timeline
                  </span>
                  <p className="text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                    {analysis.estimatedTimeline}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Dimensional Compliance */}
        {analysis.dimensionalCompliance.length > 0 && (
          <CollapsibleSection
            title="Dimensional Compliance"
            icon={Ruler}
            iconColor="text-sky-500"
            defaultOpen={true}
            badge={
              <DimensionalBadgeSummary
                items={analysis.dimensionalCompliance}
              />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-stone-300 dark:border-stone-600">
                    <th className="text-left py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Requirement
                    </th>
                    <th className="text-left py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Standard
                    </th>
                    <th className="text-left py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Proposed
                    </th>
                    <th className="text-center py-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.dimensionalCompliance.map(
                    (item: DimensionalComplianceItem, i: number) => {
                      const statusInfo =
                        DIMENSIONAL_STATUS_ICON[item.status] ||
                        DIMENSIONAL_STATUS_ICON.non_compliant;
                      const RowIcon = statusInfo.icon;
                      return (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-stone-100 dark:border-stone-800",
                            i % 2 === 0
                              ? "bg-white dark:bg-stone-900"
                              : "bg-stone-50 dark:bg-stone-800/50"
                          )}
                        >
                          <td className="py-2 pr-2 text-stone-900 dark:text-stone-100 font-medium">
                            {item.requirement}
                          </td>
                          <td className="py-2 pr-2 text-stone-600 dark:text-stone-400">
                            {item.standard}
                          </td>
                          <td className="py-2 pr-2 text-stone-600 dark:text-stone-400">
                            {item.proposed}
                          </td>
                          <td className="py-2 text-center">
                            <RowIcon
                              className={cn("w-4 h-4 mx-auto", statusInfo.color)}
                            />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Use Compliance */}
        {analysis.useCompliance.length > 0 && (
          <CollapsibleSection
            title="Use Compliance"
            icon={Building2}
            iconColor="text-amber-500"
          >
            <div className="space-y-2">
              {analysis.useCompliance.map(
                (item: UseComplianceItem, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {item.use}
                      </span>
                      {item.notes && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded border capitalize flex-shrink-0 ml-2",
                        PERMISSION_LEVEL_COLORS[item.permissionLevel] ||
                          PERMISSION_LEVEL_COLORS.prohibited
                      )}
                    >
                      {item.permissionLevel}
                    </span>
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Area Plan Alignment */}
        {analysis.areaPlanAlignment && (
          <CollapsibleSection
            title="Area Plan Alignment"
            icon={MapPin}
            iconColor="text-green-500"
            badge={
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 ml-1">
                {analysis.areaPlanAlignment.score}/100
              </span>
            }
          >
            <div className="space-y-3">
              {/* Score bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    Alignment Score
                  </span>
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {analysis.areaPlanAlignment.score}%
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      analysis.areaPlanAlignment.score >= 70
                        ? "bg-green-500"
                        : analysis.areaPlanAlignment.score >= 40
                          ? "bg-amber-400"
                          : "bg-red-500"
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(0, analysis.areaPlanAlignment.score))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Aligned elements */}
              {analysis.areaPlanAlignment.alignedElements.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Aligned Elements
                  </span>
                  <ul className="mt-1 space-y-1">
                    {analysis.areaPlanAlignment.alignedElements.map(
                      (el, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {el}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {analysis.areaPlanAlignment.concerns.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Concerns
                  </span>
                  <ul className="mt-1 space-y-1">
                    {analysis.areaPlanAlignment.concerns.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.areaPlanAlignment.recommendations.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Recommendations
                  </span>
                  <ul className="mt-1 space-y-1">
                    {analysis.areaPlanAlignment.recommendations.map(
                      (r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
                          {r}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Variances Required */}
        {analysis.variancesRequired.length > 0 && (
          <CollapsibleSection
            title={`Variances Required (${analysis.variancesRequired.length})`}
            icon={Scale}
            iconColor="text-amber-500"
            defaultOpen={true}
          >
            <div className="space-y-3">
              {analysis.variancesRequired.map(
                (item: VarianceRequiredItem, i: number) => (
                  <div
                    key={i}
                    className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                        {item.type}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded capitalize flex-shrink-0",
                          LIKELIHOOD_COLORS[item.approvalLikelihood] ||
                            LIKELIHOOD_COLORS.low
                        )}
                      >
                        {item.approvalLikelihood} likelihood
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-500 dark:text-stone-400">
                          Standard:
                        </span>{" "}
                        <span className="text-stone-700 dark:text-stone-300">
                          {item.standardRequired}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 dark:text-stone-400">
                          Proposed:
                        </span>{" "}
                        <span className="text-stone-700 dark:text-stone-300">
                          {item.proposed}
                        </span>
                      </div>
                    </div>
                    {item.hardshipBasis && (
                      <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 italic">
                        Hardship: {item.hardshipBasis}
                      </p>
                    )}
                    {item.precedentNotes && (
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                        Precedent: {item.precedentNotes}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Incentive Opportunities */}
        {analysis.incentiveOpportunities.length > 0 && (
          <CollapsibleSection
            title={`Incentive Opportunities (${analysis.incentiveOpportunities.length})`}
            icon={Sparkles}
            iconColor="text-green-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.incentiveOpportunities.map(
                (item: IncentiveOpportunityItem, i: number) => (
                  <div
                    key={i}
                    className="p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                        {item.program}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded border capitalize flex-shrink-0",
                          ELIGIBILITY_COLORS[item.eligibility] ||
                            ELIGIBILITY_COLORS.not_eligible
                        )}
                      >
                        {ELIGIBILITY_LABELS[item.eligibility] ||
                          item.eligibility}
                      </span>
                    </div>
                    {item.estimatedBenefit && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Est. Benefit: {item.estimatedBenefit}
                      </p>
                    )}
                    {item.requirements && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {item.requirements}
                      </p>
                    )}
                    {item.nextSteps && (
                      <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                        Next: {item.nextSteps}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Recommended Next Steps */}
        {analysis.recommendedNextSteps.length > 0 && (
          <CollapsibleSection
            title="Recommended Next Steps"
            icon={ListOrdered}
            iconColor="text-sky-500"
            defaultOpen={true}
          >
            <ol className="space-y-3">
              {analysis.recommendedNextSteps.map(
                (item: RecommendedNextStep, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-sm font-bold border border-sky-300 dark:border-sky-700">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {item.action}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {item.rationale}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ol>
          </CollapsibleSection>
        )}

        {/* Risk Assessment */}
        {analysis.riskAssessment.length > 0 && (
          <CollapsibleSection
            title="Risk Assessment"
            icon={AlertOctagon}
            iconColor="text-red-500"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-stone-300 dark:border-stone-600">
                    <th className="text-left py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Risk
                    </th>
                    <th className="text-center py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Likelihood
                    </th>
                    <th className="text-center py-2 pr-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Impact
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Mitigation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.riskAssessment.map(
                    (item: RiskAssessmentItem, i: number) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-stone-100 dark:border-stone-800",
                          i % 2 === 0
                            ? "bg-white dark:bg-stone-900"
                            : "bg-stone-50 dark:bg-stone-800/50"
                        )}
                      >
                        <td className="py-2 pr-2 text-stone-900 dark:text-stone-100 font-medium">
                          {item.risk}
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded capitalize",
                              LIKELIHOOD_COLORS[item.likelihood] ||
                                LIKELIHOOD_COLORS.medium
                            )}
                          >
                            {item.likelihood}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded capitalize",
                              LIKELIHOOD_COLORS[item.impact] ||
                                LIKELIHOOD_COLORS.medium
                            )}
                          >
                            {item.impact}
                          </span>
                        </td>
                        <td className="py-2 text-stone-600 dark:text-stone-400 text-xs">
                          {item.mitigation}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

/** Mini summary badge showing dimensional compliance counts */
function DimensionalBadgeSummary({
  items,
}: {
  items: DimensionalComplianceItem[];
}) {
  const compliant = items.filter((i) => i.status === "compliant").length;
  const variance = items.filter(
    (i) => i.status === "variance_required"
  ).length;
  const nonCompliant = items.filter(
    (i) => i.status === "non_compliant"
  ).length;

  return (
    <div className="flex items-center gap-1 ml-2">
      {compliant > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          {compliant}
        </span>
      )}
      {variance > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          {variance}
        </span>
      )}
      {nonCompliant > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          {nonCompliant}
        </span>
      )}
    </div>
  );
}

export default ComplianceReportCard;
