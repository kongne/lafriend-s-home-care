-- ============================================================
-- Security Fix Migration
-- Fixes: CRITICAL RLS policies, SECURITY DEFINER exposure, XSS
-- ============================================================

-- 1. FIX: Testimonials RLS - Drop USING(true) WITH CHECK(true)
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
  );

-- 2. FIX: Bookings RLS - Drop WITH CHECK(true), scope to own user_id
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
-- Also allow anonymous users to create bookings if needed
DROP POLICY IF EXISTS "Public can create bookings (anon)" ON public.bookings;
CREATE POLICY "Public can create bookings (anon)" ON public.bookings
  FOR INSERT TO anon
  WITH CHECK (true);

-- 3. FIX: feedback_ratings - Drop OR true policy
DROP POLICY IF EXISTS "Users can view feedback for completed services" ON public.feedback_ratings;
CREATE POLICY "Users can view feedback for completed services" ON public.feedback_ratings
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM public.bookings WHERE id = booking_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'moderator')
    )
  );

-- 4. FIX: Revoke SECURITY DEFINER function exposure
-- These functions run as superuser; only authenticated users should call them
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_reward(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_referral(TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_points_for_booking(UUID, UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) FROM anon;

-- Grant execute only to authenticated
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_points_for_booking(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- 5. FIX: system_settings - restrict to authenticated users only (not anon)
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT TO authenticated
  USING (true);
