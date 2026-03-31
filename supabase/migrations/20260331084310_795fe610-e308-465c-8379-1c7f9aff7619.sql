
-- 1. Remove the overly permissive "Allow read access to all users" policy on newsletter_subscribers
DROP POLICY IF EXISTS "Allow read access to all users" ON public.newsletter_subscribers;

-- 2. Add rate limiting on referral creation by limiting to max 10 pending referrals per user
-- Create a function to check referral limits
CREATE OR REPLACE FUNCTION public.check_referral_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.referrals 
    WHERE referrer_id = p_user_id 
    AND status = 'pending'
    AND created_at > now() - interval '30 days'
  ) < 10
$$;

-- Drop and recreate the referrals INSERT policy with rate limiting
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals with limit"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referrer_id 
  AND public.check_referral_limit(auth.uid())
);

-- 3. Remove the permissive "Allow read access to authenticated users" on staff_members (already admin-only)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.staff_members;
