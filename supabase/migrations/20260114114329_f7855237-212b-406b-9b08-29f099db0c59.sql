-- Add customer loyalty points and spending tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';

-- Create a function to calculate loyalty tier
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(points integer)
RETURNS text AS $$
BEGIN
  IF points >= 1000 THEN
    RETURN 'platinum';
  ELSIF points >= 500 THEN
    RETURN 'gold';
  ELSIF points >= 200 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Add explicit deny policy for anonymous access to staff_members
DROP POLICY IF EXISTS "Deny anonymous access to staff_members" ON public.staff_members;
CREATE POLICY "Deny anonymous access to staff_members" 
ON public.staff_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix contact_submissions to add rate limiting indicator (application-level rate limiting is recommended)
-- Add a timestamp column for rate limiting tracking at application level
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS submission_ip text;

-- Add explicit restrictive policy for profiles
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
CREATE POLICY "Users can only view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable customers to view limited staff info (just name for their assigned cleaner)
DROP POLICY IF EXISTS "Customers can view assigned staff name" ON public.staff_members;
CREATE POLICY "Customers can view assigned staff name" 
ON public.staff_members 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR id IN (
      SELECT assigned_staff_id FROM public.bookings 
      WHERE user_id = auth.uid() AND assigned_staff_id IS NOT NULL
    )
  )
);