import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export { createBrowserClient }
export { createSupabaseServerClient as createServerSideClient }
