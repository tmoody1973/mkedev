'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PromptHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'beginner' | 'planner' | 'architect' | 'milwaukee';

const TABS: { key: Tab; label: string }[] = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'planner', label: 'Planner' },
  { key: 'architect', label: 'Architect' },
  { key: 'milwaukee', label: 'Milwaukee' },
];

function PromptBlock({ children }: { children: string }) {
  return (
    <div className="bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 font-mono text-sm text-stone-800 dark:text-stone-200">
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold font-head text-stone-900 dark:text-stone-100 mt-5 mb-2">
      {children}
    </h3>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-stone-700 dark:text-stone-300">{children}</li>
  );
}

function BeginnerTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        For residents, community members, and anyone new to architecture. Use everyday words.
      </p>

      <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
          Formula: <span className="font-mono">[Building type] with [features], [mood/feeling]</span>
        </p>
      </div>

      <SectionHeading>Residential</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Modern house with large windows and a front porch</PromptBlock>
        <PromptBlock>Apartment building, 3 stories, brick, with balconies</PromptBlock>
        <PromptBlock>Row of townhomes with front yards and a tree-lined sidewalk</PromptBlock>
        <PromptBlock>Cozy duplex with a small garden and covered parking</PromptBlock>
      </div>

      <SectionHeading>Commercial</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Small restaurant with outdoor seating and large windows</PromptBlock>
        <PromptBlock>Corner coffee shop with brick exterior and a patio</PromptBlock>
        <PromptBlock>Neighborhood grocery store with a welcoming entrance</PromptBlock>
      </div>

      <SectionHeading>Mixed-Use</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Building with shops on the bottom and apartments on top, 4 stories</PromptBlock>
        <PromptBlock>Small mixed-use building with a cafe on the first floor</PromptBlock>
      </div>

      <SectionHeading>Public Space</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Community park with walking paths, benches, and shade trees</PromptBlock>
        <PromptBlock>Urban garden with raised beds and a small gathering area</PromptBlock>
      </div>

      <SectionHeading>Tips</SectionHeading>
      <ul className="list-disc pl-5 space-y-1">
        <Tip><strong>Short is fine.</strong> &quot;Modern townhomes&quot; works. The AI fills in the rest using your parcel&apos;s zoning.</Tip>
        <Tip><strong>Describe feelings.</strong> &quot;Welcoming,&quot; &quot;cozy,&quot; &quot;bright&quot; help the AI pick the right style.</Tip>
        <Tip><strong>Don&apos;t worry about zoning rules.</strong> MKEdev adds height limits, setbacks, and lot coverage automatically.</Tip>
      </ul>
    </div>
  );
}

function PlannerTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        For urban planners, developers, and policy makers. Use planning terminology.
      </p>

      <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
          Formula: <span className="font-mono">[Use type], [stories], [ground floor], [upper floors], [urban context], [public realm]</span>
        </p>
      </div>

      <SectionHeading>Residential Development</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>4-story multi-family residential, ground-floor live-work units, residential above, private balconies, shared courtyard, street trees</PromptBlock>
        <PromptBlock>Affordable housing complex, 3-story walk-up, community room on ground floor, accessible entrances, parking in rear</PromptBlock>
        <PromptBlock>Infill single-family homes, 2.5 stories, narrow lot design, front porches, detached garages from alley</PromptBlock>
      </div>

      <SectionHeading>Mixed-Use / TOD</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Mixed-use mid-rise, 5 stories, ground-floor retail with large windows, residential floors 2-5, step-back at 4th floor, rooftop terrace</PromptBlock>
        <PromptBlock>Transit-oriented development, 6 stories, ground-level commercial, residential above, structured parking behind, plaza facing bus stop</PromptBlock>
      </div>

      <SectionHeading>Adaptive Reuse</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Historic warehouse conversion to creative office, original brick preserved, new large window openings, rooftop addition set back from facade</PromptBlock>
        <PromptBlock>Former industrial building converted to artist lofts, original structure exposed, new glass curtain wall addition, public gallery on ground floor</PromptBlock>
      </div>

      <SectionHeading>Complete Streets</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Complete street redesign with protected bike lanes, wide sidewalks, street trees at 30ft spacing, outdoor dining zones, transit shelter</PromptBlock>
      </div>

      <SectionHeading>Tips</SectionHeading>
      <ul className="list-disc pl-5 space-y-1">
        <Tip><strong>Name the neighborhood.</strong> &quot;Consistent with Walker&apos;s Point character&quot; helps match context.</Tip>
        <Tip><strong>Specify ground floor uses.</strong> &quot;Ground-floor retail&quot; vs &quot;ground-floor residential&quot; produces very different results.</Tip>
        <Tip><strong>Include public realm.</strong> Street trees, bike lanes, and sidewalk width make renders more realistic.</Tip>
        <Tip><strong>Use planning terms.</strong> The AI understands FAR, lot coverage, TOD, TIF, overlay zones, and Milwaukee zoning districts.</Tip>
      </ul>
    </div>
  );
}

function ArchitectTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        For architects, designers, and advanced users. Full control over style, materials, lighting, and composition.
      </p>

      <div className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
          Formula: <span className="font-mono">[Style] [building type], [materials], [facade details], [lighting], [perspective]</span>
        </p>
      </div>

      <SectionHeading>Example Prompts</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Contemporary residence, cedar siding with floor-to-ceiling glazing, cantilevered upper floor, flat green roof, golden hour lighting, street-level perspective</PromptBlock>
        <PromptBlock>Mid-rise residential, 6 stories, modular facade with alternating recessed balconies, fiber cement panels and wood accents, green roof terrace</PromptBlock>
        <PromptBlock>Contemporary office, curtain wall with anodized aluminum solar fins, double-height lobby, weathering steel accents, blue hour twilight</PromptBlock>
        <PromptBlock>Mixed-use complex, concrete podium with brick cladding at street level, glass tower above, terraced setbacks, cantilevered balconies, golden hour</PromptBlock>
        <PromptBlock>Community center, mass timber construction with CLT exposed, biophilic design, operable clerestory windows, native landscape, Midwest regional modernism</PromptBlock>
      </div>

      <SectionHeading>Material Vocabulary</SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-2 border-stone-300 dark:border-stone-600 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-800">
              <th className="text-left px-3 py-1.5 font-medium text-stone-700 dark:text-stone-300 border-b-2 border-stone-300 dark:border-stone-600">Term</th>
              <th className="text-left px-3 py-1.5 font-medium text-stone-700 dark:text-stone-300 border-b-2 border-stone-300 dark:border-stone-600">Effect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            <tr><td className="px-3 py-1 font-mono text-xs">Glass curtain wall</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Full glass facade with mullions</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Board-formed concrete</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Textured concrete with wood grain</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Weathering steel (Corten)</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Rust-orange patina steel panels</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Terracotta cladding</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Warm clay-colored panels</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Cedar siding</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Natural wood exterior</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Limestone veneer</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Natural stone facade</td></tr>
          </tbody>
        </table>
      </div>

      <SectionHeading>Lighting Terms</SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-2 border-stone-300 dark:border-stone-600 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-800">
              <th className="text-left px-3 py-1.5 font-medium text-stone-700 dark:text-stone-300 border-b-2 border-stone-300 dark:border-stone-600">Term</th>
              <th className="text-left px-3 py-1.5 font-medium text-stone-700 dark:text-stone-300 border-b-2 border-stone-300 dark:border-stone-600">Best For</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            <tr><td className="px-3 py-1 font-mono text-xs">Golden hour</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Warm residential, sunset glow</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Blue hour / twilight</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Urban scenes, evening with interior lights</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Overcast / soft diffused</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Even lighting, material detail</td></tr>
            <tr><td className="px-3 py-1 font-mono text-xs">Dramatic side lighting</td><td className="px-3 py-1 text-stone-600 dark:text-stone-400">Sculptural facades, shadow play</td></tr>
          </tbody>
        </table>
      </div>

      <SectionHeading>Tips</SectionHeading>
      <ul className="list-disc pl-5 space-y-1">
        <Tip><strong>Put the building type first.</strong> Words earlier in your prompt carry more weight.</Tip>
        <Tip><strong>Specify materials precisely.</strong> &quot;Board-formed concrete&quot; beats &quot;concrete.&quot;</Tip>
        <Tip><strong>Add lighting.</strong> &quot;Golden hour&quot; or &quot;blue hour twilight&quot; dramatically improves photorealism.</Tip>
        <Tip><strong>Stay under 100 words.</strong> Longer prompts dilute focus. Prioritize the 5-6 most important details.</Tip>
      </ul>
    </div>
  );
}

function MilwaukeeTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Prompts designed for common Milwaukee development scenarios and neighborhoods.
      </p>

      <SectionHeading>Vacant Lot Infill</SectionHeading>
      <p className="text-xs text-stone-500 dark:text-stone-500 -mt-1">Common in Harambee, Lindsay Heights, Amani</p>
      <div className="space-y-2">
        <PromptBlock>2.5-story single-family home, front porch, vinyl siding, detached garage in rear, matches adjacent homes in scale and setback</PromptBlock>
        <PromptBlock>Duplex, 2.5 stories, brick and vinyl, separate entrances, off-street parking, matches neighborhood character</PromptBlock>
      </div>

      <SectionHeading>Cream City Brick</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>New construction referencing Milwaukee cream city brick tradition, 3 stories, light yellow-tan brick, arched window headers, limestone accents, front porch with stone columns</PromptBlock>
      </div>

      <SectionHeading>Historic Third Ward / Walker&apos;s Point</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Historic cream city brick warehouse converted to residential lofts, original facade preserved, new penthouse with glass and steel set back from edge, ground-floor restaurant</PromptBlock>
      </div>

      <SectionHeading>MLK Drive / Bronzeville</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Mixed-use building, 4 stories, ground-floor retail with large windows, apartments above, brick and metal panel facade, public art on facade, consistent with Bronzeville cultural corridor</PromptBlock>
      </div>

      <SectionHeading>Bay View (KK Avenue)</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Neighborhood commercial building, 2-3 stories, ground-floor retail, office above, brick facade, traditional storefront proportions, awnings, consistent with KK Avenue character</PromptBlock>
      </div>

      <SectionHeading>Downtown / Westown</SectionHeading>
      <div className="space-y-2">
        <PromptBlock>Modern mixed-use tower, 8-12 stories, glass and steel facade, ground-floor retail and lobby, structured parking wrapped with active uses, pedestrian plaza, connected to riverwalk</PromptBlock>
      </div>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, () => React.ReactElement> = {
  beginner: BeginnerTab,
  planner: PlannerTab,
  architect: ArchitectTab,
  milwaukee: MilwaukeeTab,
};

export function PromptHelpModal({ isOpen, onClose }: PromptHelpModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('beginner');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:w-[90vw] sm:h-[85vh] sm:max-w-2xl bg-white dark:bg-stone-900 sm:rounded-lg shadow-2xl flex flex-col overflow-hidden border-2 border-black dark:border-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black dark:border-white bg-stone-50 dark:bg-stone-800">
          <h2 className="text-lg font-bold font-head text-stone-900 dark:text-stone-100">
            Prompt Tips
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-black
              bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300
              shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400
              hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
              active:translate-y-1 active:shadow-none
              transition-all duration-100"
            aria-label="Close prompt tips"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b-2 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-2 pt-1 gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-2 border-b-0 border-stone-300 dark:border-stone-600 -mb-[2px]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TabContent />
        </div>
      </div>
    </div>
  );
}
