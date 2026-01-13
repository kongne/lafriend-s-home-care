-- Fix Security: Add policies to explicitly deny anonymous SELECT access

-- 1. Profiles table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Bookings table - deny anonymous SELECT (add explicit check)
DROP POLICY IF EXISTS "Authenticated users can view their own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)));

-- 3. Contact submissions - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to contact_submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Newsletter subscribers - deny anonymous SELECT (only admins should see)
CREATE POLICY "Deny anonymous access to newsletter_subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Staff emails - add explicit deny anonymous (already has admin-only policy, but adding layer)
CREATE POLICY "Deny anonymous access to staff_emails" 
ON public.staff_emails 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 6. User roles - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create notifications table for admin notification center
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications - only admins can view/manage
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anonymous access to notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;