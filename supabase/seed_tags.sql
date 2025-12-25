-- Add some tags for Aged Care
WITH distinct_expenses AS (
  SELECT id FROM public.aged_care_expenses LIMIT 3
)
INSERT INTO public.expense_tags (aged_care_expense_id, tag_name)
SELECT id, 'medical' FROM distinct_expenses LIMIT 1;

WITH distinct_expenses AS (
  SELECT id FROM public.aged_care_expenses LIMIT 3 OFFSET 1
)
INSERT INTO public.expense_tags (aged_care_expense_id, tag_name)
SELECT id, 'quarterly' FROM distinct_expenses LIMIT 1;

-- Add some tags for Workcover
WITH distinct_wc_expenses AS (
    SELECT id FROM public.workcover_expenses LIMIT 3
)
INSERT INTO public.expense_tags (workcover_expense_id, tag_name)
SELECT id, 'physio' FROM distinct_wc_expenses LIMIT 1;

-- Add some tags for Notes (existing table)
-- Table: note_tags (note_id, tag_name)
WITH distinct_notes AS (
    SELECT id FROM public.notes LIMIT 3
)
INSERT INTO public.note_tags (note_id, tag_name)
SELECT id, 'important' FROM distinct_notes LIMIT 1;

WITH distinct_notes AS (
    SELECT id FROM public.notes LIMIT 3 OFFSET 1
)
INSERT INTO public.note_tags (note_id, tag_name)
SELECT id, 'todo' FROM distinct_notes LIMIT 1;
