// API Services for Pearl Cover
// Provides type-safe CRUD operations for all database entities

import { createClient } from '@/lib/supabase/client'
import type {
    Supplier, SupplierInsert, SupplierUpdate,
    FundingAccount, FundingAccountInsert, FundingAccountUpdate,
    FundingAllocation, FundingAllocationInsert,
    AgedCareExpense, AgedCareExpenseInsert, AgedCareExpenseUpdate, AgedCareExpenseWithRelations,
    WorkcoverClaim, WorkcoverClaimInsert, WorkcoverClaimUpdate,
    WorkcoverExpense, WorkcoverExpenseInsert, WorkcoverExpenseUpdate, WorkcoverExpenseWithRelations,
    PaymentTransaction, PaymentTransactionInsert, PaymentTransactionUpdate,
    Note, NoteInsert, NoteUpdate, NoteWithRelations,
    NoteCategory,
    ExpenseCategory,
    AuditLog,
    FundingAccountBalance,
    WorkcoverClaimSummary,
    TransactionLedgerEntry,
    Attachment,
    AttachmentInsert,
    EntityType,
    CalendarCategory,
    CalendarEvent,
    CalendarEventInsert,
    CalendarEventUpdate,
    CalendarEventWithRelations,
    Page,
    RolePagePermission,
    UserPagePermission,
    PagePermissions
} from '@/lib/types/database'

// ============================================================
// SUPPLIERS
// ============================================================

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

// ============================================================
// EXPENSE CATEGORIES
// ============================================================

export async function getExpenseCategories(domain?: 'aged_care' | 'workcover' | 'both') {
    const supabase = createClient()
    let query = supabase.from('expense_categories').select('*').eq('is_active', true).order('name')
    if (domain) {
        query = query.or(`expense_domain.eq.${domain}, expense_domain.eq.both`)
    }
    const { data, error } = await query
    if (error) throw error
    return data as ExpenseCategory[]
}

// ============================================================
// NOTE CATEGORIES
// ============================================================

export async function getNoteCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('note_categories')
        .select('*')
        .order('sort_order')
    if (error) throw error
    return data as NoteCategory[]
}

// ============================================================
// FUNDING ACCOUNTS
// ============================================================

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
    const { data, error } = await supabase
        .from('funding_account_balances')
        .select('*')
    if (error) throw error
    return data as FundingAccountBalance[]
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

// ============================================================
// FUNDING ALLOCATIONS
// ============================================================

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

// ============================================================
// AGED CARE EXPENSES
// ============================================================

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
    if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
    }
    if (filters?.toDate) {
        query = query.lte('expense_date', filters.toDate)
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

// ============================================================
// WORKCOVER CLAIMS
// ============================================================

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
    const { data, error } = await supabase
        .from('workcover_claim_summaries')
        .select('*')
    if (error) throw error
    return data as WorkcoverClaimSummary[]
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

// ============================================================
// WORKCOVER EXPENSES
// ============================================================

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

// ============================================================
// PAYMENT TRANSACTIONS
// ============================================================

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

// ============================================================
// NOTES
// ============================================================

export async function getNotes(filters?: {
    categoryId?: string
    isArchived?: boolean
    isPinned?: boolean
    parentId?: string | null // null for root notes, string for specific parent, undefined for all
    search?: string
}) {
    const supabase = createClient()
    let query = supabase
        .from('notes')
        .select(`
            *,
            category: note_categories(*),
            tags: note_tags(*),
            children: notes!parent_id(*),
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
    // Manual fetch of children relations if needed, but 'children:notes!parent_id(*)' should work if recursive FK is set up.
    // However, standardized deep recursion is hard. For 1 level it's fine.

    return data as NoteWithRelations[]
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

// ============================================================
// AUDIT LOGS
// ============================================================

export async function getAuditLogs(filters?: {
    entityType?: string
    action?: string
    limit?: number
}) {
    const supabase = createClient()
    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(filters?.limit || 100)

    if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType)
    }
    if (filters?.action) {
        query = query.eq('action', filters.action)
    }

    const { data, error } = await query
    if (error) throw error
    return data as AuditLog[]
}

// ============================================================
// TRANSACTION LEDGER
// ============================================================

export async function getTransactionLedger(limit = 50) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('transaction_ledger')
        .select('*')
        .limit(limit)
    if (error) throw error
    return data as TransactionLedgerEntry[]
}

// ============================================================
// PROFILES
// ============================================================

export async function updateProfile(id: string, updates: { display_name?: string; avatar_url?: string }) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

// ============================================================
// TAGS
// ============================================================

export async function addExpenseTag(
    expenseId: string,
    type: 'aged_care' | 'workcover',
    tagName: string
) {
    const supabase = createClient()

    const payload: any = {
        tag_name: tagName
    }

    if (type === 'aged_care') {
        payload.aged_care_expense_id = expenseId
    } else {
        payload.workcover_expense_id = expenseId
    }

    const { data, error } = await supabase
        .from('expense_tags')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function removeExpenseTag(tagId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('expense_tags')
        .delete()
        .eq('id', tagId)

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

export async function getUsedTags() {
    const supabase = createClient()

    // Get tags from both tables
    const { data: noteTags, error: noteError } = await supabase
        .from('note_tags')
        .select('tag_name')

    if (noteError) throw noteError

    const { data: expenseTags, error: expenseError } = await supabase
        .from('expense_tags')
        .select('tag_name')

    if (expenseError) throw expenseError

    // Combine and deduplicate
    const allTags = new Set<string>()
    noteTags?.forEach(t => allTags.add(t.tag_name))
    expenseTags?.forEach(t => allTags.add(t.tag_name))

    return Array.from(allTags).sort()
}

// ============================================================
// ATTACHMENTS
// ============================================================

export async function getAttachments(entityId: string, entityType: EntityType) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('upload_date', { ascending: false })

    if (error) throw error
    return data as Attachment[]
}

export async function getAttachmentsByEntityType(entityType: EntityType) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .order('upload_date', { ascending: false })

    if (error) throw error
    return data as Attachment[]
}

export async function uploadAttachment(
    file: File,
    entityId: string,
    entityType: EntityType
) {
    const supabase = createClient()

    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${entityType} /${entityId}/${Math.random().toString(36).substring(7)}.${fileExt} `

    const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)

    if (uploadError) throw uploadError

    // 2. Insert record into attachments table
    const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

    const attachmentData: AttachmentInsert = {
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        ocr_text: null,
        uploaded_by: null
    }

    const { data, error } = await supabase
        .from('attachments')
        .insert(attachmentData)
        .select()
        .single()

    if (error) throw error
    return data as Attachment
}

export async function deleteAttachment(id: string, filePath: string) {
    const supabase = createClient()

    // 1. Delete from storage
    const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([filePath])

    if (storageError) console.error('Error deleting file from storage:', storageError)

    // 2. Delete from table
    const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============================================================
// CALENDAR
// ============================================================

export async function getCalendarCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('calendar_categories')
        .select('*')
        .order('sort_order')
    if (error) throw error
    return data as CalendarCategory[]
}

export async function getCalendarEvents(filters?: {
    startDate?: string
    endDate?: string
    categoryId?: string
    search?: string
}) {
    const supabase = createClient()
    let query = supabase
        .from('calendar_events')
        .select(`
            *,
            category:calendar_categories(*),
            tags:event_tags(*)
        `)
        .order('start_time', { ascending: true })

    if (filters?.startDate) {
        query = query.gte('end_time', filters.startDate)
    }
    if (filters?.endDate) {
        query = query.lte('start_time', filters.endDate)
    }
    if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data as CalendarEventWithRelations[]
}

export async function createCalendarEvent(event: CalendarEventInsert) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('calendar_events')
        .insert(event)
        .select()
        .single()
    if (error) throw error
    return data as CalendarEvent
}

export async function updateCalendarEvent(id: string, updates: CalendarEventUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data as CalendarEvent
}

export async function deleteCalendarEvent(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) throw error
}

export async function addEventTag(eventId: string, tagName: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('event_tags')
        .insert({
            event_id: eventId,
            tag_name: tagName
        })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function removeEventTag(tagId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('event_tags')
        .delete()
        .eq('id', tagId)
    if (error) throw error
}

export async function fetchGoogleEvents(accessToken: string, timeMin: string, timeMax: string, calendarId: string = 'primary') {
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events')
    }

    const data = await response.json()
    return data.items || []
}

// Promise cache to prevent race conditions during parallel calls (e.g. React Strict Mode)
let findOrCreatePromise: Promise<string> | null = null;

export async function findOrCreatePearlCareCalendar(accessToken: string) {
    if (findOrCreatePromise) return findOrCreatePromise;

    findOrCreatePromise = (async () => {
        try {
            // 1. List calendars to see if it exists
            const listResponse = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            )

            if (!listResponse.ok) throw new Error('Failed to list calendars')

            const listData = await listResponse.json()
            // Find ALL matches to avoid creating duplicates
            const matches = listData.items?.filter((c: any) => c.summary === 'Pearl Care' && !c.deleted)

            if (matches && matches.length > 0) {
                return matches[0].id
            }

            // 2. Create if not exists
            const createResponse = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        summary: 'Pearl Care',
                        description: 'Calendar for Pearl Care bookings and appointments'
                    })
                }
            )

            if (!createResponse.ok) throw new Error('Failed to create Pearl Care calendar')

            const newCalendar = await createResponse.json()
            return newCalendar.id
        } finally {
            // Clear promise after a short delay to allow subsequent fresh checks if needed
            setTimeout(() => { findOrCreatePromise = null }, 2000)
        }
    })();

    return findOrCreatePromise
}

export async function createGoogleCalendarEvent(accessToken: string, calendarId: string, event: any) {
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }
    )
    if (!response.ok) throw new Error('Failed to create Google Event')
    return await response.json()
}

export async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string, event: any) {
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }
    )
    if (!response.ok) throw new Error('Failed to update Google Event')
    return await response.json()
}

export async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        }
    )
    if (!response.ok) throw new Error('Failed to delete Google Event')
    return true
}

// ============================================================
// RBAC - USERS, PAGES & PERMISSIONS
// ============================================================

export async function getUsers() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name')
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

export async function deleteUser(userId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
    if (error) throw error
}

export async function getPages() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('name')
    if (error) throw error
    return data
}

export async function createPage(page: { slug: string; name: string; description?: string }) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('pages')
        .insert(page)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updatePage(id: string, updates: { name?: string; description?: string }) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deletePage(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id)
        .eq('is_system', false)
    if (error) throw error
}

export async function getRolePermissions(role?: string) {
    const supabase = createClient()
    let query = supabase
        .from('role_page_permissions')
        .select('*, pages(*)')
        .order('role')
    if (role) {
        query = query.eq('role', role)
    }
    const { data, error } = await query
    if (error) throw error
    return data
}

export async function updateRolePermission(
    id: string,
    permissions: { can_view?: boolean; can_create?: boolean; can_update?: boolean; can_delete?: boolean }
) {
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
    let query = supabase
        .from('user_page_permissions')
        .select('*, pages(*)')
        .order('user_id')
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
    permissions: { can_view?: boolean | null; can_create?: boolean | null; can_update?: boolean | null; can_delete?: boolean | null }
) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('user_page_permissions')
        .upsert({ user_id: userId, page_id: pageId, ...permissions })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function getUserEffectivePermissions(userId: string, pageSlug: string) {
    const supabase = createClient()

    // Get user's role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (!profile) throw new Error('User not found')

    // Get page
    const { data: page } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', pageSlug)
        .single()

    if (!page) throw new Error('Page not found')

    // Get role permissions
    const { data: rolePerms } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('role', profile.role)
        .eq('page_id', page.id)
        .single()

    // Get user-specific overrides
    const { data: userPerms } = await supabase
        .from('user_page_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('page_id', page.id)
        .maybeSingle()

    // Merge permissions (user overrides take precedence)
    return {
        canView: userPerms?.can_view ?? rolePerms?.can_view ?? false,
        canCreate: userPerms?.can_create ?? rolePerms?.can_create ?? false,
        canUpdate: userPerms?.can_update ?? rolePerms?.can_update ?? false,
        canDelete: userPerms?.can_delete ?? rolePerms?.can_delete ?? false
    }
}

// Impersonation functions
export function startImpersonation(userId: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('impersonating_user_id', userId)
        // Force page reload to apply impersonation
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
// Note Linking Service Functions

export async function linkNoteToWorkcoverClaim(noteId: string, claimId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('note_workcover_claims')
        .insert({
            note_id: noteId,
            workcover_claim_id: claimId,
            created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function linkNoteToAgedCareExpense(noteId: string, expenseId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('note_aged_care_expenses')
        .insert({
            note_id: noteId,
            aged_care_expense_id: expenseId,
            created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function linkNoteToWorkcoverExpense(noteId: string, expenseId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('note_workcover_expenses')
        .insert({
            note_id: noteId,
            workcover_expense_id: expenseId,
            created_by: (await supabase.auth.getUser()).data.user?.id
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

// Data Deletion Functions
export async function deleteUserData(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('delete_user_data', {
        target_user_id: userId
    })
    if (error) throw error
    return data
}

export async function deleteAllSystemData() {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('delete_all_system_data')
    if (error) throw error
    return data
}
// Helper functions to fetch claims and expenses for note linking UI

export async function getWorkcoverClaimsForLinking() {
    try {
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
    } catch (error) {
        console.error('Failed to fetch workcover claims:', error)
        return []
    }
}

export async function getAgedCareExpensesForLinking() {
    try {
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
    } catch (error) {
        console.error('Failed to fetch aged care expenses:', error)
        return []
    }
}

export async function getWorkcoverExpensesForLinking() {
    try {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('workcover_expenses')
            .select('id, invoice_number, description, expense_date, amount_charged')
            .order('expense_date', { ascending: false })
        if (error) {
            console.error('Error fetching workcover expenses:', {
                error: error,
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code,
                fullError: JSON.stringify(error)
            })
            return []
        }
        return data || []
    } catch (error) {
        console.error('Failed to fetch workcover expenses:', error)
        return []
    }
}


export async function deleteFundingAccount(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('funding_accounts')
        .delete()
        .eq('id', id)
    if (error) throw error
}

// ============================================================
// AI ASSISTANT - ChatGPT API KEY MANAGEMENT  
// ============================================================

/**
 * Get user's ChatGPT API key from profile
 */
export async function getChatGPTApiKey(userId: string): Promise<string | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('chatgpt_api_key')
        .eq('id', userId)
        .single()
    
    if (error) throw error
    return data?.chatgpt_api_key || null
}

/**
 * Save user's ChatGPT API key to profile
 */
export async function saveChatGPTApiKey(userId: string, apiKey: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ chatgpt_api_key: apiKey })
        .eq('id', userId)
    
    if (error) throw error
}

/**
 * Remove user's ChatGPT API key from profile
 */
export async function removeChatGPTApiKey(userId: string): Promise<void> {
    const supabase = createClient()
    const{ error } = await supabase
        .from('profiles')
        .update({ chatgpt_api_key: null })
        .eq('id', userId)
    
    if (error) throw error
}

/**
 * Get user's AI configuration (endpoint URL and mode name)
 */
export async function getAIConfiguration(userId: string): Promise<{
    apiKey: string | null
    endpointUrl: string
    modelName: string
}> {
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

/**
 * Save user's complete AI configuration
 */
export async function saveAIConfiguration(
    userId: string,
    apiKey: string,
    endpointUrl: string,
    modelName: string
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('profiles')
        .update({
            chatgpt_api_key: apiKey,
            ai_endpoint_url: endpointUrl,
            ai_model_name: modelName,
        })
        .eq('id', userId)
    
    if (error) throw error
}
