'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Map, Mic, FileText, Building2, Search, MessageSquare, Layers, Home, ChevronRight, Wand2, ArrowRight } from 'lucide-react'

/**
 * Landing page for MKE.dev - shown to unauthenticated users.
 * Follows RetroUI neobrutalist design with sky-500 primary color.
 * Features real app screenshots to showcase functionality.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="border-b-2 border-black dark:border-stone-700 bg-white dark:bg-stone-900 sticky top-0 z-50">
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
      <section className="py-12 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Logo */}
            <img
              src="/mkedev-logo.svg"
              alt="MKE.dev"
              className="w-64 md:w-80 mx-auto mb-8 dark:invert"
            />

            {/* Tagline */}
            <h1 className="font-head text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-white leading-tight mb-6">
              Milwaukee&apos;s AI-Powered{' '}
              <span className="text-sky-500">Civic Intelligence</span>{' '}
              Platform
            </h1>
            <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-8">
              Voice-first AI that understands Milwaukee zoning codes, finds homes for sale,
              and helps you navigate real estate development with ease.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 text-lg font-bold bg-sky-500 text-white border-2 border-black shadow-[6px_6px_0_0_black] hover:translate-y-1 hover:shadow-[4px_4px_0_0_black] active:translate-y-2 active:shadow-[2px_2px_0_0_black] transition-all">
                  Get Started Free
                </button>
              </SignUpButton>
              <a
                href="#features"
                className="px-8 py-4 text-lg font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-2 border-black dark:border-white shadow-[6px_6px_0_0_black] dark:shadow-[6px_6px_0_0_white] hover:translate-y-1 hover:shadow-[4px_4px_0_0_black] dark:hover:shadow-[4px_4px_0_0_white] transition-all flex items-center gap-2"
              >
                See Features <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hero Screenshot - Full App View */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-sky-200 dark:bg-sky-900/30 rounded-xl border-2 border-black transform rotate-1 translate-x-2 translate-y-2"></div>
            <div className="relative bg-white dark:bg-stone-900 rounded-xl border-2 border-black shadow-[8px_8px_0_0_black] overflow-hidden">
              <img
                src="/screenshots/homes-search-map.png"
                alt="MKE.dev app showing homes search with interactive map and layer controls"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-stone-900 border-y-2 border-black dark:border-stone-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-sm font-medium rounded-full border border-sky-300 dark:border-sky-700 mb-4">
              See It In Action
            </span>
            <h2 className="font-head text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Powerful Tools for Milwaukee Development
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Everything you need to understand zoning, find properties, and make informed development decisions.
            </p>
          </div>

          {/* Feature 1: AI Chat */}
          <FeatureShowcase
            title="Ask Anything About Zoning"
            description="Get instant, detailed answers about any Milwaukee property. Our AI understands the full Milwaukee Zoning Code (Chapter 295) and provides specific information about permitted uses, dimensional requirements, and building possibilities."
            highlights={[
              'Natural language queries - just ask like you would a zoning expert',
              'Detailed responses with specific code references',
              'Understand what you can build before you buy',
            ]}
            imageSrc="/screenshots/chat-zoning-response.png"
            imageAlt="AI chat interface showing detailed zoning response for a Milwaukee property"
            imagePosition="right"
            accentColor="sky"
          />

          {/* Feature 2: Property Cards */}
          <FeatureShowcase
            title="Rich Property Intelligence"
            description="Every property comes with comprehensive details including Street View imagery, zoning classification, area plan context, and development standards. All in a beautiful, easy-to-understand format."
            highlights={[
              'Google Street View integration for visual context',
              'Tabbed interface: Overview, Zoning, Area Plans, Development',
              'Quick actions: Get directions, copy address, view city records',
            ]}
            imageSrc="/screenshots/parcel-card-streetview.png"
            imageAlt="Property card showing Street View images and detailed information tabs"
            imagePosition="left"
            accentColor="amber"
          />

          {/* Feature 3: Home Listings */}
          <FeatureShowcase
            title="Discover Homes For Sale"
            description="Search city-owned homes available for purchase, complete with photos, property details, and neighborhood information. See listings on an interactive map with zoning and incentive overlays."
            highlights={[
              'Browse available city homes with full property details',
              'Photo galleries and property narratives',
              'One-click to view on map or get more information',
            ]}
            imageSrc="/screenshots/home-listing-layers.png"
            imageAlt="Home listing card with property photo, details, and map showing zoning layers"
            imagePosition="right"
            accentColor="emerald"
          />
        </div>
      </section>

      {/* AI Visualizer Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-50 to-stone-50 dark:from-violet-950/30 dark:to-stone-950 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium rounded-full border border-violet-300 dark:border-violet-700 mb-4">
              <Wand2 className="w-4 h-4" />
              <span>Powered by Gemini 3</span>
            </div>
            <h2 className="font-head text-3xl lg:text-5xl font-bold text-stone-900 dark:text-white mb-4">
              AI Site <span className="text-violet-500">Visualizer</span>
            </h2>
            <p className="text-lg lg:text-xl text-stone-600 dark:text-stone-400 max-w-3xl mx-auto">
              See your vision come to life. Paint over any site and let AI generate
              stunning architectural visualizations in seconds.
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="relative max-w-5xl mx-auto mb-8">
            <div className="absolute inset-0 bg-violet-200 dark:bg-violet-900/30 rounded-2xl border-2 border-black transform rotate-1 translate-x-3 translate-y-3"></div>
            <div className="relative bg-white dark:bg-stone-900 rounded-2xl border-2 border-black shadow-[8px_8px_0_0_black] overflow-hidden">
              <img
                src="/viz/house-to-bungalow.png"
                alt="AI Site Visualizer showing before and after comparison - house transformed into modern bungalow with landscaping"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Prompt Example */}
          <div className="max-w-2xl mx-auto mb-12 text-center">
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-2">Prompt used:</p>
            <p className="text-lg font-medium text-stone-700 dark:text-stone-300 italic">
              &quot;Turn this house into a modern bungalow with nice landscaping&quot;
            </p>
          </div>

          {/* How It Works */}
          <div className="max-w-4xl mx-auto">
            <h3 className="font-head text-xl font-bold text-stone-900 dark:text-white text-center mb-8">
              How It Works
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full border-2 border-violet-300 dark:border-violet-700 mb-3 font-bold text-lg">
                  1
                </div>
                <h4 className="font-bold text-stone-900 dark:text-white mb-1">Capture</h4>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Take a screenshot from the map or Street View
                </p>
              </div>
              <div className="text-center relative">
                <ArrowRight className="hidden sm:block absolute -left-3 top-6 w-6 h-6 text-stone-300 dark:text-stone-600" />
                <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full border-2 border-violet-300 dark:border-violet-700 mb-3 font-bold text-lg">
                  2
                </div>
                <h4 className="font-bold text-stone-900 dark:text-white mb-1">Paint</h4>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Mask the area you want to transform
                </p>
              </div>
              <div className="text-center relative">
                <ArrowRight className="hidden sm:block absolute -left-3 top-6 w-6 h-6 text-stone-300 dark:text-stone-600" />
                <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full border-2 border-violet-300 dark:border-violet-700 mb-3 font-bold text-lg">
                  3
                </div>
                <h4 className="font-bold text-stone-900 dark:text-white mb-1">Generate</h4>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Describe your vision and watch AI bring it to life
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Built for Milwaukee
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              AI-powered tools designed specifically for Milwaukee&apos;s unique zoning landscape
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-7 h-7" />}
              title="Conversational AI"
              description="Ask questions naturally. Our Gemini-powered AI understands context and speaks Milwaukee zoning fluently."
              color="sky"
            />
            <FeatureCard
              icon={<Map className="w-7 h-7" />}
              title="Interactive Maps"
              description="Click any parcel to instantly see zoning, overlays, TIF districts, and development potential."
              color="amber"
            />
            <FeatureCard
              icon={<FileText className="w-7 h-7" />}
              title="Code Citations"
              description="Every answer cites the actual Milwaukee Zoning Code, Chapter 295, so you can verify and learn more."
              color="emerald"
            />
            <FeatureCard
              icon={<Layers className="w-7 h-7" />}
              title="Layer Controls"
              description="Toggle TIF districts, Opportunity Zones, historic districts, and more to understand incentive eligibility."
              color="purple"
            />
            <FeatureCard
              icon={<Home className="w-7 h-7" />}
              title="Homes For Sale"
              description="Browse city-owned properties available for purchase with full details and photos."
              color="rose"
            />
            <FeatureCard
              icon={<Wand2 className="w-7 h-7" />}
              title="AI Visualizer"
              description="Generate stunning architectural visualizations of any site using Gemini 3 AI."
              color="violet"
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-stone-100 dark:bg-stone-900/50 border-y-2 border-black dark:border-stone-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Built for Milwaukee Builders
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Whether you&apos;re buying your first home or developing a major project
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<Building2 className="w-10 h-10" />}
              title="Real Estate Developers"
              description="Quickly assess zoning feasibility, parking requirements, and incentive eligibility before pursuing a property."
            />
            <UseCaseCard
              icon={<Search className="w-10 h-10" />}
              title="Homebuyers"
              description="Understand what you can build, add, or modify on a property before you make an offer."
            />
            <UseCaseCard
              icon={<Mic className="w-10 h-10" />}
              title="City Staff & Planners"
              description="Help constituents understand zoning regulations and navigate the development process efficiently."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-500 border-y-2 border-black">
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
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
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
          <div className="pt-4 border-t border-stone-800 text-center">
            <p className="text-stone-500 text-xs">
              This site is not affiliated with, endorsed by, or connected to the City of Milwaukee.
              Information provided is for educational purposes only and should not be considered official city guidance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Feature showcase component - alternating image/text layout */
function FeatureShowcase({
  title,
  description,
  highlights,
  imageSrc,
  imageAlt,
  imagePosition,
  accentColor,
}: {
  title: string
  description: string
  highlights: string[]
  imageSrc: string
  imageAlt: string
  imagePosition: 'left' | 'right'
  accentColor: 'sky' | 'amber' | 'emerald'
}) {
  const accentClasses = {
    sky: 'bg-sky-100 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400',
    amber: 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400',
  }

  const checkColor = {
    sky: 'text-sky-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
  }

  return (
    <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 ${imagePosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
      {/* Text Content */}
      <div className={imagePosition === 'left' ? 'lg:order-2' : ''}>
        <h3 className="font-head text-2xl lg:text-3xl font-bold text-stone-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
          {description}
        </p>
        <ul className="space-y-3">
          {highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${checkColor[accentColor]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-stone-700 dark:text-stone-300">{highlight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image */}
      <div className={imagePosition === 'left' ? 'lg:order-1' : ''}>
        <div className="relative">
          <div className={`absolute inset-0 ${accentClasses[accentColor]} rounded-lg border-2 transform rotate-2 translate-x-2 translate-y-2`}></div>
          <div className="relative bg-white dark:bg-stone-800 rounded-lg border-2 border-black dark:border-stone-600 shadow-[6px_6px_0_0_black] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] overflow-hidden">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
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
  color: 'sky' | 'amber' | 'emerald' | 'purple' | 'rose' | 'indigo' | 'violet'
}) {
  const colorClasses = {
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700',
  }

  return (
    <div className="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] p-6 hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_black] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.15)] transition-all">
      <div className={`inline-flex p-3 rounded-lg border-2 ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}

/** Use case card component */
function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] p-8 text-center">
      <div className="inline-flex p-4 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full border-2 border-sky-300 dark:border-sky-700 mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-xl text-stone-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400">
        {description}
      </p>
    </div>
  )
}
