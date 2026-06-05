
-- 1. PROFILES: remove permissive "any authenticated" policy
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- 2. NOTIFICATIONS: remove permissive "any authenticated" SELECT and tighten INSERT
DROP POLICY IF EXISTS "Deny anonymous access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins or system can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. STAFF_TIME_OFF: admin-only SELECT
DROP POLICY IF EXISTS "Deny anonymous access to staff_time_off" ON public.staff_time_off;
CREATE POLICY "Admins view staff time off"
  ON public.staff_time_off FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. AUDIT_LOGS: remove anon insert branch
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. LOYALTY_TRANSACTIONS: block all client inserts (service role bypasses RLS)
DROP POLICY IF EXISTS "Only system can insert transactions (via functions)" ON public.loyalty_transactions;

-- 6. FEEDBACK_RATINGS: restrict to own completed bookings; force is_verified_booking via trigger
DROP POLICY IF EXISTS "Authenticated can create feedback" ON public.feedback_ratings;
CREATE POLICY "Users insert feedback for own completed bookings"
  ON public.feedback_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.user_id = auth.uid()
        AND b.status = 'completed'
    )
  );

CREATE OR REPLACE FUNCTION public.set_feedback_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_verified_booking := EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = NEW.booking_id
      AND b.user_id = NEW.user_id
      AND b.status = 'completed'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_feedback_verified ON public.feedback_ratings;
CREATE TRIGGER trg_set_feedback_verified
  BEFORE INSERT ON public.feedback_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_feedback_verified();
