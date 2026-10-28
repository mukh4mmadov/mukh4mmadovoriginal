-- Reading review queue saved to the learner's account so it follows them
-- across devices. Removed items keep a removed_at tombstone so another
-- device's older copy does not bring them back.
CREATE TABLE IF NOT EXISTS public.review_queue_items (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL CHECK (char_length(item_id) BETWEEN 1 AND 200),
  data JSONB NOT NULL CHECK (pg_column_size(data) <= 16384),
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  removed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.review_queue_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.review_queue_items TO authenticated;

DROP POLICY IF EXISTS "Learners read own review queue" ON public.review_queue_items;
CREATE POLICY "Learners read own review queue"
  ON public.review_queue_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners insert own review queue" ON public.review_queue_items;
CREATE POLICY "Learners insert own review queue"
  ON public.review_queue_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners update own review queue" ON public.review_queue_items;
CREATE POLICY "Learners update own review queue"
  ON public.review_queue_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS review_queue_items_user_updated_idx
  ON public.review_queue_items (user_id, updated_at DESC);
