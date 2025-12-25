-- ============================================================
-- Error Logging Table for Pearl Cover
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  component_stack TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_message ON error_logs USING gin(to_tsvector('english', error_message));

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error logs
CREATE POLICY "Users can insert own error logs"
ON error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own error logs
CREATE POLICY "Users can view own error logs"
ON error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
ON error_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Auto-cleanup of old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs() RETURNS void AS $$
BEGIN
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_user_id UUID DEFAULT NULL,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_component_stack TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO error_logs (
    user_id, 
    error_message, 
    stack_trace, 
    component_stack,
    url,
    user_agent
  ) VALUES (
    p_user_id,
    p_error_message,
    p_stack_trace,
    p_component_stack,
    p_url,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;
