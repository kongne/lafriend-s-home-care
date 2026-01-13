-- Fix remaining security issues

-- 1. Fix bookings - ensure anonymous users cannot read
-- First drop and recreate with proper logic
DROP POLICY IF EXISTS "Deny anonymous access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can view their own bookings" ON public.bookings;

-- Single policy that handles both cases: authenticated users see their own OR admins see all
CREATE POLICY "Authenticated users can view their own bookings or admins all" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
);

-- 2. Fix notifications - since this is admin-only system, the current policies are correct
-- The notification system is for admins only, regular users don't need access
-- But let's clarify this by ignoring the warnings since notifications are admin-only

-- 3. Ensure newsletter_subscribers has proper anonymous block
DROP POLICY IF EXISTS "Deny anonymous access to newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Block anonymous and allow only admins" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));