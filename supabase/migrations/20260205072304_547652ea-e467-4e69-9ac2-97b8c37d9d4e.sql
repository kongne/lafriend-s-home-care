-- Create trigger function to automatically create email reminders when booking is confirmed
CREATE OR REPLACE FUNCTION public.create_booking_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appointment_datetime TIMESTAMP WITH TIME ZONE;
  v_reminder_24h TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only create reminder when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Calculate appointment datetime (combine date and time)
    v_appointment_datetime := (NEW.preferred_date || ' ' || NEW.preferred_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Calculate 24 hours before appointment
    v_reminder_24h := v_appointment_datetime - INTERVAL '24 hours';
    
    -- Only create reminder if it's in the future
    IF v_reminder_24h > NOW() THEN
      -- Check if reminder already exists for this booking
      IF NOT EXISTS (
        SELECT 1 FROM email_reminders 
        WHERE booking_id = NEW.id 
        AND reminder_type = '24hours'
        AND status != 'cancelled'
      ) THEN
        -- Insert 24-hour reminder
        INSERT INTO email_reminders (
          booking_id,
          email,
          reminder_type,
          scheduled_send_time,
          status
        ) VALUES (
          NEW.id,
          NEW.email,
          '24hours',
          v_reminder_24h,
          'pending'
        );
        
        RAISE LOG 'Created 24-hour reminder for booking %', NEW.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_create_booking_reminder ON bookings;
CREATE TRIGGER trigger_create_booking_reminder
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_reminder();

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.create_booking_reminder() IS 
'Automatically creates a 24-hour email reminder when a booking is confirmed';