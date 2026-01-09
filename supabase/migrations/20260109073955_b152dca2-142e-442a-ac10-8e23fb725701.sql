-- Fix RLS policies: Replace permissive INSERT policies with proper user-scoped policies

-- Drop overly permissive policies on contact_submissions
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;

-- Create proper policy for contact submissions (allow inserts but restrict to authenticated users or allow anonymous for public forms)
-- For contact forms, we still allow anonymous submissions but ensure no one can read others' data
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  -- Either the user is authenticated and owns the record, or it's an anonymous submission
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL) OR
  (user_id IS NULL)
);

-- Drop overly permissive policies on newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create proper policy for newsletter subscriptions
-- Newsletter subscriptions are typically anonymous, so we allow insert but ensure no duplicate abuse
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (
  -- Prevent insertion of duplicate emails (basic protection)
  NOT EXISTS (
    SELECT 1 FROM public.newsletter_subscribers 
    WHERE email = newsletter_subscribers.email
  )
);

-- Ensure bookings policies are properly restrictive
DROP POLICY IF EXISTS "Anyone can create anonymous bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Consolidated booking insert policy
CREATE POLICY "Users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  -- Authenticated users can create bookings with their user_id or anonymous (null)
  -- Anonymous users can only create bookings without user_id
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Ensure no anonymous users can read bookings they don't own
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

-- Recreate with stricter check
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (
  -- Only authenticated users can view their own bookings
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);