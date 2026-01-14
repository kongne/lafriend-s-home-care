-- Create feedback and ratings table
CREATE TABLE public.feedback_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  cleanliness_rating INTEGER CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5)),
  punctuality_rating INTEGER CHECK (punctuality_rating IS NULL OR (punctuality_rating >= 1 AND punctuality_rating <= 5)),
  professionalism_rating INTEGER CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5)),
  is_verified_booking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_feedback_booking ON public.feedback_ratings(booking_id);
CREATE INDEX idx_feedback_user ON public.feedback_ratings(user_id);
CREATE INDEX idx_feedback_created ON public.feedback_ratings(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback_ratings ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can view feedback for completed services"
  ON public.feedback_ratings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT user_id FROM public.bookings WHERE id = booking_id
    )
    OR true  -- Allow public viewing of all feedback
  );

CREATE POLICY "Users can submit feedback for their bookings"
  ON public.feedback_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (auth.uid() IN (SELECT user_id FROM public.bookings WHERE id = booking_id))
  );

CREATE POLICY "Users can update their own feedback"
  ON public.feedback_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create email reminders tracking table
CREATE TABLE public.email_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT '24hours',  -- Can be: 24hours, 48hours, etc
  scheduled_send_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, failed
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_email_reminders_status ON public.email_reminders(status, scheduled_send_time);
CREATE INDEX idx_email_reminders_booking ON public.email_reminders(booking_id);
CREATE INDEX idx_email_reminders_scheduled ON public.email_reminders(scheduled_send_time);

-- Enable RLS
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- Email reminders policies (admin only)
CREATE POLICY "Only admins can view email reminders"
  ON public.email_reminders FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND has_role(auth.uid(), 'admin'::app_role)
    )
  );
