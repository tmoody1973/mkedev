'use client'

import {
  MapPin,
  Building2,
  DollarSign,
  FileText,
  ClipboardList,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  Clock,
} from 'lucide-react'
import type {
  GenerativeCard,
  ZoneInfoCardData,
  ParcelAnalysisCardData,
  IncentivesSummaryCardData,
  AreaPlanContextCardData,
  PermitProcessCardData,
  CodeCitationCardData,
  OpportunityListCardData,
} from '../types'

// =============================================================================
// Shared Card Wrapper
// =============================================================================

interface CardWrapperProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  accentColor?: 'sky' | 'amber' | 'emerald' | 'rose' | 'violet'
  children: React.ReactNode
  onAction?: (action: string, data: unknown) => void
}

function CardWrapper({
  icon,
  title,
  subtitle,
  accentColor = 'sky',
  children,
}: CardWrapperProps) {
  const accentClasses = {
    sky: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 border-sky-500',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-500',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-500',
    rose: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-500',
    violet: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 border-violet-500',
  }

  return (
    <div className="mt-3 rounded-lg border-2 border-black dark:border-stone-600 bg-stone-50 dark:bg-stone-900 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
      {/* Card Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b-2 border-black dark:border-stone-600 ${accentClasses[accentColor]}`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-sm truncate">{title}</h4>
          {subtitle && (
            <p className="text-xs opacity-80 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Card Content */}
      <div className="p-4">{children}</div>
    </div>
  )
}

// =============================================================================
// Zone Info Card
// =============================================================================

function ZoneInfoCard({ data }: { data: ZoneInfoCardData }) {
  return (
    <CardWrapper
      icon={<Building2 className="w-5 h-5" />}
      title={`${data.zoneCode} — ${data.zoneName}`}
      subtitle={`Code Section ${data.codeSection}`}
      accentColor="sky"
    >
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 font-body">
        {data.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Max Height</span>
          <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{data.maxHeight}</span>
        </div>
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Min Lot Size</span>
          <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{data.minLotSize}</span>
        </div>
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Max Coverage</span>
          <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{data.maxLotCoverage}</span>
        </div>
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">ADU Permitted</span>
          <span className={`font-mono text-sm font-semibold ${data.aduPermitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {data.aduPermitted ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Setbacks</h5>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
            Front: {data.frontSetback}
          </span>
          <span className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
            Side: {data.sideSetback}
          </span>
          <span className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
            Rear: {data.rearSetback}
          </span>
        </div>
      </div>
    </CardWrapper>
  )
}

// =============================================================================
// Parcel Analysis Card
// =============================================================================

function ParcelAnalysisCard({ data }: { data: ParcelAnalysisCardData }) {
  const statusConfig = {
    permitted: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', label: 'Permitted' },
    conditional: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', label: 'Conditional Use' },
    prohibited: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', label: 'Prohibited' },
  }

  const status = statusConfig[data.feasibilityStatus]
  const StatusIcon = status.icon

  return (
    <CardWrapper
      icon={<MapPin className="w-5 h-5" />}
      title="Parcel Feasibility Analysis"
      subtitle={data.address}
      accentColor={data.feasibilityStatus === 'permitted' ? 'emerald' : data.feasibilityStatus === 'conditional' ? 'amber' : 'rose'}
    >
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${status.bg} ${status.color} mb-4`}>
        <StatusIcon className="w-5 h-5" />
        <span className="font-bold text-sm">{status.label}</span>
        <span className="text-sm opacity-80">for {data.proposedUse}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-stone-500 dark:text-stone-400 block">Tax Key</span>
          <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{data.taxKey}</span>
        </div>
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-stone-500 dark:text-stone-400 block">Lot Size</span>
          <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{data.lotSize}</span>
        </div>
        <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-stone-500 dark:text-stone-400 block">Current Use</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">{data.currentUse}</span>
        </div>
      </div>

      {data.requirements.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Requirements</h5>
          <ul className="space-y-1">
            {data.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                <span className="text-sky-500 mt-1">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.nextSteps.length > 0 && (
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Next Steps</h5>
          <ul className="space-y-1">
            {data.nextSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardWrapper>
  )
}

// =============================================================================
// Incentives Summary Card
// =============================================================================

function IncentivesSummaryCard({ data }: { data: IncentivesSummaryCardData }) {
  const statusConfig = {
    eligible: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', label: 'Eligible' },
    'not-applicable': { color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-stone-800', label: 'N/A' },
    'requires-review': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', label: 'Review' },
  }

  return (
    <CardWrapper
      icon={<DollarSign className="w-5 h-5" />}
      title="Available Incentives"
      subtitle={data.address}
      accentColor="amber"
    >
      <div className="space-y-3 mb-4">
        {data.incentives.map((incentive, i) => {
          const status = statusConfig[incentive.status]
          return (
            <div
              key={i}
              className="p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">{incentive.name}</h5>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{incentive.type}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                    {incentive.amount}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{incentive.description}</p>
              <p className="text-xs text-stone-500 dark:text-stone-500 italic">Eligibility: {incentive.eligibility}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700">
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Total Potential Value</span>
        <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{data.totalPotentialValue}</span>
      </div>

      {data.recommendation && (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 italic border-l-2 border-sky-500 pl-3">
          {data.recommendation}
        </p>
      )}
    </CardWrapper>
  )
}

// =============================================================================
// Area Plan Context Card
// =============================================================================

function AreaPlanContextCard({ data }: { data: AreaPlanContextCardData }) {
  const alignmentColor =
    data.alignmentScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : data.alignmentScore >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400'

  return (
    <CardWrapper
      icon={<FileText className="w-5 h-5" />}
      title={data.planName}
      subtitle={`Adopted ${data.adoptedDate}`}
      accentColor="violet"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Future Land Use</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">{data.futureLandUse}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Alignment</span>
          <span className={`font-mono text-2xl font-bold ${alignmentColor}`}>{data.alignmentScore}%</span>
        </div>
      </div>

      {data.communityGoals.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Community Goals</h5>
          <ul className="space-y-1">
            {data.communityGoals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.relevantRecommendations.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Relevant Recommendations</h5>
          <ul className="space-y-1">
            {data.relevantRecommendations.map((rec, i) => (
              <li key={i} className="text-sm text-stone-700 dark:text-stone-300 pl-4 border-l-2 border-violet-300 dark:border-violet-700">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.concerns.length > 0 && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
          <h5 className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-2">Potential Concerns</h5>
          <ul className="space-y-1">
            {data.concerns.map((concern, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardWrapper>
  )
}

// =============================================================================
// Permit Process Card
// =============================================================================

function PermitProcessCard({ data }: { data: PermitProcessCardData }) {
  const statusConfig = {
    required: { color: 'border-sky-500 bg-sky-50 dark:bg-sky-900/30', dot: 'bg-sky-500' },
    optional: { color: 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800', dot: 'bg-stone-400' },
    completed: { color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30', dot: 'bg-emerald-500' },
  }

  return (
    <CardWrapper
      icon={<ClipboardList className="w-5 h-5" />}
      title={`${data.projectType} Permit Process`}
      subtitle={`${data.totalSteps} steps • ${data.estimatedTimeline}`}
      accentColor="sky"
    >
      <div className="space-y-3 mb-4">
        {data.steps.map((step) => {
          const status = statusConfig[step.status]
          return (
            <div
              key={step.step}
              className={`relative p-3 rounded-lg border-2 ${status.color}`}
            >
              <div className={`absolute -left-1 top-4 w-3 h-3 rounded-full ${status.dot} border-2 border-white dark:border-stone-900`} />
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Step {step.step}</span>
                  <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">{step.name}</h5>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${step.status === 'optional' ? 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400' : 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400'}`}>
                  {step.status}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">{step.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                  <Clock className="w-3 h-3" />
                  {step.duration}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{step.fee}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <h5 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Contact</h5>
        <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 mb-2">{data.contactInfo.department}</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a href={`tel:${data.contactInfo.phone}`} className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline">
            <Phone className="w-3 h-3" />
            {data.contactInfo.phone}
          </a>
          <a href={`mailto:${data.contactInfo.email}`} className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline">
            <Mail className="w-3 h-3" />
            {data.contactInfo.email}
          </a>
        </div>
      </div>
    </CardWrapper>
  )
}

// =============================================================================
// Code Citation Card
// =============================================================================

function CodeCitationCard({ data }: { data: CodeCitationCardData }) {
  return (
    <CardWrapper
      icon={<BookOpen className="w-5 h-5" />}
      title={data.title}
      subtitle={`Section ${data.codeSection}`}
      accentColor="emerald"
    >
      <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800 border-l-4 border-emerald-500 mb-3">
        <p className="text-sm text-stone-700 dark:text-stone-300 font-mono leading-relaxed">
          "{data.excerpt}"
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-3">
        <span>{data.sourceDocument}</span>
        <span>Updated {data.lastUpdated}</span>
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400 italic border-l-2 border-sky-500 pl-3">
        {data.relevance}
      </p>

      <button className="mt-3 flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline">
        <ExternalLink className="w-4 h-4" />
        View Full Code Section
      </button>
    </CardWrapper>
  )
}

// =============================================================================
// Opportunity List Card
// =============================================================================

function OpportunityListCard({ data }: { data: OpportunityListCardData }) {
  return (
    <CardWrapper
      icon={<Search className="w-5 h-5" />}
      title={`${data.resultCount} Properties Found`}
      subtitle={data.searchCriteria}
      accentColor="amber"
    >
      <div className="space-y-3">
        {data.opportunities.map((opp) => (
          <div
            key={opp.id}
            className="p-3 rounded-lg bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-sky-500 dark:hover:border-sky-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">{opp.address}</h5>
                <span className="text-xs text-stone-500 dark:text-stone-400">{opp.zoning}</span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-stone-500 dark:text-stone-400">Match</span>
                  <span className={`font-mono text-sm font-bold ${opp.matchScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : opp.matchScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'}`}>
                    {opp.matchScore}%
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                  {opp.askingPrice}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 mb-2">
              <span>{opp.lotSize}</span>
              <span>•</span>
              <span>{opp.owner}</span>
            </div>

            {opp.incentives.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {opp.incentives.map((incentive, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                  >
                    {incentive}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </CardWrapper>
  )
}

// =============================================================================
// Main Renderer
// =============================================================================

export interface GenerativeCardRendererProps {
  card: GenerativeCard
  onAction?: (action: string, data: unknown) => void
}

export function GenerativeCardRenderer({ card, onAction }: GenerativeCardRendererProps) {
  switch (card.type) {
    case 'zoneInfoCard':
      return <ZoneInfoCard data={card.data} />
    case 'parcelAnalysisCard':
      return <ParcelAnalysisCard data={card.data} />
    case 'incentivesSummaryCard':
      return <IncentivesSummaryCard data={card.data} />
    case 'areaPlanContextCard':
      return <AreaPlanContextCard data={card.data} />
    case 'permitProcessCard':
      return <PermitProcessCard data={card.data} />
    case 'codeCitationCard':
      return <CodeCitationCard data={card.data} />
    case 'opportunityListCard':
      return <OpportunityListCard data={card.data} />
    default:
      return null
  }
}

export {
  ZoneInfoCard,
  ParcelAnalysisCard,
  IncentivesSummaryCard,
  AreaPlanContextCard,
  PermitProcessCard,
  CodeCitationCard,
  OpportunityListCard,
}
