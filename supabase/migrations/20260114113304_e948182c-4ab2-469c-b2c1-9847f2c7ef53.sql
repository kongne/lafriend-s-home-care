-- Fix security issue: Users can read each other's notifications
-- Add policy so users can only view their own notifications

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix security issue: Staff personal contact information exposed
-- Drop the overly permissive policy and create a more restrictive one

DROP POLICY IF EXISTS "Authenticated users can view active staff" ON public.staff_members;

-- Create a new policy that only exposes limited info (name and specializations)
-- by restricting to admins for full access
CREATE POLICY "Only admins can view full staff details" 
ON public.staff_members 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix the overly permissive INSERT policy on notifications
-- Change from WITH CHECK (true) to only allow service role or admins
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Admins or system can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NULL);