-- Schema Migration: CMS Reviews & Projects Extensions
-- Date: 2026-07-06

-- 1. Extend public.reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Add foreign key constraint to bookings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_reviews_booking' AND table_name = 'reviews'
  ) THEN
    ALTER TABLE public.reviews 
      ADD CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Update SELECT policy for reviews to ensure public only sees approved ones
DROP POLICY IF EXISTS "Anyone can view public reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Create public.before_after_projects table
CREATE TABLE IF NOT EXISTS public.before_after_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  before_image_url text NOT NULL,
  after_image_url text NOT NULL,
  duration_or_stats text,
  stats_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Re-enable RLS on the new table
ALTER TABLE public.before_after_projects ENABLE ROW LEVEL SECURITY;

-- Policies for before_after_projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.before_after_projects;
CREATE POLICY "Anyone can view projects"
  ON public.before_after_projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage projects" ON public.before_after_projects;
CREATE POLICY "Admins manage projects"
  ON public.before_after_projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_before_after_projects_created_at ON public.before_after_projects(created_at DESC);

-- Enable update trigger for updated_at column
CREATE OR REPLACE TRIGGER before_after_projects_updated_at
  BEFORE UPDATE ON public.before_after_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the new projects table
ALTER TABLE public.before_after_projects REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.before_after_projects; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 4. Set up projects storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('projects', 'projects', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Bucket policies
DROP POLICY IF EXISTS "Public read projects" ON storage.objects;
CREATE POLICY "Public read projects" ON storage.objects
  FOR SELECT USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Admins upload projects" ON storage.objects;
CREATE POLICY "Admins upload projects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete projects" ON storage.objects;
CREATE POLICY "Admins delete projects" ON storage.objects
  FOR DELETE USING (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update projects" ON storage.objects;
CREATE POLICY "Admins update projects" ON storage.objects
  FOR UPDATE USING (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'::app_role));
