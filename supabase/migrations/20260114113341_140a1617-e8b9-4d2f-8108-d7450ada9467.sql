-- Drop the redundant "Deny anonymous access" policy from staff_members
-- The "Only admins can view full staff details" policy already handles access control
DROP POLICY IF EXISTS "Deny anonymous access to staff_members" ON public.staff_members;