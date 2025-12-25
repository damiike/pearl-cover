-- ============================================================
-- Full-Text Search Implementation for Pearl Cover
-- ============================================================

-- Enable tsvector extension (already enabled via uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- NOTES SEARCH
-- ============================================================

-- Add search vector column
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing notes
UPDATE notes
SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
WHERE search_vector IS NULL;

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING gin(search_vector);

-- Create trigger for automatic updates
CREATE OR REPLACE FUNCTION notes_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_search_update ON notes;
CREATE TRIGGER notes_search_update
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION notes_search_trigger();

-- Search function for notes
CREATE OR REPLACE FUNCTION search_notes(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  is_archived boolean,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.title, n.content, n.is_archived, n.created_at,
    ts_rank(n.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM notes n
  WHERE 
    n.search_vector @@ plainto_tsquery('english', search_query)
    AND n.is_archived = false
  ORDER BY rank DESC, n.created_at DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AGED CARE EXPENSES SEARCH
-- ============================================================

-- Add search vector column
ALTER TABLE aged_care_expenses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing expenses
UPDATE aged_care_expenses
SET search_vector = 
  setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(invoice_number, '')), 'B')
WHERE search_vector IS NULL;

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_search ON aged_care_expenses USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_date ON aged_care_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_account ON aged_care_expenses(funding_account_id);
CREATE INDEX IF NOT EXISTS idx_aged_care_expenses_status ON aged_care_expenses(status);

-- Create trigger
CREATE OR REPLACE FUNCTION aged_care_expenses_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.invoice_number, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aged_care_expenses_search_update ON aged_care_expenses;
CREATE TRIGGER aged_care_expenses_search_update
BEFORE INSERT OR UPDATE ON aged_care_expenses
FOR EACH ROW
EXECUTE FUNCTION aged_care_expenses_search_trigger();

-- Search function
CREATE OR REPLACE FUNCTION search_aged_care_expenses(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  description text,
  amount decimal,
  expense_date date,
  status text,
  invoice_number text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ace.id, ace.description, ace.amount, ace.expense_date, 
    ace.status, ace.invoice_number,
    ts_rank(ace.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM aged_care_expenses ace
  WHERE 
    ace.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, ace.expense_date DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- WORKCOVER CLAIMS SEARCH
-- ============================================================

-- Add search vector column
ALTER TABLE workcover_claims ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing claims
UPDATE workcover_claims
SET search_vector = 
  setweight(to_tsvector('english', coalesce(claim_number, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(injury_description, '')), 'B')
WHERE search_vector IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workcover_claims_search ON workcover_claims USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_workcover_claims_status ON workcover_claims(status);
CREATE INDEX IF NOT EXISTS idx_workcover_claims_date ON workcover_claims(injury_date DESC);

-- Create trigger
CREATE OR REPLACE FUNCTION workcover_claims_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.claim_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.injury_description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workcover_claims_search_update ON workcover_claims;
CREATE TRIGGER workcover_claims_search_update
BEFORE INSERT OR UPDATE ON workcover_claims
FOR EACH ROW
EXECUTE FUNCTION workcover_claims_search_trigger();

-- Search function
CREATE OR REPLACE FUNCTION search_workcover_claims(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  claim_number text,
  injury_date date,
  injury_description text,
  status text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id, wc.claim_number, wc.injury_date, wc.injury_description, wc.status,
    ts_rank(wc.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM workcover_claims wc
  WHERE 
    wc.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, wc.injury_date DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- WORKCOVER EXPENSES SEARCH
-- ============================================================

-- Add search vector column
ALTER TABLE workcover_expenses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing expenses
UPDATE workcover_expenses
SET search_vector = 
  setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(invoice_number, '')), 'B')
WHERE search_vector IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_search ON workcover_expenses USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_claim ON workcover_expenses(claim_id);
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_date ON workcover_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_workcover_expenses_status ON workcover_expenses(status);

-- Create trigger
CREATE OR REPLACE FUNCTION workcover_expenses_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.invoice_number, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workcover_expenses_search_update ON workcover_expenses;
CREATE TRIGGER workcover_expenses_search_update
BEFORE INSERT OR UPDATE ON workcover_expenses
FOR EACH ROW
EXECUTE FUNCTION workcover_expenses_search_trigger();

-- Search function
CREATE OR REPLACE FUNCTION search_workcover_expenses(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  description text,
  amount_charged decimal,
  expense_date date,
  status text,
  invoice_number text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    we.id, we.description, we.amount_charged, we.expense_date, we.status, we.invoice_number,
    ts_rank(we.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM workcover_expenses we
  WHERE 
    we.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, we.expense_date DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PAYMENT TRANSACTIONS SEARCH
-- ============================================================

-- Add search vector column
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing payments
UPDATE payment_transactions
SET search_vector = 
  setweight(to_tsvector('english', coalesce(reference, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(payer, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(notes, '')), 'C')
WHERE search_vector IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_search ON payment_transactions USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(payment_type);

-- Create trigger
CREATE OR REPLACE FUNCTION payment_transactions_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.reference, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.payer, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_transactions_search_update ON payment_transactions;
CREATE TRIGGER payment_transactions_search_update
BEFORE INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION payment_transactions_search_trigger();

-- Search function
CREATE OR REPLACE FUNCTION search_payment_transactions(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  total_amount decimal,
  payment_date date,
  reference text,
  payer text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id, pt.total_amount, pt.payment_date, pt.reference, pt.payer,
    ts_rank(pt.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM payment_transactions pt
  WHERE 
    pt.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, pt.payment_date DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ATTACHMENTS SEARCH (OCR TEXT)
-- ============================================================

-- Add search vector column
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing attachments
UPDATE attachments
SET search_vector = 
  setweight(to_tsvector('english', coalesce(file_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(ocr_text, '')), 'B')
WHERE search_vector IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attachments_search ON attachments USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Create trigger
CREATE OR REPLACE FUNCTION attachments_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.file_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.ocr_text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attachments_search_update ON attachments;
CREATE TRIGGER attachments_search_update
BEFORE INSERT OR UPDATE ON attachments
FOR EACH ROW
EXECUTE FUNCTION attachments_search_trigger();

-- Search function
CREATE OR REPLACE FUNCTION search_attachments(
  search_query text,
  limit_val int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_type text,
  ocr_text text,
  upload_date timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.file_name, a.file_type, a.ocr_text, a.upload_date,
    ts_rank(a.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM attachments a
  WHERE 
    a.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, a.upload_date DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;
