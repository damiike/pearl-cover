import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Home className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
