'use client'

import type { CompliancePanelProps } from '../types'

export function CompliancePanel({
  constraints,
  checks,
  isExpanded = false,
  onToggleExpand,
}: CompliancePanelProps) {
  const allCompliant = checks.every(check => check.isCompliant)
  const compliantCount = checks.filter(check => check.isCompliant).length

  return (
    <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${allCompliant
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
            }
          `}>
            {allCompliant ? (
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-heading font-bold text-stone-900 dark:text-stone-100">
              Zoning Compliance
            </h3>
            <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
              {constraints.zoningDistrict} • {compliantCount}/{checks.length} requirements met
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick compliance badges */}
          <div className="hidden sm:flex items-center gap-1">
            {checks.slice(0, 3).map((check) => (
              <span
                key={check.id}
                className={`
                  w-2 h-2 rounded-full
                  ${check.isCompliant ? 'bg-emerald-500' : 'bg-red-500'}
                `}
                title={`${check.label}: ${check.isCompliant ? 'Compliant' : 'Non-compliant'}`}
              />
            ))}
            {checks.length > 3 && (
              <span className="font-mono text-xs text-stone-400">+{checks.length - 3}</span>
            )}
          </div>

          {/* Expand icon */}
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t-2 border-black dark:border-stone-600">
          {/* Zoning constraints */}
          <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
            <h4 className="font-heading font-bold text-sm text-stone-700 dark:text-stone-300 mb-2">
              Zoning Constraints ({constraints.zoningDistrict})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Max Height</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.maxHeight} {constraints.maxHeightUnit}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Front Setback</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.frontSetback} {constraints.setbackUnit}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Side Setback</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.sideSetback} {constraints.setbackUnit}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Rear Setback</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.rearSetback} {constraints.setbackUnit}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Max Lot Coverage</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.maxLotCoverage}%
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-stone-500 dark:text-stone-400">Max Footprint</p>
                <p className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                  {constraints.maxFootprint} {constraints.footprintUnit}
                </p>
              </div>
            </div>

            {/* Special overlays */}
            <div className="mt-3 flex flex-wrap gap-2">
              {constraints.historicDistrict && (
                <span className="px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-mono text-xs">
                  Historic District
                </span>
              )}
              {constraints.designOverlay && (
                <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-mono text-xs">
                  {constraints.designOverlay}
                </span>
              )}
            </div>
          </div>

          {/* Compliance checks */}
          <div className="px-4 py-3">
            <h4 className="font-heading font-bold text-sm text-stone-700 dark:text-stone-300 mb-3">
              Compliance Checks
            </h4>
            <div className="space-y-2">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg
                    ${check.isCompliant
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {check.isCompliant ? (
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-heading font-semibold text-sm ${check.isCompliant ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                      {check.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm ${check.isCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {check.actual}
                    </p>
                    <p className="font-mono text-xs text-stone-500 dark:text-stone-400">
                      {check.requirement}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
