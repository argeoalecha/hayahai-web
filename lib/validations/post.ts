import { z } from 'zod'

// Post creation and update schema
export const postSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),

  slug: z.string()
    .max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional(),

  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .trim()
    .optional(),

  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(100000, 'Content must be less than 100,000 characters'),

  coverImage: z.string()
    .url('Cover image must be a valid URL')
    .max(500, 'Cover image URL must be less than 500 characters')
    .optional(),

  published: z.boolean().default(false),

  featured: z.boolean().default(false),

  category: z.enum(['TECHNOLOGY', 'TRAVEL', 'SITES'], {
    errorMap: () => ({ message: 'Category must be TECHNOLOGY, TRAVEL, or SITES' })
  }),

  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').default([]),

  // SEO fields
  seoTitle: z.string()
    .max(70, 'SEO title must be less than 70 characters')
    .trim()
    .optional(),

  seoDescription: z.string()
    .max(160, 'SEO description must be less than 160 characters')
    .trim()
    .optional(),

  seoKeywords: z.array(z.string().min(1).max(30))
    .max(20, 'Maximum 20 SEO keywords allowed')
    .default([]),

  ogImage: z.string()
    .url('OG image must be a valid URL')
    .max(500, 'OG image URL must be less than 500 characters')
    .optional(),

  canonicalUrl: z.string()
    .url('Canonical URL must be a valid URL')
    .max(500, 'Canonical URL must be less than 500 characters')
    .optional(),

  // Interactive features
  hasMap: z.boolean().default(false),
  hasTimeline: z.boolean().default(false),
  hasCodeBlocks: z.boolean().default(false),
  hasGallery: z.boolean().default(false),
})

// Search and filtering schema
export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .optional(),

  category: z.enum(['TECHNOLOGY', 'TRAVEL', 'SITES']).optional(),

  tags: z.array(z.string().min(1).max(50)).max(10).optional(),

  published: z.boolean().optional(),

  featured: z.boolean().optional(),

  page: z.number().int().min(1).default(1),

  limit: z.number().int().min(1).max(50).default(12),

  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title', 'views', 'likes'])
    .default('publishedAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  dateFrom: z.string().datetime().optional(),

  dateTo: z.string().datetime().optional(),

  authorId: z.string().cuid().optional(),
})

// Update post schema (partial of post schema)
export const updatePostSchema = postSchema.partial().extend({
  id: z.string().cuid('Invalid post ID')
})

// Travel location schema for posts
export const travelLocationSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
})

// Timeline event schema for posts
export const timelineEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date: z.string().datetime(),
  order: z.number().int().min(0).max(32767),
})

// Code block schema for posts
export const codeBlockSchema = z.object({
  title: z.string().min(1).max(100),
  language: z.string().min(1).max(50),
  code: z.string().min(1),
  order: z.number().int().min(0).max(32767),
})

// Media gallery schema for posts
export const mediaGallerySchema = z.object({
  url: z.string().url().max(500),
  alt: z.string().min(1).max(200),
  caption: z.string().max(500).optional(),
  order: z.number().int().min(0).max(32767),
  type: z.enum(['image', 'video']),
})

// Post with interactive content schema
export const postWithContentSchema = postSchema.extend({
  travelLocations: z.array(travelLocationSchema).max(20).optional(),
  timelineEvents: z.array(timelineEventSchema).max(50).optional(),
  codeBlocks: z.array(codeBlockSchema).max(20).optional(),
  mediaGallery: z.array(mediaGallerySchema).max(50).optional(),
})

export type PostCreateInput = z.infer<typeof postSchema>
export type PostUpdateInput = z.infer<typeof updatePostSchema>
export type PostSearchInput = z.infer<typeof searchSchema>
export type TravelLocationInput = z.infer<typeof travelLocationSchema>
export type TimelineEventInput = z.infer<typeof timelineEventSchema>
export type CodeBlockInput = z.infer<typeof codeBlockSchema>
export type MediaGalleryInput = z.infer<typeof mediaGallerySchema>