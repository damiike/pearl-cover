import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate
} from '@/lib/types/database'

export async function getSuppliers(activeOnly = true) {
  const supabase = createClient()
  let query = supabase.from('suppliers').select('*').order('name')
  if (activeOnly) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query
  if (error) throw error
  return data as Supplier[]
}

export async function getSupplier(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Supplier
}

export async function createSupplier(supplier: SupplierInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(id: string, updates: SupplierUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}

export async function getExpenseCategories(domain: 'aged_care' | 'workcover' | 'both' = 'aged_care') {
  const supabase = createClient()
  let query = supabase.from('expense_categories').select('*').eq('is_active', true).order('name')
  if (domain) {
    query = query.or(`expense_domain.eq.${domain}, expense_domain.eq.both`)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}
