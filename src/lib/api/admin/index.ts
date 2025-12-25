import { createClient } from '@/lib/api/shared/supabase-client'
import type { Profile, Page, RolePagePermission, UserPagePermission, PagePermissions } from '@/lib/types/database'

export async function getUsers() {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('display_name')
  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: { display_name?: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUser(userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}

export async function getPages() {
  const supabase = createClient()
  const { data, error } = await supabase.from('pages').select('*').order('name')
  if (error) throw error
  return data
}

export async function createPage(page: { slug: string, name: string, description?: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('pages').insert(page).select().single()
  if (error) throw error
  return data
}

export async function updatePage(id: string, updates: { name?: string, description?: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('pages').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePage(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('pages').delete().eq('id', id).eq('is_system', false)
  if (error) throw error
}

export async function getRolePermissions(role?: string) {
  const supabase = createClient()
  let query = supabase.from('role_page_permissions').select('*, pages(*)').order('role')
  if (role) {
    query = query.eq('role', role)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateRolePermission(id: string, permissions: { can_view?: boolean, can_create?: boolean, can_update?: boolean, can_delete?: boolean }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('role_page_permissions')
    .update(permissions)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserPermissions(userId?: string) {
  const supabase = createClient()
  let query = supabase.from('user_page_permissions').select('*, pages(*))').order('user_id')
  if (userId) {
    query = query.eq('user_id', userId)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateUserPermission(
  userId: string,
  pageId: string,
  permissions: { can_view?: boolean | null, can_create?: boolean | null, can_update?: boolean | null, can_delete?: boolean | null }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_page_permissions')
    .upsert({
      user_id: userId,
      page_id: pageId,
      ...permissions
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserEffectivePermissions(userId: string, pageSlug: string) {
  const supabase = createClient()
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (!profile) throw new Error('User not found')
  
  const { data: page } = await supabase.from('pages').select('id').eq('slug', pageSlug).single()
  if (!page) throw new Error('Page not found')
  
  const { data: rolePerms } = await supabase
    .from('role_page_permissions')
    .select('can_view, can_create, can_update, can_delete')
    .eq('role', profile.role)
    .eq('page_id', page.id)
    .single()
  
  const { data: userPerms } = await supabase
    .from('user_page_permissions')
    .select('can_view, can_create, can_update, can_delete')
    .eq('user_id', userId)
    .eq('page_id', page.id)
    .maybeSingle()
  
  return {
    canView: userPerms?.can_view ?? rolePerms?.can_view ?? false,
    canCreate: userPerms?.can_create ?? rolePerms?.can_create ?? false,
    canUpdate: userPerms?.can_update ?? rolePerms?.can_update ?? false,
    canDelete: userPerms?.can_delete ?? rolePerms?.can_delete ?? false,
  }
}

export function startImpersonation(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('impersonating_user_id', userId)
    window.location.reload()
  }
}

export function stopImpersonation() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('impersonating_user_id')
    window.location.reload()
  }
}

export function getImpersonatingUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('impersonating_user_id')
  }
  return null
}

export async function getImpersonatedUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar_url')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function getAIConfiguration(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('chatgpt_api_key, ai_endpoint_url, ai_model_name')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return {
    apiKey: data?.chatgpt_api_key || null,
    endpointUrl: data?.ai_endpoint_url || 'https://api.openai.com/v1',
    modelName: data?.ai_model_name || 'gpt-4-turbo-preview',
  }
}

export async function saveAIConfiguration(userId: string, config: { apiKey: string, endpointUrl: string, modelName: string }) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      chatgpt_api_key: config.apiKey,
      ai_endpoint_url: config.endpointUrl,
      ai_model_name: config.modelName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  
  if (error) throw error
}

export async function getTransactionLedger(limit = 50) {
  const supabase = createClient()
  const { data, error } = await supabase.from('transaction_ledger').select('*').limit(limit)
  if (error) throw error
  return data
}

export async function getUsedTags() {
  const supabase = createClient()
  
  const { data: noteTags, error: noteError } = await supabase.from('note_tags').select('tag_name')
  if (noteError) throw noteError
  
  const { data: expenseTags, error: expenseError } = await supabase.from('expense_tags').select('tag_name')
  if (expenseError) throw expenseError
  
  const allTags = new Set<string>()
  noteTags?.forEach((t: any) => allTags.add(t.tag_name))
  expenseTags?.forEach((t: any) => allTags.add(t.tag_name))
  
  return Array.from(allTags).sort()
}

export async function deleteUserData(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('delete_user_data', { target_user_id: userId })
  if (error) throw error
  return data
}

export async function deleteAllSystemData() {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('delete_all_system_data')
  if (error) throw error
  return data
}

export async function getWorkcoverClaimsForLinking() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_claims')
    .select('id, claim_number, injury_date, status')
    .order('injury_date', { ascending: false })
  if (error) {
    console.error('Error fetching workcover claims:', error)
    return []
  }
  return data || []
}

export async function getAgedCareExpensesForLinking() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('aged_care_expenses')
    .select('id, invoice_number, description, expense_date, amount')
    .order('expense_date', { ascending: false })
  if (error) {
    console.error('Error fetching aged care expenses:', error)
    return []
  }
  return data || []
}

export async function getWorkcoverExpensesForLinking() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workcover_expenses')
    .select('id, invoice_number, description, expense_date, amount_charged')
    .order('expense_date', { ascending: false })
  if (error) {
    console.error('Error fetching workcover expenses:', error)
    return []
  }
  return data || []
}
