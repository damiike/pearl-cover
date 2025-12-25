-- Variable for the User ID
\set user_id 'c738eeda-ca04-4b29-a71a-580b6a01e707'

-- 1. Suppliers
INSERT INTO public.suppliers (name, supplier_type, contact_name, email, phone)
VALUES 
    ('Sunrise Medical Centre', 'medical', 'Dr. Smith', 'admin@sunrisemedical.com', '03 9999 1111'),
    ('City Physio', 'allied_health', 'Sarah Jones', 'bookings@cityphysio.com.au', '03 8888 2222'),
    ('Chemist Warehouse', 'other', NULL, NULL, NULL),
    ('Mobility Aids Australia', 'equipment', 'Sales Team', 'sales@mobilityaids.com.au', '1300 000 000')
ON CONFLICT DO NOTHING;

-- 2. Funding Accounts (Aged Care)
INSERT INTO public.funding_accounts (account_name, funding_type, provider_name)
VALUES 
    ('My Aged Care HCP Level 4', 'home_care_package', 'My Aged Care'),
    ('Personal Savings', 'other', 'Commonwealth Bank')
ON CONFLICT DO NOTHING;

-- 3. WorkCover Claims
INSERT INTO public.workcover_claims (claim_number, injury_date, injury_description, status, insurer_name, insurer_contact)
VALUES 
    ('WC-2024-089', '2024-05-15', 'Lower back strain from lifting heavy boxes at work.', 'open', 'Allianz', 'John Doe - 03 7777 8888'),
    ('WC-2023-112', '2023-11-20', 'Repetitive strain injury (RSI) in right wrist.', 'closed', 'WorkSafe Victoria', 'Claim Mgr - 1800 111 222')
ON CONFLICT DO NOTHING;

-- 4. Aged Care Expenses
WITH fa AS (SELECT id, name FROM public.funding_accounts WHERE created_by = :'user_id'),
     sup AS (SELECT id, name FROM public.suppliers WHERE created_by = :'user_id'),
     ec AS (SELECT id, name FROM public.expense_categories WHERE expense_domain = 'aged_care')
INSERT INTO public.aged_care_expenses (funding_account_id, supplier_id, category_id, description, amount, expense_date, invoice_number, status, created_by)
SELECT 
    fa.id, 
    sup.id, 
    ec.id,
    'Weekly Physiotherapy Session', 
    120.00, 
    (NOW() - INTERVAL '2 days')::date, 
    'INV-998877', 
    'paid', 
    :'user_id'
FROM fa, sup, ec
WHERE fa.name LIKE '%HCP%' AND sup.name = 'City Physio' AND ec.name = 'Medical'
LIMIT 1;

WITH fa AS (SELECT id, name FROM public.funding_accounts WHERE created_by = :'user_id'),
     sup AS (SELECT id, name FROM public.suppliers WHERE created_by = :'user_id'),
     ec AS (SELECT id, name FROM public.expense_categories WHERE expense_domain = 'aged_care')
INSERT INTO public.aged_care_expenses (funding_account_id, supplier_id, category_id, description, amount, expense_date, invoice_number, status, created_by)
SELECT 
    fa.id, 
    sup.id, 
    ec.id,
    'Purchase of Walker', 
    450.00, 
    (NOW() - INTERVAL '10 days')::date, 
    'INV-WALK-01', 
    'pending', 
    :'user_id'
FROM fa, sup, ec
WHERE fa.name LIKE '%Savings%' AND sup.name = 'Mobility Aids Australia' AND ec.name = 'Equipment'
LIMIT 1;

-- 5. WorkCover Expenses
WITH wc AS (SELECT id, claim_number FROM public.workcover_claims WHERE created_by = :'user_id' AND status = 'open'),
     sup AS (SELECT id, name FROM public.suppliers WHERE created_by = :'user_id'),
     ec AS (SELECT id, name FROM public.expense_categories WHERE expense_domain = 'workcover')
INSERT INTO public.workcover_expenses (claim_id, supplier_id, category_id, description, amount_charged, amount_claimed, amount_reimbursed, expense_date, invoice_number, status, created_by)
SELECT 
    wc.id, 
    sup.id, 
    ec.id, 
    'GP Consultation - Back Pain Review', 
    85.00, 
    85.00, 
    0.00, 
    (NOW() - INTERVAL '5 days')::date, 
    'INV-GP-2024', 
    'submitted', 
    :'user_id'
FROM wc, sup, ec
WHERE wc.claim_number = 'WC-2024-089' AND sup.name = 'Sunrise Medical Centre' AND ec.name = 'Medical'
LIMIT 1;

-- 6. Notes
WITH nc AS (SELECT id, name FROM public.note_categories WHERE name = 'Personal')
INSERT INTO public.notes (title, content, category_id, is_pinned, is_archived, created_by)
SELECT 
    'Doctor Appointment Reminder', 
    'Discuss medication review and upcoming test results with Dr. Smith next Tuesday.', 
    nc.id, 
    true, 
    false, 
    :'user_id'
FROM nc
LIMIT 1;

WITH nc AS (SELECT id, name FROM public.note_categories WHERE name = 'Work')
INSERT INTO public.notes (title, content, category_id, is_pinned, is_archived, created_by)
SELECT 
    'Receipts to Scan', 
    'Need to scan and upload receipts for the walker and last weeks physio.', 
    nc.id, 
    false, 
    false, 
    :'user_id'
FROM nc
LIMIT 1;

-- 7. Tags (Linking to created items)

-- Tag for Aged Care Expense (Medical)
WITH expr AS (SELECT id FROM public.aged_care_expenses WHERE description = 'Weekly Physiotherapy Session' LIMIT 1)
INSERT INTO public.expense_tags (aged_care_expense_id, tag_name)
SELECT id, 'rehab' FROM expr;

-- Tag for WorkCover Expense
WITH expr AS (SELECT id FROM public.workcover_expenses WHERE description = 'GP Consultation - Back Pain Review' LIMIT 1)
INSERT INTO public.expense_tags (workcover_expense_id, tag_name)
SELECT id, 'urgent' FROM expr;

-- Tags for Notes
WITH note AS (SELECT id FROM public.notes WHERE title = 'Doctor Appointment Reminder' LIMIT 1)
INSERT INTO public.note_tags (note_id, tag_name)
SELECT id, 'health' FROM note;

WITH note AS (SELECT id FROM public.notes WHERE title = 'Doctor Appointment Reminder' LIMIT 1)
INSERT INTO public.note_tags (note_id, tag_name)
SELECT id, 'important' FROM note;

WITH note AS (SELECT id FROM public.notes WHERE title = 'Receipts to Scan' LIMIT 1)
INSERT INTO public.note_tags (note_id, tag_name)
SELECT id, 'admin' FROM note;
