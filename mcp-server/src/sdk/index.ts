/**
 * Pearl Cover SDK - Data access layer for AI agent
 * 
 * This SDK wraps Supabase queries for use in the MCP code execution context
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
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
export class PearlCoverSDK {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // ============================================================
    // FUNDING ACCOUNTS
    // ============================================================

    fundingAccounts = {
        list: async (activeOnly = true): Promise<FundingAccount[]> => {
            let query = this.supabase.from('funding_accounts').select('*').order('account_name');
            if (activeOnly) query = query.eq('is_active', true);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getBalance: async (id: string): Promise<FundingAccountBalance | null> => {
            const { data, error } = await this.supabase
                .from('funding_account_balances')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },

        getAllBalances: async (): Promise<FundingAccountBalance[]> => {
            const { data, error } = await this.supabase
                .from('funding_account_balances')
                .select('*');
            if (error) throw error;
            return data || [];
        }
    };

    // ============================================================
    // AGED CARE EXPENSES
    // ============================================================

    agedCareExpenses = {
        list: async (filters?: {
            fundingAccountId?: string;
            status?: string;
            fromDate?: string;
            toDate?: string;
            supplierId?: string;
            categoryId?: string;
        }): Promise<AgedCareExpense[]> => {
            let query = this.supabase
                .from('aged_care_expenses')
                .select('*, supplier:suppliers(name), category:expense_categories(name)')
                .order('expense_date', { ascending: false });

            if (filters?.fundingAccountId) query = query.eq('funding_account_id', filters.fundingAccountId);
            if (filters?.status) query = query.eq('status', filters.status);
            if (filters?.fromDate) query = query.gte('expense_date', filters.fromDate);
            if (filters?.toDate) query = query.lte('expense_date', filters.toDate);
            if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
            if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getById: async (id: string): Promise<AgedCareExpense | null> => {
            const { data, error } = await this.supabase
                .from('aged_care_expenses')
                .select('*, supplier:suppliers(*), category:expense_categories(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },

        sumByCategory: async (dateRange?: DateRange): Promise<CategorySpending[]> => {
            let query = this.supabase
                .from('aged_care_expenses')
                .select('amount, category:expense_categories(name)');

            if (dateRange?.from) query = query.gte('expense_date', dateRange.from);
            if (dateRange?.to) query = query.lte('expense_date', dateRange.to);

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate by category
            const categoryMap = new Map<string, { total: number; count: number }>();
            (data || []).forEach((e: any) => {
                const catName = e.category?.name || 'Uncategorized';
                const existing = categoryMap.get(catName) || { total: 0, count: 0 };
                categoryMap.set(catName, {
                    total: existing.total + (e.amount || 0),
                    count: existing.count + 1
                });
            });

            return Array.from(categoryMap.entries()).map(([name, { total, count }]) => ({
                category_name: name,
                total_amount: total,
                count
            }));
        },

        getTotal: async (filters?: { fromDate?: string; toDate?: string; status?: string }): Promise<number> => {
            let query = this.supabase.from('aged_care_expenses').select('amount');
            if (filters?.fromDate) query = query.gte('expense_date', filters.fromDate);
            if (filters?.toDate) query = query.lte('expense_date', filters.toDate);
            if (filters?.status) query = query.eq('status', filters.status);

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        }
    };

    // ============================================================
    // WORKCOVER CLAIMS
    // ============================================================

    workcoverClaims = {
        list: async (status?: string): Promise<WorkcoverClaim[]> => {
            let query = this.supabase.from('workcover_claims').select('*').order('injury_date', { ascending: false });
            if (status) query = query.eq('status', status);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getSummaries: async (): Promise<WorkcoverClaimSummary[]> => {
            const { data, error } = await this.supabase.from('workcover_claim_summaries').select('*');
            if (error) throw error;
            return data || [];
        },

        getById: async (id: string): Promise<WorkcoverClaim | null> => {
            const { data, error } = await this.supabase
                .from('workcover_claims')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },

        findByClaimNumber: async (claimNumber: string): Promise<WorkcoverClaim | null> => {
            const { data, error } = await this.supabase
                .from('workcover_claims')
                .select('*')
                .ilike('claim_number', `%${claimNumber}%`)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
    };

    // ============================================================
    // WORKCOVER EXPENSES
    // ============================================================

    workcoverExpenses = {
        list: async (claimId?: string): Promise<WorkcoverExpense[]> => {
            let query = this.supabase
                .from('workcover_expenses')
                .select('*, supplier:suppliers(name), category:expense_categories(name)')
                .order('expense_date', { ascending: false });
            if (claimId) query = query.eq('claim_id', claimId);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getTotalGap: async (): Promise<number> => {
            const { data, error } = await this.supabase.from('workcover_expenses').select('gap_amount');
            if (error) throw error;
            return (data || []).reduce((sum, e) => sum + (e.gap_amount || 0), 0);
        },

        getByStatus: async (status: string): Promise<WorkcoverExpense[]> => {
            const { data, error } = await this.supabase
                .from('workcover_expenses')
                .select('*, claim:workcover_claims(claim_number)')
                .eq('status', status)
                .order('expense_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    };

    // ============================================================
    // NOTES
    // ============================================================

    notes = {
        search: async (query: string): Promise<Note[]> => {
            const { data, error } = await this.supabase
                .from('notes')
                .select('*, note_tags(tag_name)')
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .eq('is_archived', false)
                .order('updated_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return (data || []).map(n => ({
                ...n,
                tags: n.note_tags?.map((t: any) => t.tag_name) || []
            }));
        },

        list: async (filters?: {
            categoryId?: string;
            isArchived?: boolean;
            isPinned?: boolean;
        }): Promise<Note[]> => {
            let query = this.supabase
                .from('notes')
                .select('*, note_tags(tag_name)')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
            if (filters?.isArchived !== undefined) query = query.eq('is_archived', filters.isArchived);
            if (filters?.isPinned !== undefined) query = query.eq('is_pinned', filters.isPinned);

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(n => ({
                ...n,
                tags: n.note_tags?.map((t: any) => t.tag_name) || []
            }));
        },

        getById: async (id: string): Promise<Note | null> => {
            const { data, error } = await this.supabase
                .from('notes')
                .select('*, note_tags(tag_name), category:note_categories(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data ? { ...data, tags: data.note_tags?.map((t: any) => t.tag_name) || [] } : null;
        }
    };

    // ============================================================
    // CALENDAR
    // ============================================================

    calendar = {
        getEvents: async (dateRange: DateRange): Promise<CalendarEvent[]> => {
            let query = this.supabase
                .from('calendar_events')
                .select('*')
                .order('start_time', { ascending: true });

            if (dateRange.from) query = query.gte('end_time', dateRange.from);
            if (dateRange.to) query = query.lte('start_time', dateRange.to);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        upcoming: async (days = 7): Promise<CalendarEvent[]> => {
            const now = new Date();
            const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            const { data, error } = await this.supabase
                .from('calendar_events')
                .select('*')
                .gte('start_time', now.toISOString())
                .lte('start_time', future.toISOString())
                .order('start_time', { ascending: true });
            if (error) throw error;
            return data || [];
        }
    };

    // ============================================================
    // PAYMENTS
    // ============================================================

    payments = {
        list: async (filters?: {
            paymentType?: string;
            fromDate?: string;
            toDate?: string;
        }): Promise<PaymentTransaction[]> => {
            let query = this.supabase
                .from('payment_transactions')
                .select('*')
                .order('payment_date', { ascending: false });

            if (filters?.paymentType) query = query.eq('payment_type', filters.paymentType);
            if (filters?.fromDate) query = query.gte('payment_date', filters.fromDate);
            if (filters?.toDate) query = query.lte('payment_date', filters.toDate);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getUnreconciled: async (): Promise<PaymentTransaction[]> => {
            const { data, error } = await this.supabase
                .from('payment_transactions')
                .select('*')
                .eq('is_reconciled', false)
                .order('payment_date', { ascending: false });
            if (error) throw error;
            return data || [];
        },

        getTotal: async (dateRange?: DateRange): Promise<number> => {
            let query = this.supabase.from('payment_transactions').select('total_amount');
            if (dateRange?.from) query = query.gte('payment_date', dateRange.from);
            if (dateRange?.to) query = query.lte('payment_date', dateRange.to);
            const { data, error } = await query;
            if (error) throw error;
            return (data || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
        }
    };

    // ============================================================
    // SUPPLIERS & CATEGORIES
    // ============================================================

    suppliers = {
        list: async (activeOnly = true): Promise<Supplier[]> => {
            let query = this.supabase.from('suppliers').select('*').order('name');
            if (activeOnly) query = query.eq('is_active', true);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        getById: async (id: string): Promise<Supplier | null> => {
            const { data, error } = await this.supabase.from('suppliers').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
    };

    categories = {
        list: async (domain?: 'aged_care' | 'workcover' | 'both'): Promise<ExpenseCategory[]> => {
            let query = this.supabase.from('expense_categories').select('*').eq('is_active', true).order('name');
            if (domain) query = query.or(`expense_domain.eq.${domain},expense_domain.eq.both`);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
    };

    // ============================================================
    // SEARCH
    // ============================================================

    search = {
        all: async (query: string): Promise<SearchResults> => {
            const [notes, claims, agedCare, workcover, payments, attachments] = await Promise.all([
                this.supabase
                    .from('notes')
                    .select('*')
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                    .eq('is_archived', false)
                    .limit(10),
                this.supabase
                    .from('workcover_claims')
                    .select('*')
                    .or(`claim_number.ilike.%${query}%,injury_description.ilike.%${query}%`)
                    .limit(10),
                this.supabase
                    .from('aged_care_expenses')
                    .select('*')
                    .or(`description.ilike.%${query}%,invoice_number.ilike.%${query}%`)
                    .limit(10),
                this.supabase
                    .from('workcover_expenses')
                    .select('*')
                    .or(`description.ilike.%${query}%,invoice_number.ilike.%${query}%`)
                    .limit(10),
                this.supabase
                    .from('payment_transactions')
                    .select('*')
                    .or(`reference.ilike.%${query}%,payer.ilike.%${query}%,notes.ilike.%${query}%`)
                    .limit(10),
                this.supabase
                    .from('attachments')
                    .select('*')
                    .or(`file_name.ilike.%${query}%,ocr_text.ilike.%${query}%`)
                    .limit(10)
            ]);

            return {
                notes: notes.data || [],
                claims: claims.data || [],
                agedCareExpenses: agedCare.data || [],
                workcoverExpenses: workcover.data || [],
                payments: payments.data || [],
                attachments: attachments.data || []
            };
        },

        attachments: async (query: string): Promise<Attachment[]> => {
            const { data, error } = await this.supabase
                .from('attachments')
                .select('*')
                .or(`file_name.ilike.%${query}%,ocr_text.ilike.%${query}%`)
                .order('upload_date', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data || [];
        }
    };

    // ============================================================
    // ANALYTICS
    // ============================================================

    analytics = {
        spendingByCategory: async (dateRange: DateRange, domain: 'aged_care' | 'workcover' | 'both' = 'both'): Promise<CategorySpending[]> => {
            const results: CategorySpending[] = [];

            if (domain === 'aged_care' || domain === 'both') {
                const agedCare = await this.agedCareExpenses.sumByCategory(dateRange);
                results.push(...agedCare);
            }

            if (domain === 'workcover' || domain === 'both') {
                let query = this.supabase
                    .from('workcover_expenses')
                    .select('amount_charged, category:expense_categories(name)');

                if (dateRange?.from) query = query.gte('expense_date', dateRange.from);
                if (dateRange?.to) query = query.lte('expense_date', dateRange.to);

                const { data } = await query;
                const categoryMap = new Map<string, { total: number; count: number }>();
                (data || []).forEach((e: any) => {
                    const catName = e.category?.name || 'Uncategorized';
                    const existing = categoryMap.get(catName) || { total: 0, count: 0 };
                    categoryMap.set(catName, {
                        total: existing.total + (e.amount_charged || 0),
                        count: existing.count + 1
                    });
                });

                categoryMap.forEach((val, name) => {
                    const existing = results.find(r => r.category_name === name);
                    if (existing) {
                        existing.total_amount += val.total;
                        existing.count += val.count;
                    } else {
                        results.push({ category_name: name, total_amount: val.total, count: val.count });
                    }
                });
            }

            return results.sort((a, b) => b.total_amount - a.total_amount);
        },

        getQuickStats: async (): Promise<{ notes: number; claims: number; expenses: number }> => {
            const [notesCount, claimsCount, expensesCount] = await Promise.all([
                this.supabase.from('notes').select('id', { count: 'exact', head: true }),
                this.supabase.from('workcover_claims').select('id', { count: 'exact', head: true }),
                this.supabase.from('aged_care_expenses').select('id', { count: 'exact', head: true })
            ]);

            return {
                notes: notesCount.count || 0,
                claims: claimsCount.count || 0,
                expenses: expensesCount.count || 0
            };
        }
    };
}

/**
 * Create SDK instance from environment variables
 */
export function createSDK(): PearlCoverSDK {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    }

    return new PearlCoverSDK(supabaseUrl, supabaseKey);
}
