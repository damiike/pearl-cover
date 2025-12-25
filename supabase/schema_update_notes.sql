-- 1. Update Notes Table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE;

-- 2. Update Attachments Check Constraint
-- We have to drop the constraint and re-add it to include 'note'
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_entity_type_check;

ALTER TABLE public.attachments 
ADD CONSTRAINT attachments_entity_type_check 
CHECK (entity_type IN ('aged_care_expense', 'workcover_expense', 'payment', 'funding_allocation', 'workcover_claim', 'note'));

-- 3. Audit Log Trigger for Attachments (if not exists)
CREATE TRIGGER audit_attachments
  AFTER INSERT OR UPDATE OR DELETE ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
