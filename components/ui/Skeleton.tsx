import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Skeleton loading component with shimmer animation
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" className="w-full" />
 * <Skeleton variant="card" className="h-48" />
 * <Skeleton variant="avatar" />
 * ```
 */

interface SkeletonProps {
  /** Visual variant */
  variant?: 'text' | 'card' | 'image' | 'avatar' | 'button'
  /** Additional CSS classes */
  className?: string
  /** Width (can be omitted to use full width) */
  width?: string | number
  /** Height (can be omitted for default heights) */
  height?: string | number
}

export function Skeleton({
  variant = 'text',
  className,
  width,
  height
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-xl',
    image: 'h-48 w-full rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-te-pearl relative overflow-hidden',
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-te-sage/10 to-transparent" />
    </div>
  )
}

/**
 * Skeleton group for displaying multiple skeleton items
 */
interface SkeletonGroupProps {
  /** Number of skeleton items */
  count?: number
  /** Variant for all skeleton items */
  variant?: SkeletonProps['variant']
  /** Additional CSS classes */
  className?: string
  /** Space between items */
  space?: 'sm' | 'md' | 'lg'
}

export function SkeletonGroup({
  count = 3,
  variant = 'text',
  className,
  space = 'md'
}: SkeletonGroupProps) {
  const spaceStyles = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  }

  return (
    <div className={cn(spaceStyles[space], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant={variant} />
      ))}
    </div>
  )
}
