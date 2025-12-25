import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  PaymentTransaction,
  PaymentTransactionInsert,
  PaymentTransactionUpdate
} from '@/lib/types/database'

export async function getPaymentTransactions(filters?: {
  paymentType?: string
  fromDate?: string
  toDate?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('payment_transactions')
    .select('*')
    .order('payment_date', { ascending: false })

  if (filters?.paymentType) {
    query = query.eq('payment_type', filters.paymentType)
  }
  if (filters?.fromDate) {
    query = query.gte('payment_date', filters.fromDate)
  }
  if (filters?.toDate) {
    query = query.lte('payment_date', filters.toDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PaymentTransaction[]
}

export async function createPaymentTransaction(payment: PaymentTransactionInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert(payment)
    .select()
    .single()
  if (error) throw error
  return data as PaymentTransaction
}

export async function updatePaymentTransaction(id: string, updates: PaymentTransactionUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PaymentTransaction
}
