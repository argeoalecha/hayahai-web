import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loadingText?: string
  errorText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    loading = false,
    error = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    loadingText,
    errorText,
    onClick,
    ...props
  }, ref) => {
    const [isProcessing, setIsProcessing] = React.useState(false)

    const handleClick = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled || error || isProcessing) return

      setIsProcessing(true)

      try {
        await onClick?.(e)
      } catch (error) {
        console.error('Button action failed:', error)
        // Error handling is delegated to parent component
      } finally {
        setIsProcessing(false)
      }
    }, [onClick, loading, disabled, error, isProcessing])

    const isLoading = loading || isProcessing
    const isDisabled = disabled || isLoading || error

    const content = React.useMemo(() => {
      if (error && errorText) {
        return (
          <>
            <AlertCircleIcon className="h-4 w-4 mr-2" />
            {errorText}
          </>
        )
      }

      if (isLoading) {
        return (
          <>
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            {loadingText || 'Loading...'}
          </>
        )
      }

      return (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )
    }, [error, errorText, isLoading, loadingText, leftIcon, rightIcon, children])

    return (
      <button
        className={cn(
          buttonVariants({
            variant: error ? 'destructive' : variant,
            size,
            className
          })
        )}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        aria-busy={isLoading}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }