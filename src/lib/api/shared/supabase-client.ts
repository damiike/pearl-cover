import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export { createBrowserClient as createClient }
export { createServerClient as createSupabaseServerClient }
