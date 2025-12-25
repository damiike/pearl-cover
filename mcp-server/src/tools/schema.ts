/**
 * Schema Documentation Generator
 * 
 * Provides SDK method documentation for the AI agent
 */

export interface MethodDoc {
    name: string;
    description: string;
    params?: string;
    returns: string;
    example?: string;
}

export interface DomainSchema {
    domain: string;
    description: string;
    methods: MethodDoc[];
}

const schemas: Record<string, DomainSchema> = {
    aged_care: {
        domain: 'Aged Care',
        description: 'Funding accounts, allocations, and expenses for aged care programs (HCP, SAH)',
        methods: [
            {
                name: 'sdk.fundingAccounts.list(activeOnly?)',
                description: 'Get all funding accounts',
                params: 'activeOnly: boolean (default true)',
                returns: 'FundingAccount[]',
                example: 'sdk.fundingAccounts.list()'
            },
            {
                name: 'sdk.fundingAccounts.getAllBalances()',
                description: 'Get balances for all accounts with allocated/spent/pending amounts',
                returns: 'FundingAccountBalance[]',
                example: 'sdk.fundingAccounts.getAllBalances()'
            },
            {
                name: 'sdk.fundingAccounts.getBalance(id)',
                description: 'Get balance for a specific account',
                params: 'id: string (UUID)',
                returns: 'FundingAccountBalance',
                example: 'sdk.fundingAccounts.getBalance("abc-123")'
            },
            {
                name: 'sdk.agedCareExpenses.list(filters?)',
                description: 'Get aged care expenses with optional filters',
                params: '{ fundingAccountId?, status?, fromDate?, toDate?, supplierId?, categoryId? }',
                returns: 'AgedCareExpense[]',
                example: 'sdk.agedCareExpenses.list({ status: "pending" })'
            },
            {
                name: 'sdk.agedCareExpenses.getTotal(filters?)',
                description: 'Get total amount of expenses',
                params: '{ fromDate?, toDate?, status? }',
                returns: 'number',
                example: 'sdk.agedCareExpenses.getTotal({ fromDate: "2024-01-01" })'
            },
            {
                name: 'sdk.agedCareExpenses.sumByCategory(dateRange?)',
                description: 'Get spending breakdown by category',
                params: '{ from?, to? }',
                returns: 'CategorySpending[]',
                example: 'sdk.agedCareExpenses.sumByCategory({ from: "2024-01-01" })'
            }
        ]
    },
    workcover: {
        domain: 'WorkCover',
        description: 'WorkCover claims and expenses with reimbursement tracking',
        methods: [
            {
                name: 'sdk.workcoverClaims.list(status?)',
                description: 'Get all WorkCover claims',
                params: 'status?: "open" | "closed" | "under_review"',
                returns: 'WorkcoverClaim[]',
                example: 'sdk.workcoverClaims.list("open")'
            },
            {
                name: 'sdk.workcoverClaims.getSummaries()',
                description: 'Get claim summaries with expense totals and gaps',
                returns: 'WorkcoverClaimSummary[]',
                example: 'sdk.workcoverClaims.getSummaries()'
            },
            {
                name: 'sdk.workcoverClaims.findByClaimNumber(num)',
                description: 'Find claim by claim number (partial match)',
                params: 'num: string',
                returns: 'WorkcoverClaim | null',
                example: 'sdk.workcoverClaims.findByClaimNumber("WC-2024")'
            },
            {
                name: 'sdk.workcoverExpenses.list(claimId?)',
                description: 'Get WorkCover expenses, optionally filtered by claim',
                params: 'claimId?: string (UUID)',
                returns: 'WorkcoverExpense[]',
                example: 'sdk.workcoverExpenses.list()'
            },
            {
                name: 'sdk.workcoverExpenses.getTotalGap()',
                description: 'Get total unreimbursed gap amount across all claims',
                returns: 'number',
                example: 'sdk.workcoverExpenses.getTotalGap()'
            },
            {
                name: 'sdk.workcoverExpenses.getByStatus(status)',
                description: 'Get expenses by status',
                params: 'status: "pending_submission" | "submitted" | "approved" | "paid" | "rejected"',
                returns: 'WorkcoverExpense[]',
                example: 'sdk.workcoverExpenses.getByStatus("pending_submission")'
            }
        ]
    },
    notes: {
        domain: 'Notes',
        description: 'Gmail-style notes with tagging and entity linking',
        methods: [
            {
                name: 'sdk.notes.search(query)',
                description: 'Search notes by title and content',
                params: 'query: string',
                returns: 'Note[]',
                example: 'sdk.notes.search("physiotherapy")'
            },
            {
                name: 'sdk.notes.list(filters?)',
                description: 'Get notes with optional filters',
                params: '{ categoryId?, isArchived?, isPinned? }',
                returns: 'Note[]',
                example: 'sdk.notes.list({ isArchived: false })'
            },
            {
                name: 'sdk.notes.getById(id)',
                description: 'Get a specific note with tags and category',
                params: 'id: string (UUID)',
                returns: 'Note',
                example: 'sdk.notes.getById("abc-123")'
            }
        ]
    },
    calendar: {
        domain: 'Calendar',
        description: 'Appointments and events with Google/Outlook sync',
        methods: [
            {
                name: 'sdk.calendar.getEvents(dateRange)',
                description: 'Get events within date range',
                params: '{ from?: string, to?: string }',
                returns: 'CalendarEvent[]',
                example: 'sdk.calendar.getEvents({ from: "2024-12-01", to: "2024-12-31" })'
            },
            {
                name: 'sdk.calendar.upcoming(days?)',
                description: 'Get upcoming events for next N days',
                params: 'days?: number (default 7)',
                returns: 'CalendarEvent[]',
                example: 'sdk.calendar.upcoming(14)'
            }
        ]
    },
    payments: {
        domain: 'Payments',
        description: 'Payment transactions and reconciliation',
        methods: [
            {
                name: 'sdk.payments.list(filters?)',
                description: 'Get payment transactions',
                params: '{ paymentType?, fromDate?, toDate? }',
                returns: 'PaymentTransaction[]',
                example: 'sdk.payments.list({ paymentType: "aged_care" })'
            },
            {
                name: 'sdk.payments.getUnreconciled()',
                description: 'Get unreconciled payments',
                returns: 'PaymentTransaction[]',
                example: 'sdk.payments.getUnreconciled()'
            },
            {
                name: 'sdk.payments.getTotal(dateRange?)',
                description: 'Get total payment amount',
                params: '{ from?, to? }',
                returns: 'number',
                example: 'sdk.payments.getTotal({ from: "2024-01-01" })'
            }
        ]
    },
    suppliers: {
        domain: 'Suppliers & Categories',
        description: 'Service providers and expense categorization',
        methods: [
            {
                name: 'sdk.suppliers.list(activeOnly?)',
                description: 'Get all suppliers',
                params: 'activeOnly?: boolean (default true)',
                returns: 'Supplier[]',
                example: 'sdk.suppliers.list()'
            },
            {
                name: 'sdk.suppliers.getById(id)',
                description: 'Get supplier details',
                params: 'id: string (UUID)',
                returns: 'Supplier',
                example: 'sdk.suppliers.getById("abc-123")'
            },
            {
                name: 'sdk.categories.list(domain?)',
                description: 'Get expense categories',
                params: 'domain?: "aged_care" | "workcover" | "both"',
                returns: 'ExpenseCategory[]',
                example: 'sdk.categories.list("aged_care")'
            }
        ]
    },
    analytics: {
        domain: 'Analytics',
        description: 'Aggregations and quick statistics',
        methods: [
            {
                name: 'sdk.analytics.spendingByCategory(dateRange, domain?)',
                description: 'Get spending breakdown by category',
                params: '{ from?, to? }, domain?: "aged_care" | "workcover" | "both"',
                returns: 'CategorySpending[]',
                example: 'sdk.analytics.spendingByCategory({ from: "2024-01-01" }, "aged_care")'
            },
            {
                name: 'sdk.analytics.getQuickStats()',
                description: 'Get quick count statistics',
                returns: '{ notes: number, claims: number, expenses: number }',
                example: 'sdk.analytics.getQuickStats()'
            },
            {
                name: 'sdk.search.all(query)',
                description: 'Search across all entity types',
                params: 'query: string',
                returns: 'SearchResults (notes, claims, expenses, payments, attachments)',
                example: 'sdk.search.all("Medicare")'
            },
            {
                name: 'sdk.search.attachments(query)',
                description: 'Search attachment filenames and OCR text',
                params: 'query: string',
                returns: 'Attachment[]',
                example: 'sdk.search.attachments("receipt")'
            }
        ]
    }
};

export function getSchemaDocumentation(domain: string): DomainSchema | DomainSchema[] {
    if (domain === 'all') {
        return Object.values(schemas);
    }
    return schemas[domain] || { domain, description: 'Unknown domain', methods: [] };
}
