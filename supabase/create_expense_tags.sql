-- Create expense_tags table
CREATE TABLE IF NOT EXISTS public.expense_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name TEXT NOT NULL,
    aged_care_expense_id UUID REFERENCES public.aged_care_expenses(id) ON DELETE CASCADE,
    workcover_expense_id UUID REFERENCES public.workcover_expenses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT expense_tags_one_reference CHECK (
        (aged_care_expense_id IS NOT NULL AND workcover_expense_id IS NULL) OR
        (aged_care_expense_id IS NULL AND workcover_expense_id IS NOT NULL)
    ),
    UNIQUE(tag_name, aged_care_expense_id),
    UNIQUE(tag_name, workcover_expense_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_tags_aged_care ON public.expense_tags(aged_care_expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_workcover ON public.expense_tags(workcover_expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_name ON public.expense_tags(tag_name);

-- RLS
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access to expense_tags" ON public.expense_tags
    FOR ALL USING (auth.role() = 'authenticated');

-- Audit Trigger
CREATE TRIGGER audit_expense_tags
  AFTER INSERT OR UPDATE OR DELETE ON public.expense_tags
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
