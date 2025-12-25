import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchAllData } from '@/lib/ai/context-builder'
import { generateSystemPrompt, buildContextFromResults } from '@/lib/ai/chatgpt'

const SIMPLE_RATE_LIMIT = new Map<string, number[]>()

function checkRateLimit(userId: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now()
  const timestamps = SIMPLE_RATE_LIMIT.get(userId) || []
  
  const recentRequests = timestamps.filter(t => now - t < windowMs)
  SIMPLE_RATE_LIMIT.set(userId, recentRequests)
  
  if (recentRequests.length >= maxRequests) {
    return false
  }
  
  recentRequests.push(now)
  return true
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!checkRateLimit(user.id, 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('chatgpt_api_key, ai_endpoint_url, ai_model_name')
      .eq('id', user.id)
      .single()

    if (!profile?.chatgpt_api_key) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const searchResults = await searchAllData(query)
    const context = buildContextFromResults(
      searchResults.notes,
      searchResults.claims,
      searchResults.expenses,
      searchResults.payments,
      searchResults.attachments
    )

    const systemPrompt = generateSystemPrompt()
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Context from database:\n\n${context}\n\nUser question: ${query}` }
    ]

    const openai = new OpenAI({
      apiKey: profile.chatgpt_api_key,
      baseURL: profile.ai_endpoint_url || 'https://api.openai.com/v1'
    })

    const completion = await openai.chat.completions.create({
      model: profile.ai_model_name || 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      content: response,
      sources: {
        notes: searchResults.notes.length,
        claims: searchResults.claims.length,
        expenses: searchResults.expenses.length,
        payments: searchResults.payments.length,
        attachments: searchResults.attachments.length
      }
    })
  } catch (error: any) {
    console.error('AI chat error:', error)
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your API key in settings.' },
        { status: 401 }
      )
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
