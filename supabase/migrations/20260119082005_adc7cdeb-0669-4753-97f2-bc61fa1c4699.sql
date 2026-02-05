-- =====================================================
-- FIX OVERLY PERMISSIVE INSERT POLICIES
-- These tables need public INSERT but with validation
-- =====================================================

-- 1. FIX bookings - Public can create but must provide required fields
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Single INSERT policy: Anyone can create bookings with proper data validation
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  -- If authenticated, user_id must match auth.uid() or be NULL
  -- If anonymous, user_id must be NULL
  (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  )
  -- Required fields validation
  AND full_name IS NOT NULL
  AND email IS NOT NULL
  AND phone IS NOT NULL
  AND address IS NOT NULL
  AND service_type IS NOT NULL
  AND preferred_date IS NOT NULL
  AND preferred_time IS NOT NULL
);

-- 2. FIX contact_submissions - Public can create but with validation
DROP POLICY IF EXISTS "Public can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (
  -- If authenticated, user_id must match auth.uid() or be NULL
  -- If anonymous, user_id must be NULL  
  (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  )
  -- Required fields validation
  AND full_name IS NOT NULL
  AND email IS NOT NULL
  AND subject IS NOT NULL
  AND message IS NOT NULL
);

-- 3. FIX newsletter_subscribers - Public can subscribe with validation
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (
  -- Email must be provided and valid format check at application level
  email IS NOT NULL
  -- Prevent duplicate subscriptions (can't use subquery in WITH CHECK, handled by unique constraint)
);