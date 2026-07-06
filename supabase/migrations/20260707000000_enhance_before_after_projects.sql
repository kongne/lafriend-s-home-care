-- Enhance before_after_projects table with full CMS features

ALTER TABLE public.before_after_projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS detail_description text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS completion_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_image_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies for new status/featured handling
DROP POLICY IF EXISTS "Anyone can view before_after_projects" ON public.before_after_projects;
CREATE POLICY "Anyone can view published projects"
  ON public.before_after_projects FOR SELECT
  USING (
    status = 'published' OR
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Add index for featured + published queries
CREATE INDEX IF NOT EXISTS idx_before_after_projects_featured
  ON public.before_after_projects(is_featured, sort_order)
  WHERE status = 'published' AND is_featured = true;

-- Update realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.before_after_projects;
