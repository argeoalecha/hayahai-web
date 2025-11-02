'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Search component with autocomplete and Theme Electric styling
 *
 * @example
 * ```tsx
 * <Search
 *   placeholder="Search posts..."
 *   onSearch={(query) => console.log(query)}
 *   suggestions={['React', 'Next.js', 'TypeScript']}
 * />
 * ```
 */

interface SearchProps {
  /** Placeholder text */
  placeholder?: string
  /** Search callback (debounced) */
  onSearch: (query: string) => void
  /** Autocomplete suggestions */
  suggestions?: string[]
  /** Recent searches */
  recentSearches?: string[]
  /** Loading state */
  loading?: boolean
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Additional CSS classes */
  className?: string
  /** Input size */
  size?: 'sm' | 'md' | 'lg'
}

export function Search({
  placeholder = 'Search...',
  onSearch,
  suggestions = [],
  recentSearches = [],
  loading = false,
  debounceMs = 300,
  className,
  size = 'md'
}: SearchProps) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout>()

  // Combined suggestions (recent + autocomplete)
  const filteredSuggestions = query
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : []

  const combinedSuggestions = [
    ...filteredSuggestions,
    ...(query ? [] : recentSearches)
  ]

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      if (query) {
        onSearch(query)
      }
    }, debounceMs)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query, debounceMs, onSearch])

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!combinedSuggestions.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < combinedSuggestions.length - 1 ? prev + 1 : prev
        )
        setShowDropdown(true)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(combinedSuggestions[selectedIndex])
        } else if (query) {
          onSearch(query)
          setShowDropdown(false)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const sizeStyles = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-13 text-lg'
  }

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-te-sage pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 rounded-lg',
            'bg-te-pearl border border-te-sage',
            'text-te-charcoal placeholder:text-te-sage',
            'focus:outline-none focus:border-te-vibrant-coral focus:border-2',
            'transition-all duration-200',
            sizeStyles[size]
          )}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-dropdown"
        />

        {/* Clear button / Loading indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-te-vibrant-coral border-t-transparent rounded-full" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-te-sage hover:text-te-charcoal transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && combinedSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-dropdown"
          className="absolute z-50 w-full mt-2 bg-te-pearl border border-te-sage/20 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          role="listbox"
        >
          {combinedSuggestions.map((suggestion, index) => {
            const isRecent = !query && recentSearches.includes(suggestion)

            return (
              <button
                key={`${suggestion}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left flex items-center gap-3',
                  'hover:bg-te-sage/10 transition-colors duration-200',
                  index === selectedIndex && 'bg-te-sage/10',
                  'border-b border-te-sage/10 last:border-b-0'
                )}
                role="option"
                aria-selected={index === selectedIndex}
              >
                {isRecent ? (
                  <Clock className="h-4 w-4 text-te-sage flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-te-vibrant-coral flex-shrink-0" />
                )}
                <span className="text-te-charcoal">{suggestion}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
