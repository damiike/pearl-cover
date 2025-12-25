import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { message, stack, componentStack, url, userAgent } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      )
    }

    const errorData = {
      user_id: user?.id || null,
      error_message: message,
      stack_trace: stack || null,
      component_stack: componentStack || null,
      url: url || null,
      user_agent: userAgent || null,
    }

    const { error } = await supabase
      .from('error_logs')
      .insert(errorData)

    if (error) {
      console.error('Failed to log error to database:', error)
      return NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in log-error endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process error log' },
      { status: 500 }
    )
  }
}
