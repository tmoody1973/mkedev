'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Map, Mic, FileText, Building2, Search, Sparkles } from 'lucide-react'

/**
 * Landing page for MKE.dev - shown to unauthenticated users.
 * Follows RetroUI neobrutalist design with sky-500 primary color.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="border-b-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img
            src="/mkedev-logo-nolabel.svg"
            alt="MKE.dev"
            className="h-8 w-auto dark:invert"
          />
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium bg-sky-500 text-white border-2 border-black shadow-[4px_4px_0_0_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_black] active:translate-y-1 active:shadow-none transition-all">
                Get Started
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Big Logo */}
              <img
                src="/mkedev-logo.svg"
                alt="MKE.dev"
                className="w-full max-w-md dark:invert"
              />

              {/* Tagline */}
              <div className="space-y-4">
                <h1 className="font-head text-4xl lg:text-5xl font-bold text-stone-900 dark:text-white leading-tight">
                  Milwaukee&apos;s AI-Powered{' '}
                  <span className="text-sky-500">Civic Intelligence</span>{' '}
                  Platform
                </h1>
                <p className="text-lg text-stone-600 dark:text-stone-400 max-w-lg">
                  Voice-first AI that understands Milwaukee zoning codes, development incentives,
                  and helps you navigate real estate development with ease.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <SignUpButton mode="modal">
                  <button className="px-8 py-4 text-lg font-bold bg-sky-500 text-white border-2 border-black shadow-[6px_6px_0_0_black] hover:translate-y-1 hover:shadow-[4px_4px_0_0_black] active:translate-y-2 active:shadow-[2px_2px_0_0_black] transition-all">
                    Get Started Free
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="px-8 py-4 text-lg font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-2 border-black dark:border-white shadow-[6px_6px_0_0_black] dark:shadow-[6px_6px_0_0_white] hover:translate-y-1 hover:shadow-[4px_4px_0_0_black] dark:hover:shadow-[4px_4px_0_0_white] active:translate-y-2 active:shadow-[2px_2px_0_0_black] dark:active:shadow-[2px_2px_0_0_white] transition-all">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>

            {/* Right: Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-sky-100 dark:bg-sky-900/20 rounded-lg border-2 border-black dark:border-sky-700 shadow-[8px_8px_0_0_black] dark:shadow-[8px_8px_0_0_rgba(14,165,233,0.3)] transform rotate-3"></div>
              <div className="relative bg-white dark:bg-stone-900 rounded-lg border-2 border-black dark:border-stone-700 shadow-[8px_8px_0_0_black] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] p-6 space-y-4">
                {/* Mock Chat Interface */}
                <div className="flex items-center gap-2 pb-4 border-b-2 border-stone-200 dark:border-stone-700">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-sm text-stone-500">MKE.dev Chat</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      What can I build on 500 N Water St?
                    </p>
                  </div>
                  <div className="bg-sky-100 dark:bg-sky-900/30 rounded-lg p-3 ml-auto max-w-[80%] border border-sky-200 dark:border-sky-800">
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      That parcel is zoned <strong>C9A - Central Business District</strong>.
                      You can build mixed-use up to <strong>no height limit</strong> with office,
                      retail, and residential uses permitted...
                    </p>
                  </div>
                </div>
                {/* Mock Map Preview */}
                <div className="mt-4 h-32 bg-gradient-to-br from-sky-200 to-blue-300 dark:from-sky-900 dark:to-blue-900 rounded border-2 border-black dark:border-stone-600 flex items-center justify-center">
                  <Map className="w-12 h-12 text-sky-700 dark:text-sky-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-stone-900 border-y-2 border-black dark:border-stone-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Everything You Need for Milwaukee Development
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              AI-powered tools designed specifically for Milwaukee&apos;s unique zoning landscape
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Voice-First AI */}
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Voice-First AI"
              description="Ask questions naturally. Our Gemini-powered AI understands context and speaks Milwaukee zoning."
              color="sky"
            />

            {/* Feature 2: Interactive Maps */}
            <FeatureCard
              icon={<Map className="w-8 h-8" />}
              title="Interactive Maps"
              description="Click any parcel to instantly see zoning, overlays, TIF districts, and development potential."
              color="amber"
            />

            {/* Feature 3: Zoning Intelligence */}
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Zoning Intelligence"
              description="RAG-powered answers from the actual Milwaukee Zoning Code, Chapter 295, with citations."
              color="emerald"
            />

            {/* Feature 4: Development Incentives */}
            <FeatureCard
              icon={<Building2 className="w-8 h-8" />}
              title="Development Incentives"
              description="Discover TIF districts, Opportunity Zones, and historic tax credits for any property."
              color="purple"
            />

            {/* Feature 5: Area Plans */}
            <FeatureCard
              icon={<Search className="w-8 h-8" />}
              title="Area Plan Context"
              description="Understand neighborhood goals and how your project aligns with city planning priorities."
              color="rose"
            />

            {/* Feature 6: Vision AI */}
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Vision AI (Coming Soon)"
              description="Visualize architectural concepts on real parcels with Gemini&apos;s image generation."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Built for Milwaukee Builders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard
              title="Real Estate Developers"
              description="Quickly assess zoning feasibility, parking requirements, and incentive eligibility before pursuing a property."
            />
            <UseCaseCard
              title="Architects & Designers"
              description="Understand setbacks, height limits, and design review requirements for any Milwaukee site."
            />
            <UseCaseCard
              title="City Staff & Planners"
              description="Help constituents understand zoning regulations and navigate the development process."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-sky-500 border-y-2 border-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-head text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Build in Milwaukee?
          </h2>
          <p className="text-lg text-sky-100 mb-8">
            Join the civic AI revolution. Get instant answers about Milwaukee development.
          </p>
          <SignUpButton mode="modal">
            <button className="px-8 py-4 text-lg font-bold bg-white text-sky-600 border-2 border-black shadow-[6px_6px_0_0_black] hover:translate-y-1 hover:shadow-[4px_4px_0_0_black] active:translate-y-2 active:shadow-[2px_2px_0_0_black] transition-all">
              Get Started Free
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-stone-900 dark:bg-black border-t-2 border-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/mkedev-logo-nolabel.svg"
              alt="MKE.dev"
              className="h-6 w-auto invert"
            />
            <span className="text-stone-400 text-sm">
              Milwaukee Civic Intelligence
            </span>
          </div>
          <div className="text-stone-500 text-sm">
            Built for the Gemini 3 Hackathon
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Feature card component */
function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'sky' | 'amber' | 'emerald' | 'purple' | 'rose' | 'indigo'
}) {
  const colorClasses = {
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] p-6 hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_black] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.15)] transition-all">
      <div className={`inline-flex p-3 rounded-lg border-2 ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400 text-sm">
        {description}
      </p>
    </div>
  )
}

/** Use case card component */
function UseCaseCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6">
      <h3 className="font-bold text-xl text-stone-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400">
        {description}
      </p>
    </div>
  )
}
