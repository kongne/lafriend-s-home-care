-- Add UPDATE policy for newsletter subscribers to update their own subscription
CREATE POLICY "Subscribers can update their own subscription" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Add DELETE policy for profiles (admin only)
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing overly permissive bookings policies if any anonymous access
-- Then recreate with proper restrictions

-- Add a SELECT policy restricting anonymous users from viewing bookings
-- This ensures only authenticated users can view their own bookings
CREATE POLICY "Authenticated users can view their own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for bookings and contact_submissions tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;