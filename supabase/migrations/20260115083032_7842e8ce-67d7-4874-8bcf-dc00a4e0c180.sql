-- Clean up and consolidate RLS policies

-- ==========================================
-- BOOKINGS TABLE: Clean up overlapping policies
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous read access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can view their own bookings or admins all" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Single consolidated SELECT policy
CREATE POLICY "Users view own bookings or admins view all" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- CONTACT_SUBMISSIONS TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.contact_submissions;
DROP POLICY IF EXISTS "Deny anonymous read access to contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.contact_submissions;

CREATE POLICY "Select contact submissions" ON public.contact_submissions
  FOR SELECT USING (
    (auth.uid() = user_id) 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- PROFILES TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Select profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- NOTIFICATIONS TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.notifications;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.notifications;
DROP POLICY IF EXISTS "Deny anonymous read access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Select notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- STAFF_MEMBERS TABLE: Clean up + restrict
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.staff_members;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.staff_members;
DROP POLICY IF EXISTS "Deny anonymous read access to staff_members" ON public.staff_members;
DROP POLICY IF EXISTS "Admins can manage staff members" ON public.staff_members;
DROP POLICY IF EXISTS "Customers can view assigned staff name" ON public.staff_members;
DROP POLICY IF EXISTS "Only admins can view full staff details" ON public.staff_members;

-- Only admins can view staff members
CREATE POLICY "Admins select staff" ON public.staff_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage staff" ON public.staff_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- STAFF_EMAILS TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.staff_emails;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.staff_emails;
DROP POLICY IF EXISTS "Deny anonymous read access to staff_emails" ON public.staff_emails;
DROP POLICY IF EXISTS "Admins can manage staff emails" ON public.staff_emails;

CREATE POLICY "Admins manage staff emails" ON public.staff_emails
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- NEWSLETTER_SUBSCRIBERS TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Block anonymous and allow only admins" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Deny anonymous read access to newsletter_subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Admins select subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- USER_ROLES TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous read access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Select user roles" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- STAFF_AVAILABILITY TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.staff_availability;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.staff_availability;
DROP POLICY IF EXISTS "Deny anonymous read access to staff_availability" ON public.staff_availability;
DROP POLICY IF EXISTS "Admins can manage staff availability" ON public.staff_availability;
DROP POLICY IF EXISTS "Authenticated users can view staff availability" ON public.staff_availability;

CREATE POLICY "Admins manage availability" ON public.staff_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- STAFF_TIME_OFF TABLE: Clean up
-- ==========================================
DROP POLICY IF EXISTS "Deny anonymous access" ON public.staff_time_off;
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.staff_time_off;
DROP POLICY IF EXISTS "Deny anonymous read access to staff_time_off" ON public.staff_time_off;
DROP POLICY IF EXISTS "Admins can manage staff time off" ON public.staff_time_off;
DROP POLICY IF EXISTS "Authenticated users can view staff time off" ON public.staff_time_off;

CREATE POLICY "Admins manage time off" ON public.staff_time_off
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- FEEDBACK_RATINGS TABLE: Restrict access
-- ==========================================
DROP POLICY IF EXISTS "Public can view feedback ratings" ON public.feedback_ratings;
DROP POLICY IF EXISTS "Anyone can create feedback" ON public.feedback_ratings;

-- Only authenticated users can submit and view feedback
CREATE POLICY "Authenticated can create feedback" ON public.feedback_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can view feedback" ON public.feedback_ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ==========================================
-- EMAIL_REMINDERS TABLE: Explicit policies
-- ==========================================
DROP POLICY IF EXISTS "Admins can manage email reminders" ON public.email_reminders;

CREATE POLICY "Admins select reminders" ON public.email_reminders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert reminders" ON public.email_reminders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins update reminders" ON public.email_reminders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins delete reminders" ON public.email_reminders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );