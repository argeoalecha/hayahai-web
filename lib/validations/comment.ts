import { z } from 'zod'

// Comment creation schema
export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),

  postId: z.string().cuid('Invalid post ID'),

  parentId: z.string().cuid('Invalid parent comment ID').optional(),

  // For anonymous users
  authorName: z.string()
    .min(1, 'Name is required for anonymous comments')
    .max(50, 'Name must be less than 50 characters')
    .trim()
    .optional(),

  authorEmail: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .optional(),

  authorUrl: z.string()
    .url('Invalid website URL')
    .max(200, 'Website URL must be less than 200 characters')
    .optional(),
}).superRefine((data, ctx) => {
  // If no authenticated user, require name and email for anonymous comments
  // This validation would be supplemented by checking session in the API
  if (!data.authorName && !data.authorEmail) {
    // This assumes we'll check for authenticated session in the API
    // If no session and no author details, it's invalid
  }
})

// Comment update schema (for moderation)
export const updateCommentSchema = z.object({
  id: z.string().cuid('Invalid comment ID'),

  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim()
    .optional(),

  approved: z.boolean().optional(),
})

// Comment filtering schema
export const commentFilterSchema = z.object({
  postId: z.string().cuid('Invalid post ID'),

  approved: z.boolean().optional(),

  authorId: z.string().cuid('Invalid author ID').optional(),

  page: z.number().int().min(1).default(1),

  limit: z.number().int().min(1).max(100).default(20),

  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Include replies in the response
  includeReplies: z.boolean().default(true),

  // Maximum depth for nested replies
  maxDepth: z.number().int().min(1).max(5).default(3),
})

// Comment moderation schema
export const commentModerationSchema = z.object({
  commentIds: z.array(z.string().cuid()).min(1, 'At least one comment ID required').max(100),

  action: z.enum(['approve', 'reject', 'delete'], {
    errorMap: () => ({ message: 'Action must be approve, reject, or delete' })
  }),

  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
})

// Comment analytics schema
export const commentAnalyticsSchema = z.object({
  postId: z.string().cuid('Invalid post ID').optional(),

  dateFrom: z.string().datetime().optional(),

  dateTo: z.string().datetime().optional(),

  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

export type CommentCreateInput = z.infer<typeof commentSchema>
export type CommentUpdateInput = z.infer<typeof updateCommentSchema>
export type CommentFilterInput = z.infer<typeof commentFilterSchema>
export type CommentModerationInput = z.infer<typeof commentModerationSchema>
export type CommentAnalyticsInput = z.infer<typeof commentAnalyticsSchema>