import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  WorkcoverClaim,
  WorkcoverClaimInsert,
  WorkcoverClaimUpdate,
  WorkcoverExpense,
  WorkcoverExpenseInsert,
  WorkcoverExpenseUpdate,
  WorkcoverExpenseWithRelations
} from '@/lib/types/database'

export async function getWorkcoverClaims(status?: string) {
  const supabase = createClient()
  let query = supabase.from('workcover_claims').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) throw error
  return data as WorkcoverClaim[]
}

export async function getWorkcoverClaimSummaries() {
  const supabase = createClient()
  const { data, error } = await supabase.from('workcover_claim_summaries').select('*')
  if (error) throw error
  return data
}

export async function getWorkcoverClaim(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_claims')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as WorkcoverClaim
}

export async function createWorkcoverClaim(claim: WorkcoverClaimInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_claims')
    .insert(claim)
    .select()
    .single()
  if (error) throw error
  return data as WorkcoverClaim
}

export async function updateWorkcoverClaim(id: string, updates: WorkcoverClaimUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_claims')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as WorkcoverClaim
}

export async function getWorkcoverExpenses(filters?: { claimId?: string, supplierId?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('workcover_expenses')
    .select(`
      *,
      supplier:suppliers(*),
      category:expense_categories(*),
      claim:workcover_claims(*),
      tags:expense_tags(*)
    `)
    .order('expense_date', { ascending: false })

  if (filters?.claimId) {
    query = query.eq('claim_id', filters.claimId)
  }
  if (filters?.supplierId) {
    query = query.eq('supplier_id', filters.supplierId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as WorkcoverExpenseWithRelations[]
}

export async function createWorkcoverExpense(expense: WorkcoverExpenseInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data as WorkcoverExpense
}

export async function updateWorkcoverExpense(id: string, updates: WorkcoverExpenseUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as WorkcoverExpense
}

export async function deleteWorkcoverExpense(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('workcover_expenses').delete().eq('id', id)
  if (error) throw error
}
