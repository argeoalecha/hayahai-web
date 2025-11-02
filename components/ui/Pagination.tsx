'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

/**
 * Pagination component with Theme Electric styling
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => console.log(page)}
 * />
 * ```
 */

interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Number of page buttons to show (default: 5) */
  siblingCount?: number
  /** Show first/last page buttons */
  showFirstLast?: boolean
  /** Additional CSS classes */
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 2,
  showFirstLast = true,
  className
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('')

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages: (number | string)[] = []
    const leftSibling = Math.max(currentPage - siblingCount, 1)
    const rightSibling = Math.min(currentPage + siblingCount, totalPages)

    // Always show first page
    if (leftSibling > 1) {
      pages.push(1)
      if (leftSibling > 2) {
        pages.push('...')
      }
    }

    // Show page numbers around current page
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i)
    }

    // Always show last page
    if (rightSibling < totalPages) {
      if (rightSibling < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(jumpToPage)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpToPage('')
    }
  }

  const pages = generatePageNumbers()

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-2">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-te-sage"
                >
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200',
                  page === currentPage
                    ? 'bg-te-vibrant-coral text-te-cream'
                    : 'bg-te-pearl text-te-charcoal hover:bg-te-sage/20'
                )}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Jump to page */}
      <form onSubmit={handleJumpToPage} className="hidden md:flex items-center gap-2">
        <span className="text-sm text-te-sage">Go to:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          placeholder={String(currentPage)}
          className="w-16 px-2 py-1 text-sm rounded border border-te-sage bg-te-pearl text-te-charcoal focus:outline-none focus:border-te-vibrant-coral"
          aria-label="Jump to page"
        />
        <Button type="submit" variant="outline" size="sm">
          Go
        </Button>
      </form>
    </div>
  )
}

/**
 * Simple pagination info component
 */
interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <p className={cn('text-sm text-te-sage', className)}>
      Showing {start}-{end} of {totalItems.toLocaleString()} items
    </p>
  )
}
