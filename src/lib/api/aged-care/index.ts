import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  FundingAccount,
  FundingAccountInsert,
  FundingAccountUpdate,
  FundingAllocation,
  FundingAllocationInsert,
  AgedCareExpense,
  AgedCareExpenseInsert,
  AgedCareExpenseUpdate,
  AgedCareExpenseWithRelations
} from '@/lib/types/database'

export async function getFundingAccounts(activeOnly = true) {
  const supabase = createClient()
  let query = supabase.from('funding_accounts').select('*').order('account_name')
  if (activeOnly) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data as FundingAccount[]
}

export async function getFundingAccountBalances() {
  const supabase = createClient()
  const { data, error } = await supabase.from('funding_account_balances').select('*')
  if (error) throw error
  return data
}

export async function createFundingAccount(account: FundingAccountInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_accounts')
    .insert(account)
    .select()
    .single()
  if (error) throw error
  return data as FundingAccount
}

export async function updateFundingAccount(id: string, updates: FundingAccountUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as FundingAccount
}

export async function deleteFundingAccount(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('funding_accounts').delete().eq('id', id)
  if (error) throw error
}

export async function getFundingAllocations(fundingAccountId?: string) {
  const supabase = createClient()
  let query = supabase.from('funding_allocations').select('*').order('allocation_date', { ascending: false })
  if (fundingAccountId) {
    query = query.eq('funding_account_id', fundingAccountId)
  }
  const { data, error } = await query
  if (error) throw error
  return data as FundingAllocation[]
}

export async function createFundingAllocation(allocation: FundingAllocationInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_allocations')
    .insert(allocation)
    .select()
    .single()
  if (error) throw error
  return data as FundingAllocation
}

export async function getAgedCareExpenses(filters?: {
  fundingAccountId?: string
  supplierId?: string
  status?: string
  fromDate?: string
  toDate?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('aged_care_expenses')
    .select(`
      *,
      supplier:suppliers(*),
      category:expense_categories(*),
      payment_transaction:payment_transactions(*),
      tags:expense_tags(*)
    `)
    .order('expense_date', { ascending: false })

  if (filters?.fundingAccountId) {
    query = query.eq('funding_account_id', filters.fundingAccountId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.fromDate) {
    query = query.gte('expense_date', filters.fromDate)
  }
  if (filters?.toDate) {
    query = query.lte('expense_date', filters.toDate)
  }
  if (filters?.supplierId) {
    query = query.eq('supplier_id', filters.supplierId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AgedCareExpenseWithRelations[]
}

export async function getAgedCareExpense(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aged_care_expenses')
    .select(`
      *,
      supplier:suppliers(*),
      category:expense_categories(*),
      payment_transaction:payment_transactions(*),
      tags:expense_tags(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as AgedCareExpenseWithRelations
}

export async function createAgedCareExpense(expense: AgedCareExpenseInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aged_care_expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data as AgedCareExpense
}

export async function updateAgedCareExpense(id: string, updates: AgedCareExpenseUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aged_care_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as AgedCareExpense
}

export async function deleteAgedCareExpense(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('aged_care_expenses').delete().eq('id', id)
  if (error) throw error
}
