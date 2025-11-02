import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Badge component with Theme Electric styling
 *
 * @example
 * ```tsx
 * <Badge variant="success">Published</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 * <Badge variant="default" icon={<CheckIcon />}>Active</Badge>
 * ```
 */

interface BadgeProps {
  /** Visual style variant */
  variant?: 'default' | 'success' | 'warning' | 'secondary' | 'error'
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Content to display */
  children: React.ReactNode
  /** Optional icon to display before text */
  icon?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-te-vibrant-coral/10 text-te-vibrant-coral border-te-vibrant-coral/20',
    success: 'bg-te-bright-green/10 text-te-bright-green border-te-bright-green/20',
    warning: 'bg-te-warm-gold/10 text-te-warm-gold border-te-warm-gold/20',
    secondary: 'bg-te-sage/10 text-te-sage border-te-sage/20',
    error: 'bg-te-vibrant-coral/10 text-te-vibrant-coral border-te-vibrant-coral/20',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border transition-colors duration-200',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
