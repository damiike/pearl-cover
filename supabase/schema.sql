-- ============================================================
-- Pearl Cover Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    avatar_url TEXT,
    chatgpt_api_key TEXT,
    ai_endpoint_url TEXT DEFAULT 'https://api.openai.com/v1',
    ai_model_name TEXT DEFAULT 'gpt-4-turbo-preview',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    supplier_type TEXT NOT NULL CHECK (supplier_type IN ('medical', 'allied_health', 'equipment', 'transport', 'care_services', 'other')),
    abn TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    billing_info TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    expense_domain TEXT NOT NULL CHECK (expense_domain IN ('aged_care', 'workcover', 'both')),
    icon TEXT,
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note Categories
CREATE TABLE IF NOT EXISTS public.note_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding Accounts (Aged Care)
CREATE TABLE IF NOT EXISTS public.funding_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name TEXT NOT NULL,
    funding_type TEXT NOT NULL CHECK (funding_type IN ('home_care_package', 'support_at_home', 'other')),
    funding_level TEXT,
    start_date DATE,
    provider_name TEXT,
    provider_contact TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding Allocations (Credits)
CREATE TABLE IF NOT EXISTS public.funding_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funding_account_id UUID NOT NULL REFERENCES public.funding_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    allocation_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('aged_care', 'workcover', 'mixed')),
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash', 'cheque', 'direct_debit')),
    total_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    reference TEXT,
    payer TEXT,
    notes TEXT,
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Aged Care Expenses
CREATE TABLE IF NOT EXISTS public.aged_care_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funding_account_id UUID NOT NULL REFERENCES public.funding_accounts(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    category_id UUID REFERENCES public.expense_categories(id),
    payment_transaction_id UUID REFERENCES public.payment_transactions(id),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    invoice_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed', 'written_off')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- WorkCover Claims
CREATE TABLE IF NOT EXISTS public.workcover_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number TEXT NOT NULL UNIQUE,
    injury_date DATE NOT NULL,
    injury_description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'under_review')),
    insurer_name TEXT,
    insurer_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WorkCover Expenses
CREATE TABLE IF NOT EXISTS public.workcover_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES public.workcover_claims(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    category_id UUID REFERENCES public.expense_categories(id),
    payment_transaction_id UUID REFERENCES public.payment_transactions(id),
    description TEXT NOT NULL,
    amount_charged DECIMAL(12,2) NOT NULL,
    amount_claimed DECIMAL(12,2),
    amount_reimbursed DECIMAL(12,2) DEFAULT 0,
    gap_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount_charged - COALESCE(amount_reimbursed, 0)) STORED,
    expense_date DATE NOT NULL,
    invoice_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending_submission' CHECK (status IN ('pending_submission', 'submitted', 'approved', 'partially_paid', 'paid', 'rejected')),
    submission_date DATE,
    reimbursement_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('aged_care_expense', 'workcover_expense', 'payment', 'funding_allocation', 'workcover_claim')),
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    ocr_text TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.profiles(id)
);

-- Notes (Gmail-style)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    category_id UUID REFERENCES public.note_categories(id),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Note Tags
CREATE TABLE IF NOT EXISTS public.note_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    UNIQUE(note_id, tag_name)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_funding_account ON public.aged_care_expenses(funding_account_id);
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_status ON public.aged_care_expenses(status);
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_date ON public.aged_care_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_claim ON public.workcover_expenses(claim_id);
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_status ON public.workcover_expenses(status);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_archived ON public.notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_notes_fts ON public.notes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_attachments_ocr_fts ON public.attachments USING gin(to_tsvector('english', coalesce(ocr_text, '')));

-- ============================================================
-- VIEWS
-- ============================================================

-- Funding Account Balance View
CREATE OR REPLACE VIEW public.funding_account_balances AS
SELECT 
    fa.id,
    fa.account_name,
    fa.funding_type,
    fa.funding_level,
    COALESCE(SUM(alloc.amount), 0) AS total_allocated,
    COALESCE(SUM(exp.amount) FILTER (WHERE exp.status != 'written_off'), 0) AS total_expenses,
    COALESCE(SUM(alloc.amount), 0) - COALESCE(SUM(exp.amount) FILTER (WHERE exp.status != 'written_off'), 0) AS current_balance,
    COALESCE(SUM(exp.amount) FILTER (WHERE exp.status = 'pending'), 0) AS pending_amount,
    COALESCE(SUM(exp.amount) FILTER (WHERE exp.status = 'paid'), 0) AS paid_amount
FROM public.funding_accounts fa
LEFT JOIN public.funding_allocations alloc ON fa.id = alloc.funding_account_id
LEFT JOIN public.aged_care_expenses exp ON fa.id = exp.funding_account_id
GROUP BY fa.id, fa.account_name, fa.funding_type, fa.funding_level;

-- WorkCover Claim Summary View
CREATE OR REPLACE VIEW public.workcover_claim_summaries AS
SELECT 
    wc.id,
    wc.claim_number,
    wc.injury_date,
    wc.status,
    COUNT(we.id) AS expense_count,
    COALESCE(SUM(we.amount_charged), 0) AS total_charged,
    COALESCE(SUM(we.amount_reimbursed), 0) AS total_reimbursed,
    COALESCE(SUM(we.gap_amount), 0) AS total_gap,
    COUNT(we.id) FILTER (WHERE we.status = 'pending_submission') AS pending_count,
    COUNT(we.id) FILTER (WHERE we.status = 'submitted') AS submitted_count,
    COUNT(we.id) FILTER (WHERE we.status = 'paid') AS paid_count
FROM public.workcover_claims wc
LEFT JOIN public.workcover_expenses we ON wc.id = we.claim_id
GROUP BY wc.id, wc.claim_number, wc.injury_date, wc.status;

-- Transaction Ledger View (All Credits & Debits)
CREATE OR REPLACE VIEW public.transaction_ledger AS
SELECT 
    'credit' AS transaction_type,
    fa.allocation_date AS transaction_date,
    fa.amount,
    'Funding Allocation' AS description,
    fa.reference,
    acc.account_name AS account,
    NULL AS supplier_name,
    NULL AS payment_status,
    fa.id AS source_id,
    'funding_allocation' AS source_type
FROM public.funding_allocations fa
JOIN public.funding_accounts acc ON fa.funding_account_id = acc.id

UNION ALL

SELECT 
    'debit' AS transaction_type,
    ace.expense_date AS transaction_date,
    ace.amount,
    ace.description,
    ace.invoice_number AS reference,
    acc.account_name AS account,
    s.name AS supplier_name,
    ace.status AS payment_status,
    ace.id AS source_id,
    'aged_care_expense' AS source_type
FROM public.aged_care_expenses ace
JOIN public.funding_accounts acc ON ace.funding_account_id = acc.id
LEFT JOIN public.suppliers s ON ace.supplier_id = s.id

ORDER BY transaction_date DESC;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aged_care_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workcover_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workcover_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can CRUD on main tables (family members share access)
CREATE POLICY "Authenticated users full access to suppliers" ON public.suppliers 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to expense_categories" ON public.expense_categories 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to funding_accounts" ON public.funding_accounts 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to funding_allocations" ON public.funding_allocations 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to aged_care_expenses" ON public.aged_care_expenses 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to workcover_claims" ON public.workcover_claims 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to workcover_expenses" ON public.workcover_expenses 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to payment_transactions" ON public.payment_transactions 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to attachments" ON public.attachments 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to notes" ON public.notes 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to note_tags" ON public.note_tags 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access to note_categories" ON public.note_categories 
    FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs: Read-only for authenticated users
CREATE POLICY "Users can view audit logs" ON public.audit_logs 
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, new_values, timestamp)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'create', row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, timestamp)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, old_values, timestamp)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD), NOW());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to main tables
CREATE TRIGGER audit_aged_care_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.aged_care_expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_workcover_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.workcover_expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_payment_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_funding_allocations
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_allocations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_funding_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_workcover_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.workcover_claims
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- TRIGGER FOR AUTO-CREATING PROFILE ON USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA (Default Categories)
-- ============================================================

-- Default expense categories
INSERT INTO public.expense_categories (name, expense_domain, icon, color) VALUES
  ('Personal Care', 'aged_care', 'heart', '#ef4444'),
  ('Nursing Services', 'aged_care', 'stethoscope', '#3b82f6'),
  ('Allied Health', 'both', 'activity', '#10b981'),
  ('Transport', 'both', 'car', '#f59e0b'),
  ('Equipment Hire', 'both', 'tool', '#8b5cf6'),
  ('Equipment Purchase', 'both', 'shopping-bag', '#6366f1'),
  ('Home Modifications', 'aged_care', 'home', '#14b8a6'),
  ('Meal Services', 'aged_care', 'utensils', '#f97316'),
  ('Social Support', 'aged_care', 'users', '#ec4899'),
  ('GP Consultation', 'workcover', 'user-check', '#06b6d4'),
  ('Specialist', 'workcover', 'user-cog', '#0ea5e9'),
  ('Physiotherapy', 'both', 'move', '#22c55e'),
  ('Psychology', 'both', 'brain', '#a855f7'),
  ('Medication', 'both', 'pill', '#f43f5e'),
  ('Hospital', 'workcover', 'building', '#64748b'),
  ('Imaging', 'workcover', 'scan', '#0284c7'),
  ('Other', 'both', 'more-horizontal', '#9ca3af')
ON CONFLICT DO NOTHING;

-- Default note categories
INSERT INTO public.note_categories (name, color, icon, sort_order) VALUES
  ('General', '#6366f1', 'file-text', 0),
  ('Medical', '#ef4444', 'heart-pulse', 1),
  ('Appointments', '#f59e0b', 'calendar', 2),
  ('Phone Calls', '#10b981', 'phone', 3),
  ('Important', '#dc2626', 'alert-circle', 4),
  ('Follow Up', '#8b5cf6', 'clock', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKET FOR ATTACHMENTS
-- ============================================================

-- Create storage bucket for receipts and documents
-- Run this in the SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies (uncomment and run after bucket is created):
-- CREATE POLICY "Authenticated users can upload attachments"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'attachments');

-- CREATE POLICY "Authenticated users can view attachments"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'attachments');

-- CREATE POLICY "Authenticated users can delete own attachments"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'attachments');

-- Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    category_id UUID REFERENCES public.calendar_categories(id),
    source TEXT CHECK (source IN ('local', 'google', 'outlook')),
    external_id TEXT,
    reminders JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);
