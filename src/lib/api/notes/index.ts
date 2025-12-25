import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  Note,
  NoteInsert,
  NoteUpdate,
  NoteWithRelations,
  NoteCategory
} from '@/lib/types/database'

export async function getNoteCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('note_categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as NoteCategory[]
}

export async function getNotes(filters?: {
  categoryId?: string
  isArchived?: boolean
  isPinned?: boolean
  parentId?: string | null
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('notes')
    .select(`
      *,
      category:note_categories(*),
      tags:note_tags(*),
      children:notes!parent_id(*),
      linked_workcover_claims:note_workcover_claims(
        workcover_claims(id, claim_number)
      ),
      linked_aged_care_expenses:note_aged_care_expenses(
        aged_care_expenses(id, invoice_number, description)
      ),
      linked_workcover_expenses:note_workcover_expenses(
        workcover_expenses(id, invoice_number, description)
      )
    `)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters?.isArchived !== undefined) {
    query = query.eq('is_archived', filters.isArchived)
  }
  if (filters?.isPinned !== undefined) {
    query = query.eq('is_pinned', filters.isPinned)
  }
  if (filters?.parentId !== undefined) {
    if (filters.parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', filters.parentId)
    }
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((note: any) => ({
    ...note,
    tags: note.note_tags?.map((t: any) => t.tag_name) || [],
    children: note.children || []
  })) as NoteWithRelations[]
}

export async function getNote(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      category:note_categories(*),
      tags:note_tags(*),
      children:notes!parent_id(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as NoteWithRelations
}

export async function createNote(note: NoteInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single()
  if (error) throw error
  return data as Note
}

export async function updateNote(id: string, updates: NoteUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Note
}

export async function deleteNote(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function addNoteTag(noteId: string, tagName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('note_tags')
    .insert({
      note_id: noteId,
      tag_name: tagName
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeNoteTag(tagId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('note_tags')
    .delete()
    .eq('id', tagId)
  if (error) throw error
}

export async function linkNoteToWorkcoverClaim(noteId: string, claimId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('note_workcover_claims')
    .insert({
      note_id: noteId,
      workcover_claim_id: claimId,
      created_by: user?.id
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function linkNoteToAgedCareExpense(noteId: string, expenseId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('note_aged_care_expenses')
    .insert({
      note_id: noteId,
      aged_care_expense_id: expenseId,
      created_by: user?.id
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function linkNoteToWorkcoverExpense(noteId: string, expenseId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('note_workcover_expenses')
    .insert({
      note_id: noteId,
      workcover_expense_id: expenseId,
      created_by: user?.id
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unlinkNoteFromWorkcoverClaim(noteId: string, claimId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('note_workcover_claims')
    .delete()
    .eq('note_id', noteId)
    .eq('workcover_claim_id', claimId)
  if (error) throw error
}

export async function unlinkNoteFromAgedCareExpense(noteId: string, expenseId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('note_aged_care_expenses')
    .delete()
    .eq('note_id', noteId)
    .eq('aged_care_expense_id', expenseId)
  if (error) throw error
}

export async function unlinkNoteFromWorkcoverExpense(noteId: string, expenseId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('note_workcover_expenses')
    .delete()
    .eq('note_id', noteId)
    .eq('workcover_expense_id', expenseId)
  if (error) throw error
}
