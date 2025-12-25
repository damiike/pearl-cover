// Database Types for Pearl Cover
// These types mirror the Supabase database schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type FundingType = 'home_care_package' | 'support_at_home' | 'other'
export type SupplierType = 'medical' | 'allied_health' | 'equipment' | 'transport' | 'care_services' | 'other'
export type ExpenseDomain = 'aged_care' | 'workcover' | 'both'
export type PaymentType = 'aged_care' | 'workcover' | 'mixed'
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'cheque' | 'direct_debit'
export type AgedCareExpenseStatus = 'pending' | 'paid' | 'disputed' | 'written_off'
export type WorkcoverClaimStatus = 'open' | 'closed' | 'under_review'
export type WorkcoverExpenseStatus = 'pending_submission' | 'submitted' | 'approved' | 'partially_paid' | 'paid' | 'rejected'
export type EntityType = 'aged_care_expense' | 'workcover_expense' | 'payment' | 'funding_allocation' | 'workcover_claim' | 'note'
export type AuditAction = 'create' | 'update' | 'delete'
export type UserRole = 'admin' | 'owner' | 'support' | 'read_only' | 'supplier'

// Database Tables
export interface Profile {
    id: string
    display_name: string
    role: UserRole
    avatar_url: string | null
    created_at: string
    updated_at: string
}

// RBAC Tables
export interface Page {
    id: string
    slug: string
    name: string
    description: string | null
    is_system: boolean
    created_at: string
}

export interface RolePagePermission {
    id: string
    role: UserRole
    page_id: string
    can_view: boolean
    can_create: boolean
    can_update: boolean
    can_delete: boolean
    created_at: string
}

export interface UserPagePermission {
    id: string
    user_id: string
    page_id: string
    can_view: boolean | null
    can_create: boolean | null
    can_update: boolean | null
    can_delete: boolean | null
    created_at: string
}

export interface PagePermissions {
    canView: boolean
    canCreate: boolean
    canUpdate: boolean
    canDelete: boolean
}

export interface Supplier {
    id: string
    name: string
    supplier_type: SupplierType
    abn: string | null
    contact_name: string | null
    phone: string | null
    email: string | null
    address: string | null
    billing_info: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ExpenseCategory {
    id: string
    name: string
    expense_domain: ExpenseDomain
    icon: string | null
    color: string
    is_active: boolean
    created_at: string
}

export interface NoteCategory {
    id: string
    name: string
    color: string
    icon: string | null
    sort_order: number
    created_at: string
}

export interface FundingAccount {
    id: string
    account_name: string
    funding_type: FundingType
    funding_level: string | null
    start_date: string | null
    provider_name: string | null
    provider_contact: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface FundingAllocation {
    id: string
    funding_account_id: string
    amount: number
    allocation_date: string
    period_start: string | null
    period_end: string | null
    reference: string | null
    notes: string | null
    created_at: string
    created_by: string | null
}

export interface PaymentTransaction {
    id: string
    payment_type: PaymentType
    payment_method: PaymentMethod | null
    total_amount: number
    payment_date: string
    reference: string | null
    payer: string | null
    notes: string | null
    is_reconciled: boolean
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface AgedCareExpense {
    id: string
    funding_account_id: string
    supplier_id: string | null
    category_id: string | null
    payment_transaction_id: string | null
    description: string
    amount: number
    expense_date: string
    invoice_number: string | null
    status: AgedCareExpenseStatus
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface WorkcoverClaim {
    id: string
    claim_number: string
    injury_date: string
    injury_description: string | null
    status: WorkcoverClaimStatus
    insurer_name: string | null
    insurer_contact: string | null
    created_at: string
    updated_at: string
}

export interface WorkcoverExpense {
    id: string
    claim_id: string
    supplier_id: string | null
    category_id: string | null
    payment_transaction_id: string | null
    description: string
    amount_charged: number
    amount_claimed: number | null
    amount_reimbursed: number
    gap_amount: number // Generated column
    expense_date: string
    invoice_number: string | null
    status: WorkcoverExpenseStatus
    submission_date: string | null
    reimbursement_date: string | null
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface Attachment {
    id: string
    entity_type: EntityType
    entity_id: string
    file_name: string
    file_path: string
    file_type: string | null
    file_size: number | null
    ocr_text: string | null
    upload_date: string
    uploaded_by: string | null
}

export interface Note {
    id: string
    title: string
    content: string | null
    category_id: string | null
    parent_id: string | null
    entry_date: string
    is_pinned: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface NoteTag {
    id: string
    note_id: string
    tag_name: string
}

export interface ExpenseTag {
    id: string
    tag_name: string
    aged_care_expense_id: string | null
    workcover_expense_id: string | null
    created_at: string
}

export interface AuditLog {
    id: string
    user_id: string | null
    entity_type: string
    entity_id: string
    action: AuditAction
    old_values: Json | null
    new_values: Json | null
    ip_address: string | null
    user_agent: string | null
    timestamp: string
}

// View Types
export interface FundingAccountBalance {
    id: string
    account_name: string
    funding_type: FundingType
    funding_level: string | null
    total_allocated: number
    total_expenses: number
    current_balance: number
    pending_amount: number
    paid_amount: number
}

export interface WorkcoverClaimSummary {
    id: string
    claim_number: string
    injury_date: string
    status: WorkcoverClaimStatus
    expense_count: number
    total_charged: number
    total_reimbursed: number
    total_gap: number
    pending_count: number
    submitted_count: number
    paid_count: number
}

export interface TransactionLedgerEntry {
    transaction_type: 'credit' | 'debit'
    transaction_date: string
    amount: number
    description: string
    reference: string | null
    account: string
    supplier_name: string | null
    payment_status: string | null
    source_id: string
    source_type: string
}

// Extended types with relations
export interface AgedCareExpenseWithRelations extends AgedCareExpense {
    supplier?: Supplier | null
    category?: ExpenseCategory | null
    payment_transaction?: PaymentTransaction | null
    attachments?: Attachment[]
    tags?: ExpenseTag[]
}

export interface WorkcoverExpenseWithRelations extends WorkcoverExpense {
    supplier?: Supplier | null
    category?: ExpenseCategory | null
    payment_transaction?: PaymentTransaction | null
    claim?: WorkcoverClaim | null
    attachments?: Attachment[]
    tags?: ExpenseTag[]
}

export interface NoteWithRelations extends Note {
    category?: NoteCategory | null
    tags?: NoteTag[]
    created_by_profile?: Profile | null
    children?: NoteWithRelations[]
    attachments?: Attachment[]
    parent?: Note | null
    linked_workcover_claims?: { id: string, claim_number: string }[]
    linked_aged_care_expenses?: { id: string, invoice_number: string | null, description: string }[]
    linked_workcover_expenses?: { id: string, invoice_number: string | null, description: string }[]
}

// Calendar Types

export interface CalendarCategory {
    id: string
    name: string
    color: string
    sort_order: number
    created_at: string
    created_by: string | null
}

export interface CalendarEvent {
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    all_day: boolean
    location: string | null
    category_id: string | null
    source: 'local' | 'google' | 'outlook'
    external_id: string | null
    reminders: { method: 'email' | 'popup', minutes: number }[]
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface EventTag {
    id: string
    event_id: string
    tag_name: string
    created_at: string
}

export interface CalendarEventWithRelations extends CalendarEvent {
    category?: CalendarCategory | null
    tags?: EventTag[]
}

// Insert types (omit auto-generated fields)
export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
export type FundingAccountInsert = Omit<FundingAccount, 'id' | 'created_at' | 'updated_at'>
export type FundingAllocationInsert = Omit<FundingAllocation, 'id' | 'created_at'>
export type AgedCareExpenseInsert = Omit<AgedCareExpense, 'id' | 'created_at' | 'updated_at'>
export type WorkcoverClaimInsert = Omit<WorkcoverClaim, 'id' | 'created_at' | 'updated_at'>
export type WorkcoverExpenseInsert = Omit<WorkcoverExpense, 'id' | 'created_at' | 'updated_at' | 'gap_amount'>
export type PaymentTransactionInsert = Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>
export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'>
export type AttachmentInsert = Omit<Attachment, 'id' | 'upload_date'>
export type CalendarCategoryInsert = Omit<CalendarCategory, 'id' | 'created_at'>
export type CalendarEventInsert = Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> & { reminders?: { method: 'email' | 'popup', minutes: number }[] }

// Update types (partial of insert types)
export type SupplierUpdate = Partial<SupplierInsert>
export type FundingAccountUpdate = Partial<FundingAccountInsert>
export type AgedCareExpenseUpdate = Partial<AgedCareExpenseInsert>
export type WorkcoverClaimUpdate = Partial<WorkcoverClaimInsert>
export type WorkcoverExpenseUpdate = Partial<WorkcoverExpenseInsert>
export type PaymentTransactionUpdate = Partial<PaymentTransactionInsert>
export type NoteUpdate = Partial<NoteInsert>
export type CalendarCategoryUpdate = Partial<CalendarCategoryInsert>
export type CalendarEventUpdate = Partial<CalendarEventInsert>
