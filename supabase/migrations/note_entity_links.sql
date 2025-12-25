-- Multi-Entity Note Linking Migration
-- Allows notes to link to multiple workcover claims and expenses

-- Junction table for notes -> workcover claims
CREATE TABLE IF NOT EXISTS note_workcover_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    workcover_claim_id uuid REFERENCES workcover_claims(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(note_id, workcover_claim_id)
);

-- Junction table for notes -> aged care expenses
CREATE TABLE IF NOT EXISTS note_aged_care_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    aged_care_expense_id uuid REFERENCES aged_care_expenses(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(note_id, aged_care_expense_id)
);

-- Junction table for notes -> workcover expenses
CREATE TABLE IF NOT EXISTS note_workcover_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    workcover_expense_id uuid REFERENCES workcover_expenses(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(note_id, workcover_expense_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_workcover_claims_note_id ON note_workcover_claims(note_id);
CREATE INDEX IF NOT EXISTS idx_note_workcover_claims_claim_id ON note_workcover_claims(workcover_claim_id);
CREATE INDEX IF NOT EXISTS idx_note_aged_care_expenses_note_id ON note_aged_care_expenses(note_id);
CREATE INDEX IF NOT EXISTS idx_note_aged_care_expenses_expense_id ON note_aged_care_expenses(aged_care_expense_id);
CREATE INDEX IF NOT EXISTS idx_note_workcover_expenses_note_id ON note_workcover_expenses(note_id);
CREATE INDEX IF NOT EXISTS idx_note_workcover_expenses_expense_id ON note_workcover_expenses(workcover_expense_id);

-- Enable RLS
ALTER TABLE note_workcover_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_aged_care_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_workcover_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for note_workcover_claims
CREATE POLICY "Users can view their own note-claim links"
    ON note_workcover_claims FOR SELECT
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_claims.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own note-claim links"
    ON note_workcover_claims FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_claims.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own note-claim links"
    ON note_workcover_claims FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_claims.note_id AND notes.user_id = auth.uid()
        )
    );

-- RLS Policies for note_aged_care_expenses
CREATE POLICY "Users can view their own note-aged-care-expense links"
    ON note_aged_care_expenses FOR SELECT
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_aged_care_expenses.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own note-aged-care-expense links"
    ON note_aged_care_expenses FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_aged_care_expenses.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own note-aged-care-expense links"
    ON note_aged_care_expenses FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_aged_care_expenses.note_id AND notes.user_id = auth.uid()
        )
    );

-- RLS Policies for note_workcover_expenses
CREATE POLICY "Users can view their own note-workcover-expense links"
    ON note_workcover_expenses FOR SELECT
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_expenses.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own note-workcover-expense links"
    ON note_workcover_expenses FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_expenses.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own note-workcover-expense links"
    ON note_workcover_expenses FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_workcover_expenses.note_id AND notes.user_id = auth.uid()
        )
    );
