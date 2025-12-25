// AI Context Builder - Database Search Functions
import { createClient } from '@/lib/supabase/client'
import type { AIContext } from './types'

/**
 * Search notes using full-text search
 */
export async function searchNotes(query: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('notes')
        .select(`
      id,
      title,
      content,
      category_id,
      is_pinned,
      is_archived,
      created_at,
      note_tags (
        tag_name
      )
    `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error searching notes:', error)
        return []
    }

    // Flatten tags
    return (data || []).map(note => ({
        ...note,
        tags: note.note_tags?.map((t: any) => t.tag_name) || [],
    }))
}

/**
 * Search WorkCover claims
 */
export async function searchClaims(query: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('workcover_claims')
        .select('*')
        .or(`claim_number.ilike.%${query}%,injury_description.ilike.%${query}%`)
        .order('injury_date', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error searching claims:', error)
        return []
    }

    return data || []
}

/**
 * Search all expenses (both aged care and workcover)
 */
export async function searchExpenses(query: string): Promise<any[]> {
    const supabase = createClient()

    // Search aged care expenses
    const { data: agedCareData } = await supabase
        .from('aged_care_expenses')
        .select(`
      id,
      description,
      amount,
      expense_date,
      status,
      invoice_number,
      suppliers (name)
    `)
        .or(`description.ilike.%${query}%,invoice_number.ilike.%${query}%`)
        .order('expense_date', { ascending: false })
        .limit(5)

    // Search workcover expenses
    const { data: workcoverData } = await supabase
        .from('workcover_expenses')
        .select(`
      id,
      description,
      amount_charged,
      amount_reimbursed,
      gap_amount,
      expense_date,
      status,
      invoice_number,
      claim_id,
      suppliers (name)
    `)
        .or(`description.ilike.%${query}%,invoice_number.ilike.%${query}%`)
        .order('expense_date', { ascending: false })
        .limit(5)

    return [...(agedCareData || []), ...(workcoverData || [])]
}

/**
 * Search payment transactions
 */
export async function searchPayments(query: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .or(`reference.ilike.%${query}%,payer.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('payment_date', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error searching payments:', error)
        return []
    }

    return data || []
}

/**
 * Search attachments using OCR text
 */
export async function searchAttachments(query: string): Promise<any[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .or(`file_name.ilike.%${query}%,ocr_text.ilike.%${query}%`)
        .order('upload_date', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error searching attachments:', error)
        return []
    }

    return data || []
}

/**
 * Search all data sources and build unified context
 */
export async function searchAllData(query: string): Promise<AIContext> {
    // Run all searches in parallel
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

/**
 * Get quick stats for the dashboard
 */
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
