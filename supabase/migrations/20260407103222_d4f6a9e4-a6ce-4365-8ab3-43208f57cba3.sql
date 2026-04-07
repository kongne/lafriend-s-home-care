
-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own bookings (only pending ones)
CREATE POLICY "Users can delete own pending bookings"
ON public.bookings FOR DELETE
TO public
USING (auth.uid() = user_id AND status = 'pending');

-- Allow admins to delete contact submissions
CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own contact submissions
CREATE POLICY "Users can delete own contact submissions"
ON public.contact_submissions FOR DELETE
TO public
USING (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id);
