import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('chatgpt_api_key, ai_endpoint_url, ai_model_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      apiKey: !!profile.chatgpt_api_key,
      endpointUrl: profile.ai_endpoint_url || 'https://api.openai.com/v1',
      modelName: profile.ai_model_name || 'gpt-4-turbo-preview'
    })
  } catch (error: any) {
    console.error('Error getting AI config:', error)
    return NextResponse.json(
      { error: 'Failed to get AI configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { apiKey, endpointUrl, modelName } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        chatgpt_api_key: apiKey,
        ai_endpoint_url: endpointUrl || 'https://api.openai.com/v1',
        ai_model_name: modelName || 'gpt-4-turbo-preview',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating AI config:', error)
      return NextResponse.json(
        { error: 'Failed to update AI configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating AI config:', error)
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    )
  }
}
