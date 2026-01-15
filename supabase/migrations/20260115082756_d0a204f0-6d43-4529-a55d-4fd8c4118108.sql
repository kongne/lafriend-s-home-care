-- Add missing tables and fix security issues

-- 1. Create feedback_ratings table
CREATE TABLE IF NOT EXISTS public.feedback_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER NOT NULL DEFAULT 5 CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  punctuality_rating INTEGER NOT NULL DEFAULT 5 CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER NOT NULL DEFAULT 5 CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  comment TEXT,
  is_verified_booking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create email_reminders table
CREATE TABLE IF NOT EXISTS public.email_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT '24hours',
  scheduled_send_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add is_archived column to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.feedback_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- =========================================
-- SECURITY FIX: Block anonymous access to all sensitive tables
-- =========================================

-- Bookings: Only authenticated users can read their own bookings, admins can read all
DROP POLICY IF EXISTS "Deny anonymous read access to bookings" ON public.bookings;
CREATE POLICY "Deny anonymous read access to bookings" ON public.bookings
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Contact submissions: Only admins
DROP POLICY IF EXISTS "Deny anonymous read access to contact_submissions" ON public.contact_submissions;
CREATE POLICY "Deny anonymous read access to contact_submissions" ON public.contact_submissions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Profiles: Users can only view their own
DROP POLICY IF EXISTS "Deny anonymous read access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous read access to profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Staff members: Only admins can read full data
DROP POLICY IF EXISTS "Deny anonymous read access to staff_members" ON public.staff_members;
CREATE POLICY "Deny anonymous read access to staff_members" ON public.staff_members
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Newsletter subscribers: Only admins
DROP POLICY IF EXISTS "Deny anonymous read access to newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Deny anonymous read access to newsletter_subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Staff emails: Only admins
DROP POLICY IF EXISTS "Deny anonymous read access to staff_emails" ON public.staff_emails;
CREATE POLICY "Deny anonymous read access to staff_emails" ON public.staff_emails
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- User roles: Only the user themselves or admins
DROP POLICY IF EXISTS "Deny anonymous read access to user_roles" ON public.user_roles;
CREATE POLICY "Deny anonymous read access to user_roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Notifications: Only the user themselves
DROP POLICY IF EXISTS "Deny anonymous read access to notifications" ON public.notifications;
CREATE POLICY "Deny anonymous read access to notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Staff availability: Only admins
DROP POLICY IF EXISTS "Deny anonymous read access to staff_availability" ON public.staff_availability;
CREATE POLICY "Deny anonymous read access to staff_availability" ON public.staff_availability
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Staff time off: Only admins
DROP POLICY IF EXISTS "Deny anonymous read access to staff_time_off" ON public.staff_time_off;
CREATE POLICY "Deny anonymous read access to staff_time_off" ON public.staff_time_off
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Feedback ratings policies
CREATE POLICY "Anyone can create feedback" ON public.feedback_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view feedback ratings" ON public.feedback_ratings
  FOR SELECT USING (true);

-- Email reminders: Only admins
CREATE POLICY "Admins can manage email reminders" ON public.email_reminders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow public to insert bookings (for booking form)
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Allow public to insert contact submissions
DROP POLICY IF EXISTS "Public can create contact submissions" ON public.contact_submissions;
CREATE POLICY "Public can create contact submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- Allow public to subscribe to newsletter
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);