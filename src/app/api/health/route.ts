import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0'
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    )
  }
}
