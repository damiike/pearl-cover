import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, env vars may not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build (this won't be called at runtime)
    if (typeof window === 'undefined') {
      // Server-side during build - return null
      return null as unknown as SupabaseClient
    }
    throw new Error('Missing Supabase environment variables')
  }

  if (client) {
    return client
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}

