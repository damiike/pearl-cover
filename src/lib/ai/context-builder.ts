import { createClient } from '@/lib/api/shared/supabase-client'
import type { AIContext } from './types'

export async function searchNotes(query: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const { data } = await supabase.rpc('search_notes', {
      search_query: query,
      limit_val: 10
    })
    return data || []
  } catch (error) {
    console.error('Error searching notes:', error)
    return []
  }
}

export async function searchClaims(query: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const { data } = await supabase.rpc('search_workcover_claims', {
      search_query: query,
      limit_val: 10
    })
    return data || []
  } catch (error) {
    console.error('Error searching claims:', error)
    return []
  }
}

export async function searchExpenses(query: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const [agedCareResults, workcoverResults] = await Promise.all([
      supabase.rpc('search_aged_care_expenses', {
        search_query: query,
        limit_val: 5
      }),
      supabase.rpc('search_workcover_expenses', {
        search_query: query,
        limit_val: 5
      })
    ])
    return [...(agedCareResults || []), ...(workcoverResults || [])]
  } catch (error) {
    console.error('Error searching expenses:', error)
    return []
  }
}

export async function searchPayments(query: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const { data } = await supabase.rpc('search_payment_transactions', {
      search_query: query,
      limit_val: 10
    })
    return data || []
  } catch (error) {
    console.error('Error searching payments:', error)
    return []
  }
}

export async function searchAttachments(query: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const { data } = await supabase.rpc('search_attachments', {
      search_query: query,
      limit_val: 10
    })
    return data || []
  } catch (error) {
    console.error('Error searching attachments:', error)
    return []
  }
}

export async function searchAllData(query: string): Promise<AIContext> {
  const [notes, claims, expenses, payments, attachments] = await Promise.all([
    searchNotes(query),
    searchClaims(query),
    searchExpenses(query),
    searchPayments(query),
    searchAttachments(query),
  ])

  return {
    notes,
    claims,
    expenses,
    payments,
    attachments,
  }
}

export async function getQuickStats() {
  const supabase = createClient()
  const [notesCount, claimsCount, expensesCount] = await Promise.all([
    supabase.from('notes').select('id', { count: 'exact', head: true }),
    supabase.from('workcover_claims').select('id', { count: 'exact', head: true }),
    supabase.from('aged_care_expenses').select('id', { count: 'exact', head: true }),
  ])

  return {
    notes: notesCount.count || 0,
    claims: claimsCount.count || 0,
    expenses: expensesCount.count || 0,
  }
}
