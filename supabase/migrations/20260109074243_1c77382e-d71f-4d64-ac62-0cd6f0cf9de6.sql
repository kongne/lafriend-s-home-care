-- Add recurring booking support columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type text CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS parent_booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Create index for faster recurring booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON public.bookings(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_recurring ON public.bookings(is_recurring) WHERE is_recurring = true;