-- 1) customer_rewards: remove user UPDATE policy (state changes go through SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Users can update their own rewards" ON public.customer_rewards;

-- 2) staff_members: replace ALL policy with explicit WITH CHECK to block non-admin INSERT/UPDATE
DROP POLICY IF EXISTS "Admins manage staff" ON public.staff_members;

CREATE POLICY "Admins manage staff"
ON public.staff_members
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
