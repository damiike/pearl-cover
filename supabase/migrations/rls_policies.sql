-- ============================================================
-- Row Level Security (RLS) Policies for Pearl Cover
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aged_care_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workcover_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE workcover_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_page_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Only service role can insert profiles
CREATE POLICY "Service can insert profiles"
ON profiles FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- SUPPLIERS
-- ============================================================

-- All authenticated users can view active suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON suppliers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admin/supplier role can insert/update suppliers
CREATE POLICY "Admins can manage suppliers"
ON suppliers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'supplier')
  )
);

-- ============================================================
-- EXPENSE & NOTE CATEGORIES
-- ============================================================

-- All authenticated users can view categories
CREATE POLICY "Authenticated users can view categories"
ON expense_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view note categories"
ON note_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- FUNDING ACCOUNTS
-- ============================================================

-- Users can view funding accounts if they have access (all users for now)
CREATE POLICY "Authenticated users can view funding accounts"
ON funding_accounts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can create/update funding accounts
CREATE POLICY "Admins can manage funding accounts"
ON funding_accounts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- FUNDING ALLOCATIONS
-- ============================================================

CREATE POLICY "Authenticated users can view allocations"
ON funding_allocations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert allocations"
ON funding_allocations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- AGED CARE EXPENSES
-- ============================================================

CREATE POLICY "Users can view aged care expenses"
ON aged_care_expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM funding_accounts fa
    WHERE fa.id = aged_care_expenses.funding_account_id
    AND (
      fa.is_active = true
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can insert aged care expenses"
ON aged_care_expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM funding_accounts fa
    WHERE fa.id = aged_care_expenses.funding_account_id
    AND (
      fa.is_active = true
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can update own aged care expenses"
ON aged_care_expenses FOR UPDATE
USING (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can delete aged care expenses"
ON aged_care_expenses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- WORKCOVER CLAIMS
-- ============================================================

CREATE POLICY "Authenticated users can view workcover claims"
ON workcover_claims FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workcover claims"
ON workcover_claims FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- WORKCOVER EXPENSES
-- ============================================================

CREATE POLICY "Authenticated users can view workcover expenses"
ON workcover_expenses FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workcover expenses"
ON workcover_expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workcover_claims wc
    WHERE wc.id = workcover_expenses.claim_id
    AND auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Admins can manage workcover expenses"
ON workcover_expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================

CREATE POLICY "Authenticated users can view payments"
ON payment_transactions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage payments"
ON payment_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- NOTES
-- ============================================================

CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (
  created_by = auth.uid()
  OR is_archived = false
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================

CREATE POLICY "Users can view attachments for their data"
ON attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'owner', 'support')
  )
);

CREATE POLICY "Users can insert attachments for their entities"
ON attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'owner', 'support')
  )
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE POLICY "Users can insert own audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================

CREATE POLICY "Users can view own calendar events"
ON calendar_events FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert own calendar events"
ON calendar_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own calendar events"
ON calendar_events FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete own calendar events"
ON calendar_events FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================
-- TAG TABLES
-- ============================================================

CREATE POLICY "Users can insert note tags for their notes"
ON note_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM notes n
    WHERE n.id = note_tags.note_id
    AND n.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete note tags for their notes"
ON note_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM notes n
    WHERE n.id = note_tags.note_id
    AND n.created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage expense tags"
ON expense_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'owner', 'support')
  )
);

-- ============================================================
-- RBAC TABLES
-- ============================================================

CREATE POLICY "Admins can manage pages"
ON pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view role permissions"
ON role_page_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their user permissions"
ON user_page_permissions FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================
-- VIEWS (READ-ONLY)
-- ============================================================

-- Views are read-only, apply appropriate RLS
-- Most users can access view data
CREATE POLICY "Authenticated users can view balances"
ON funding_account_balances FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view claim summaries"
ON workcover_claim_summaries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view transaction ledger"
ON transaction_ledger FOR SELECT
USING (auth.uid() IS NOT NULL);
