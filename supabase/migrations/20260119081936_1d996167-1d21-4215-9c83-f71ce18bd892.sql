-- =====================================================
-- FIX SECURITY ISSUES FOR SENSITIVE DATA TABLES
-- =====================================================

-- 1. FIX contact_submissions - Exclude NULL user_id from non-admin SELECT
-- Drop existing policies first
DROP POLICY IF EXISTS "Select contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Deny anonymous access to contact_submissions" ON public.contact_submissions;

-- Create new secure SELECT policy: Only admins can see all submissions, users can only see their own
CREATE POLICY "Users view own submissions or admins view all" 
ON public.contact_submissions 
FOR SELECT 
USING (
  -- Admins can see everything
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
  OR
  -- Non-admin users can only see submissions where user_id matches their auth.uid() (NOT NULL)
  (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id)
);

-- 2. FIX staff_members - Only admins should have access
-- Drop permissive policies that allow any authenticated user
DROP POLICY IF EXISTS "Deny anonymous access to staff_members" ON public.staff_members;
DROP POLICY IF EXISTS "Admins select staff" ON public.staff_members;

-- The "Admins manage staff" policy with ALL command already handles admin access
-- Ensure it exists with proper restrictions (it uses EXISTS subquery which is secure)

-- 3. FIX staff_emails - Only admins should have access  
DROP POLICY IF EXISTS "Deny anonymous access to staff_emails" ON public.staff_emails;

-- 4. FIX staff_availability - Only admins should have access
DROP POLICY IF EXISTS "Deny anonymous access to staff_availability" ON public.staff_availability;

-- 5. FIX feedback_ratings - Exclude NULL user_id from non-admin SELECT to prevent data harvesting
DROP POLICY IF EXISTS "View own feedback or admins" ON public.feedback_ratings;

CREATE POLICY "View own feedback or admins" 
ON public.feedback_ratings 
FOR SELECT 
USING (
  -- Admins can see everything
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
  OR
  -- Non-admin users can only see feedback where user_id matches their auth.uid() (NOT NULL)
  (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id)
);

-- 6. Also ensure bookings with NULL user_id are only visible to admins
DROP POLICY IF EXISTS "Users view own bookings or admins view all" ON public.bookings;

CREATE POLICY "Users view own bookings or admins view all" 
ON public.bookings 
FOR SELECT 
USING (
  -- Admins can see everything  
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
  OR
  -- Non-admin users can only see bookings where user_id matches their auth.uid() (NOT NULL)
  (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id)
);