import { z } from 'zod'

// User registration schema
export const userRegistrationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// User profile update schema
export const userProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .trim()
    .optional(),

  website: z.string()
    .url('Invalid website URL')
    .max(200, 'Website URL must be less than 200 characters')
    .optional()
    .or(z.literal('')),

  twitter: z.string()
    .max(100, 'Twitter handle must be less than 100 characters')
    .regex(/^@?[\w]+$/, 'Invalid Twitter handle format')
    .optional()
    .or(z.literal(''))
    .transform((val) => val?.replace(/^@/, '') || undefined),

  github: z.string()
    .max(100, 'GitHub username must be less than 100 characters')
    .regex(/^[\w-]+$/, 'Invalid GitHub username format')
    .optional()
    .or(z.literal('')),

  linkedin: z.string()
    .max(100, 'LinkedIn profile must be less than 100 characters')
    .regex(/^[\w-]+$/, 'Invalid LinkedIn profile format')
    .optional()
    .or(z.literal('')),

  // Preferences
  emailNotifications: z.boolean().default(true),

  theme: z.enum(['light', 'dark', 'auto']).default('auto'),

  language: z.string()
    .length(2, 'Language must be a 2-character code')
    .default('en'),
})

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),

  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})

// User search/filter schema
export const userFilterSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .optional(),

  role: z.enum(['USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN']).optional(),

  isActive: z.boolean().optional(),

  page: z.number().int().min(1).default(1),

  limit: z.number().int().min(1).max(100).default(20),

  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email', 'lastLoginAt'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  dateFrom: z.string().datetime().optional(),

  dateTo: z.string().datetime().optional(),
})

// User role update schema (admin only)
export const userRoleUpdateSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),

  role: z.enum(['USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: 'Invalid role specified' })
  }),

  reason: z.string()
    .min(1, 'Reason for role change is required')
    .max(500, 'Reason must be less than 500 characters'),
})

// User activation/deactivation schema
export const userStatusSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),

  isActive: z.boolean(),

  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be less than 500 characters'),
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
})

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type UserFilterInput = z.infer<typeof userFilterSchema>
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>
export type UserStatusInput = z.infer<typeof userStatusSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>