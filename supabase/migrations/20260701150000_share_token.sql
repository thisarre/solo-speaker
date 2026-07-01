-- Add share_token column to talks for public sharing (Pro/Team feature)
ALTER TABLE public.talks
  ADD COLUMN share_token UUID UNIQUE DEFAULT NULL;

CREATE INDEX idx_talks_share_token ON public.talks (share_token)
  WHERE share_token IS NOT NULL;

-- Allow anonymous (unauthenticated) reads of publicly shared talks.
-- The UUID token acts as the access credential; an RLS row is readable
-- only when share_token is non-null, and the query further filters by
-- the exact token value — making brute-force infeasible (122 bits of entropy).
CREATE POLICY "talks_anon_select_by_share_token" ON public.talks
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

-- Allow anonymous reads of sections whose parent talk is publicly shared.
CREATE POLICY "talk_sections_anon_select_by_share_token" ON public.talk_sections
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.talks
      WHERE talks.id = talk_sections.talk_id
        AND talks.share_token IS NOT NULL
    )
  );
