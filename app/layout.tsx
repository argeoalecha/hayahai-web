import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hayah-AI Blog Platform',
  description: 'A bulletproof, error-free blog platform for Technology, Travel, and Sites content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary level="page">
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}