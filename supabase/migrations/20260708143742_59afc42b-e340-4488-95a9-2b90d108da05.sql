
-- Fix mutable search_path
CREATE OR REPLACE FUNCTION public.increment_service_views(service_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.services
  SET total_views = COALESCE(total_views, 0) + 1
  WHERE slug = service_slug;
END;
$function$;

-- Replace permissive feedback INSERT policy with validated one
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(message) BETWEEN 1 AND 5000
    AND (phone IS NULL OR length(phone) <= 40)
    AND (subject IS NULL OR length(subject) <= 200)
    AND (service IS NULL OR length(service) <= 120)
  );

-- Replace permissive analytics INSERT policy with validated one
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.service_analytics;
CREATE POLICY "Anyone can insert analytics"
  ON public.service_analytics
  FOR INSERT
  WITH CHECK (
    event_type = ANY (ARRAY['view','booking','inquiry','share'])
    AND service_id IS NOT NULL
  );
