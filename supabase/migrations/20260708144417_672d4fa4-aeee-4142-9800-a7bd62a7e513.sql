
-- ============================================================
-- FEEDBACK: stricter INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;

CREATE POLICY "Public can submit feedback"
  ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Required fields with sane length limits
    name IS NOT NULL     AND length(btrim(name))    BETWEEN 1 AND 120
    AND email IS NOT NULL AND length(btrim(email))  BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND message IS NOT NULL AND length(btrim(message)) BETWEEN 1 AND 5000
    -- Optional fields bounded
    AND (phone   IS NULL OR length(phone)   <= 40)
    AND (subject IS NULL OR length(subject) <= 200)
    AND (service IS NULL OR length(service) <= 120)
    -- New submissions must start as 'new' (no pre-setting admin state)
    AND status = 'new'
  );

-- ============================================================
-- SERVICE_ANALYTICS: stricter INSERT policy + explicit no-write elsewhere
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.service_analytics;

CREATE POLICY "Public can record analytics events"
  ON public.service_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    service_id IS NOT NULL
    AND event_type = ANY (ARRAY['view','booking','inquiry','share'])
    -- Only allow events for services that actually exist
    AND EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id)
  );

-- Explicitly forbid client-side updates/deletes on analytics
-- (admins/service_role bypass RLS via existing roles / no policy = deny)
REVOKE UPDATE, DELETE ON public.service_analytics FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.feedback          FROM anon, authenticated;
