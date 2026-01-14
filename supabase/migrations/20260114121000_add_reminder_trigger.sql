-- Add trigger to automatically create email reminders when bookings are created
CREATE OR REPLACE FUNCTION public.create_email_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only create reminder if appointment date is in the future
  v_reminder_time := (NEW.preferred_date || ' ' || NEW.preferred_time)::TIMESTAMP 
                      - INTERVAL '24 hours';
  
  IF v_reminder_time > now() THEN
    INSERT INTO public.email_reminders (
      booking_id,
      email,
      reminder_type,
      scheduled_send_time,
      status
    ) VALUES (
      NEW.id,
      NEW.email,
      '24hours',
      v_reminder_time,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_create_email_reminder ON public.bookings;
CREATE TRIGGER trigger_create_email_reminder
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.create_email_reminder();

-- Add columns to bookings table if they don't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;

-- Add column to contact_submissions if it doesn't exist
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;
