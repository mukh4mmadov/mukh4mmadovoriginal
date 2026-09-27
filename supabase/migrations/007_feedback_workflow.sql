ALTER TABLE public.feedback_messages
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS reproduction_steps TEXT,
  ADD COLUMN IF NOT EXISTS expected_behavior TEXT,
  ADD COLUMN IF NOT EXISTS actual_behavior TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS public_response TEXT;

ALTER TABLE public.feedback_messages
  DROP CONSTRAINT IF EXISTS feedback_messages_severity_check;

ALTER TABLE public.feedback_messages
  ADD CONSTRAINT feedback_messages_severity_check
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

CREATE INDEX IF NOT EXISTS idx_feedback_messages_severity
  ON public.feedback_messages(severity);

CREATE INDEX IF NOT EXISTS idx_feedback_messages_assigned_to
  ON public.feedback_messages(assigned_to);
