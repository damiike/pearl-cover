'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Application Error</h1>
            <p className="text-muted-foreground">Something went wrong. Please try again.</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
