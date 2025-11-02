/**
 * Enhanced Form Components with Theme Electric styling
 *
 * Provides reusable form components with validation states,
 * accessibility features, and consistent Theme Electric design.
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ===== FormField Wrapper =====
interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="label-te">
          {label}
          {required && <span className="text-te-vibrant-coral ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-te-vibrant-coral flex items-center gap-1">
          <span className="text-xs">⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-sm text-te-sage">{hint}</p>
      )}
    </div>
  )
}

// ===== Input =====
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'input-te',
          error && 'border-te-vibrant-coral focus:border-te-vibrant-coral',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// ===== Textarea =====
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'input-te resize-y',
          error && 'border-te-vibrant-coral focus:border-te-vibrant-coral',
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

// ===== Select =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'input-te',
          error && 'border-te-vibrant-coral focus:border-te-vibrant-coral',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

// ===== Checkbox =====
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'w-4 h-4 rounded border-te-sage text-te-vibrant-coral',
            'focus:ring-2 focus:ring-te-vibrant-coral focus:ring-offset-2',
            'transition-colors duration-200',
            className
          )}
          {...props}
        />
        {label && <span className="text-sm text-te-charcoal">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// ===== Radio =====
interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          ref={ref}
          type="radio"
          className={cn(
            'w-4 h-4 border-te-sage text-te-vibrant-coral',
            'focus:ring-2 focus:ring-te-vibrant-coral focus:ring-offset-2',
            'transition-colors duration-200',
            className
          )}
          {...props}
        />
        {label && <span className="text-sm text-te-charcoal">{label}</span>}
      </label>
    )
  }
)
Radio.displayName = 'Radio'

// ===== RadioGroup =====
interface RadioGroupProps {
  options: Array<{ value: string; label: string }>
  name: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function RadioGroup({
  options,
  name,
  value,
  onChange,
  className
}: RadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ))}
    </div>
  )
}
