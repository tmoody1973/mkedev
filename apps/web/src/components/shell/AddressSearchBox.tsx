'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface GeocodingFeature {
  id: string
  place_name: string
  center: [number, number]
  text: string
}

interface AddressSearchBoxProps {
  onAddressSelect?: (coordinates: [number, number], address: string) => void
}

export function AddressSearchBox({ onAddressSelect }: AddressSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  // Debug: log token availability on mount
  useEffect(() => {
    console.log('[AddressSearchBox] Token available:', !!mapboxToken, mapboxToken ? `(${mapboxToken.substring(0, 10)}...)` : '(empty)')
  }, [mapboxToken])

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      console.log('[AddressSearchBox] fetchSuggestions called with:', searchQuery, 'token:', !!mapboxToken)

      if (!searchQuery.trim() || !mapboxToken) {
        console.log('[AddressSearchBox] Skipping fetch - no query or no token')
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const searchText = searchQuery.toLowerCase().includes('milwaukee')
          ? searchQuery
          : `${searchQuery}, Milwaukee, WI`

        console.log('[AddressSearchBox] Fetching:', searchText)
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?` +
            new URLSearchParams({
              access_token: mapboxToken,
              limit: '5',
              types: 'address,poi,place,neighborhood',
              bbox: '-88.1,42.8,-87.8,43.2',
              country: 'US',
            })
        )

        if (!response.ok) {
          console.log('[AddressSearchBox] API error:', response.status)
          setSuggestions([])
          return
        }

        const data = await response.json()
        console.log('[AddressSearchBox] Got response:', data.features?.length || 0, 'features')
        setSuggestions(data.features || [])
        setShowDropdown(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('[AddressSearchBox] Geocoding error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [mapboxToken]
  )

  // Debounced search
  const handleInputChange = useCallback(
    (value: string) => {
      console.log('[AddressSearchBox] Input changed:', value)
      setQuery(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (value.length >= 5) {
        console.log('[AddressSearchBox] Setting debounce timer for:', value)
        debounceRef.current = setTimeout(() => {
          fetchSuggestions(value)
        }, 300)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    },
    [fetchSuggestions]
  )

  // Handle suggestion selection
  const handleSelect = useCallback(
    (feature: GeocodingFeature) => {
      console.log('[AddressSearchBox] Selected feature:', feature)
      setQuery(feature.place_name)
      setSuggestions([])
      setShowDropdown(false)

      if (onAddressSelect && feature.center) {
        console.log('[AddressSearchBox] Calling onAddressSelect with:', feature.center, feature.place_name)
        onAddressSelect(feature.center, feature.place_name)
      }
    },
    [onAddressSelect]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) {
        if (e.key === 'Enter' && query.trim()) {
          // If no suggestions, search anyway
          fetchSuggestions(query)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex])
          } else if (suggestions.length > 0) {
            handleSelect(suggestions[0])
          }
          break
        case 'Escape':
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
      }
    },
    [showDropdown, suggestions, selectedIndex, handleSelect, query, fetchSuggestions]
  )

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear input
  const handleClear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative flex items-center h-10 bg-white dark:bg-stone-800 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
        <Search className="absolute left-3 w-4 h-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search address in Milwaukee..."
          className="w-full h-full pl-9 pr-8 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-stone-400 animate-spin" />
        )}
        {!isLoading && query && (
          <button
            onClick={handleClear}
            className="absolute right-2 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <X className="w-3 h-3 text-stone-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-800 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden"
        >
          {suggestions.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => handleSelect(feature)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-sky-100 dark:bg-sky-900 text-sky-900 dark:text-sky-100'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <div className="font-medium truncate">{feature.text}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {feature.place_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
