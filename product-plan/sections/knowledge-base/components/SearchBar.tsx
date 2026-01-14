'use client'

import type { SearchBarProps } from '../types'

export function SearchBar({
  query,
  selectedCategory,
  categories,
  onQueryChange,
  onCategoryChange,
  onSearch,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query, selectedCategory)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)]">
          <svg className="w-5 h-5 text-stone-400 dark:text-stone-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search documents, zoning codes, policies..."
            className="flex-1 bg-transparent border-none outline-none font-body text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange?.('')}
              className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <svg className="w-4 h-4 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange?.(e.target.value || undefined)}
            className="appearance-none w-full sm:w-48 px-4 py-3 pr-10 rounded-xl bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(68,64,60,1)] font-heading font-semibold text-sm text-stone-900 dark:text-stone-100 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-sky-500 text-white font-heading font-bold text-sm border-2 border-black dark:border-sky-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
        >
          Search
        </button>
      </div>
    </form>
  )
}
