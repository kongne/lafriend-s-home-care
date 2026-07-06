-- Normalize projects, project_images, and feedback tables
-- Date: 2026-07-08

-- 1. Create projects table (normalized, replacing before_after_projects as primary)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  location text,
  description text,
  detail_description text,
  duration_or_stats text,
  stats_label text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  completion_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create project_images table
CREATE TABLE IF NOT EXISTS public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('before', 'after')),
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  service text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for projects
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS policies for project_images
DROP POLICY IF EXISTS "Anyone can view project images" ON public.project_images;
CREATE POLICY "Anyone can view project images"
  ON public.project_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_images.project_id
      AND (projects.status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

DROP POLICY IF EXISTS "Admins manage project images" ON public.project_images;
CREATE POLICY "Admins manage project images"
  ON public.project_images FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS policies for feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage feedback" ON public.feedback;
CREATE POLICY "Admins manage feedback"
  ON public.feedback FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(is_featured, created_at DESC) WHERE status = 'published' AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_project_images_project ON public.project_images(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_project_images_type ON public.project_images(project_id, image_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- 9. Enable realtime
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.project_images REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.projects; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_images; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 10. Migrate data from before_after_projects to projects
INSERT INTO public.projects (id, title, slug, category, location, description, detail_description, duration_or_stats, stats_label, status, is_featured, completion_date, created_at, updated_at)
SELECT
  id,
  title,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
  category,
  location,
  description,
  detail_description,
  duration_or_stats,
  stats_label,
  COALESCE(status, 'draft'),
  COALESCE(is_featured, false),
  completion_date,
  created_at,
  updated_at
FROM public.before_after_projects
ON CONFLICT (id) DO NOTHING;

-- 11. Migrate images from before_after_projects.images JSONB and legacy columns to project_images
INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
SELECT
  p.id,
  img->>'url',
  img->>'type',
  COALESCE((img->>'sort_order')::integer, 0),
  false
FROM public.projects p
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE((SELECT images FROM public.before_after_projects WHERE id = p.id)::jsonb, '[]'::jsonb)
) AS img
WHERE img->>'url' IS NOT NULL AND img->>'type' IN ('before', 'after')
ON CONFLICT DO NOTHING;

-- Also migrate legacy before_image_url / after_image_url if they exist and no project_images exist for this project
INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
SELECT
  p.id,
  b.before_image_url,
  'before',
  0,
  true
FROM public.projects p
JOIN public.before_after_projects b ON b.id = p.id
WHERE b.before_image_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = p.id AND pi.image_type = 'before')
ON CONFLICT DO NOTHING;

INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
SELECT
  p.id,
  b.after_image_url,
  'after',
  0,
  true
FROM public.projects p
JOIN public.before_after_projects b ON b.id = p.id
WHERE b.after_image_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = p.id AND pi.image_type = 'after')
ON CONFLICT DO NOTHING;

-- 12. Create trigger for updated_at
CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
