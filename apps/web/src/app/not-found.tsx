'use client'

import Link from 'next/link'

/**
 * Custom 404 Not Found page.
 * This is a simple, static-safe page that doesn't rely on heavy providers
 * like CopilotKit which may cause issues during prerendering.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-stone-800 border-2 border-black dark:border-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] p-8 text-center">
        <h1 className="text-6xl font-bold text-stone-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-stone-700 dark:text-stone-300 mb-4">
          Page Not Found
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-sky-500 text-white font-semibold border-2 border-black shadow-[3px_3px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_black] transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
