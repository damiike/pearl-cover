/**
 * Pearl Cover SDK - Data access layer for AI agent
 *
 * This SDK wraps Supabase queries for use in the MCP code execution context
 */
export interface DateRange {
    from?: string;
    to?: string;
}
export interface FundingAccount {
    id: string;
    account_name: string;
    funding_type: 'home_care_package' | 'support_at_home' | 'other';
    funding_level: string | null;
    is_active: boolean;
}
export interface FundingAccountBalance {
    id: string;
    account_name: string;
    funding_type: string;
    funding_level: string | null;
    total_allocated: number;
    total_expenses: number;
    current_balance: number;
    pending_amount: number;
    paid_amount: number;
}
export interface AgedCareExpense {
    id: string;
    funding_account_id: string;
    supplier_id: string | null;
    category_id: string | null;
    description: string;
    amount: number;
    expense_date: string;
    invoice_number: string | null;
    status: 'pending' | 'paid' | 'disputed' | 'written_off';
}
export interface WorkcoverClaim {
    id: string;
    claim_number: string;
    injury_date: string;
    injury_description: string | null;
    status: 'open' | 'closed' | 'under_review';
    insurer_name: string | null;
}
export interface WorkcoverExpense {
    id: string;
    claim_id: string;
    description: string;
    amount_charged: number;
    amount_claimed: number | null;
    amount_reimbursed: number;
    gap_amount: number;
    expense_date: string;
    status: string;
}
export interface WorkcoverClaimSummary {
    id: string;
    claim_number: string;
    injury_date: string;
    status: string;
    expense_count: number;
    total_charged: number;
    total_reimbursed: number;
    total_gap: number;
}
export interface Note {
    id: string;
    title: string;
    content: string | null;
    category_id: string | null;
    is_pinned: boolean;
    is_archived: boolean;
    entry_date: string;
    tags?: string[];
}
export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string | null;
}
export interface PaymentTransaction {
    id: string;
    payment_type: string;
    payment_method: string | null;
    total_amount: number;
    payment_date: string;
    reference: string | null;
    is_reconciled: boolean;
}
export interface Supplier {
    id: string;
    name: string;
    supplier_type: string;
    phone: string | null;
    email: string | null;
}
export interface ExpenseCategory {
    id: string;
    name: string;
    expense_domain: string;
    color: string;
}
export interface Attachment {
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    ocr_text: string | null;
}
export interface CategorySpending {
    category_name: string;
    total_amount: number;
    count: number;
}
export interface SearchResults {
    notes: Note[];
    claims: WorkcoverClaim[];
    agedCareExpenses: AgedCareExpense[];
    workcoverExpenses: WorkcoverExpense[];
    payments: PaymentTransaction[];
    attachments: Attachment[];
}
/**
 * Pearl Cover SDK Class
 */
export declare class PearlCoverSDK {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    fundingAccounts: {
        list: (activeOnly?: boolean) => Promise<FundingAccount[]>;
        getBalance: (id: string) => Promise<FundingAccountBalance | null>;
        getAllBalances: () => Promise<FundingAccountBalance[]>;
    };
    agedCareExpenses: {
        list: (filters?: {
            fundingAccountId?: string;
            status?: string;
            fromDate?: string;
            toDate?: string;
            supplierId?: string;
            categoryId?: string;
        }) => Promise<AgedCareExpense[]>;
        getById: (id: string) => Promise<AgedCareExpense | null>;
        sumByCategory: (dateRange?: DateRange) => Promise<CategorySpending[]>;
        getTotal: (filters?: {
            fromDate?: string;
            toDate?: string;
            status?: string;
        }) => Promise<number>;
    };
    workcoverClaims: {
        list: (status?: string) => Promise<WorkcoverClaim[]>;
        getSummaries: () => Promise<WorkcoverClaimSummary[]>;
        getById: (id: string) => Promise<WorkcoverClaim | null>;
        findByClaimNumber: (claimNumber: string) => Promise<WorkcoverClaim | null>;
    };
    workcoverExpenses: {
        list: (claimId?: string) => Promise<WorkcoverExpense[]>;
        getTotalGap: () => Promise<number>;
        getByStatus: (status: string) => Promise<WorkcoverExpense[]>;
    };
    notes: {
        search: (query: string) => Promise<Note[]>;
        list: (filters?: {
            categoryId?: string;
            isArchived?: boolean;
            isPinned?: boolean;
        }) => Promise<Note[]>;
        getById: (id: string) => Promise<Note | null>;
    };
    calendar: {
        getEvents: (dateRange: DateRange) => Promise<CalendarEvent[]>;
        upcoming: (days?: number) => Promise<CalendarEvent[]>;
    };
    payments: {
        list: (filters?: {
            paymentType?: string;
            fromDate?: string;
            toDate?: string;
        }) => Promise<PaymentTransaction[]>;
        getUnreconciled: () => Promise<PaymentTransaction[]>;
        getTotal: (dateRange?: DateRange) => Promise<number>;
    };
    suppliers: {
        list: (activeOnly?: boolean) => Promise<Supplier[]>;
        getById: (id: string) => Promise<Supplier | null>;
    };
    categories: {
        list: (domain?: "aged_care" | "workcover" | "both") => Promise<ExpenseCategory[]>;
    };
    search: {
        all: (query: string) => Promise<SearchResults>;
        attachments: (query: string) => Promise<Attachment[]>;
    };
    analytics: {
        spendingByCategory: (dateRange: DateRange, domain?: "aged_care" | "workcover" | "both") => Promise<CategorySpending[]>;
        getQuickStats: () => Promise<{
            notes: number;
            claims: number;
            expenses: number;
        }>;
    };
}
/**
 * Create SDK instance from environment variables
 */
export declare function createSDK(): PearlCoverSDK;
