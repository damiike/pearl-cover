'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (typeof window !== 'undefined') {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(err => console.error('Failed to log error:', err))
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;re sorry for the inconvenience. The error has been logged and our team will investigate.
              </p>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="default">
                  Try Again
                </Button>
                <Button onClick={this.handleGoToDashboard} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Error details:</p>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

     return this.props.children
  }
}
