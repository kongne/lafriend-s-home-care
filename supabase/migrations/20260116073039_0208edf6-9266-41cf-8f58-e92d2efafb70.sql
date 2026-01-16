-- Fix RLS policies to prevent viewing records with NULL user_id

-- BOOKINGS: Exclude NULL user_id from being viewed by regular users
DROP POLICY IF EXISTS "Users view own bookings or admins view all" ON public.bookings;
CREATE POLICY "Users view own bookings or admins view all" ON public.bookings
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- CONTACT_SUBMISSIONS: Exclude NULL user_id from being viewed by regular users
DROP POLICY IF EXISTS "Select contact submissions" ON public.contact_submissions;
CREATE POLICY "Select contact submissions" ON public.contact_submissions
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- FEEDBACK_RATINGS: Restrict to own feedback or admins
DROP POLICY IF EXISTS "Authenticated can view feedback" ON public.feedback_ratings;
CREATE POLICY "View own feedback or admins" ON public.feedback_ratings
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR user_id IS NULL -- Allow viewing anonymous feedback (reviews)
  );

-- PROFILES: Ensure users can only view their own profile, admins can view all
DROP POLICY IF EXISTS "Select profiles" ON public.profiles;
CREATE POLICY "Select own profile or admins" ON public.profiles
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS: Users can only see their own notifications
DROP POLICY IF EXISTS "Select notifications" ON public.notifications;
CREATE POLICY "Select own notifications" ON public.notifications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- USER_ROLES: Users can only see their own roles
DROP POLICY IF EXISTS "Select user roles" ON public.user_roles;
CREATE POLICY "Select own roles" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );