import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const errorReportSchema = z.object({
  errorId: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  level: z.enum(['page', 'component', 'section']).optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = errorReportSchema.parse(body)

    // Log error for debugging
    console.error('Client Error Report:', {
      id: validatedData.errorId,
      message: validatedData.message,
      level: validatedData.level,
      timestamp: validatedData.timestamp,
      url: validatedData.url,
    })

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other error tracking service
      // Example:
      // await sentry.captureException(new Error(validatedData.message), {
      //   tags: { source: 'client', errorId: validatedData.errorId },
      //   extra: validatedData
      // })
    }

    return NextResponse.json(
      { success: true, errorId: validatedData.errorId },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to process error report:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid error report format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}