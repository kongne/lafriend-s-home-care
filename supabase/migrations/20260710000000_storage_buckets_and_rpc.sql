-- Create storage buckets for admin image uploads
-- Requires: supabase storage bucket management via SQL

-- 1. Create "projects" bucket for project and service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects',
  'projects',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 2. Storage RLS policies
-- Public can view any file
DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
CREATE POLICY "Public can view project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'projects');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
  );

-- Admins can update/delete
DROP POLICY IF EXISTS "Admins can update project images" ON storage.objects;
CREATE POLICY "Admins can update project images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'projects'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete project images" ON storage.objects;
CREATE POLICY "Admins can delete project images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'projects'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Create RPC function for incrementing service views
CREATE OR REPLACE FUNCTION public.increment_service_views(service_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.services
  SET total_views = COALESCE(total_views, 0) + 1
  WHERE slug = service_slug;
END;
$$;

-- 4. Grant execution to public (for guest view tracking)
GRANT EXECUTE ON FUNCTION public.increment_service_views(text) TO anon, authenticated;
