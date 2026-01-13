-- Create staff members table for cleaner management
CREATE TABLE public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  photo_url TEXT,
  specializations TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff availability table
CREATE TABLE public.staff_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create staff time off table for vacations/sick days
CREATE TABLE public.staff_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Add assigned_staff_id to bookings table
ALTER TABLE public.bookings 
ADD COLUMN assigned_staff_id UUID REFERENCES public.staff_members(id);

-- Enable RLS on all new tables
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;

-- Staff members policies (admin only for management, public for viewing assigned staff)
CREATE POLICY "Admins can manage staff members"
ON public.staff_members FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active staff"
ON public.staff_members FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Deny anonymous access to staff_members"
ON public.staff_members FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Staff availability policies
CREATE POLICY "Admins can manage staff availability"
ON public.staff_availability FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view staff availability"
ON public.staff_availability FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous access to staff_availability"
ON public.staff_availability FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Staff time off policies
CREATE POLICY "Admins can manage staff time off"
ON public.staff_time_off FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view staff time off"
ON public.staff_time_off FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous access to staff_time_off"
ON public.staff_time_off FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updating staff_members.updated_at
CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster availability lookups
CREATE INDEX idx_staff_availability_staff_day ON public.staff_availability(staff_id, day_of_week);
CREATE INDEX idx_staff_time_off_dates ON public.staff_time_off(staff_id, start_date, end_date);
CREATE INDEX idx_bookings_assigned_staff ON public.bookings(assigned_staff_id);