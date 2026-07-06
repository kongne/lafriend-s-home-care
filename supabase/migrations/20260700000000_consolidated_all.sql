-- =============================================================
-- CONSOLIDATED MIGRATION: All 4 migrations in one script
-- Run this entire script in Supabase Dashboard → SQL Editor
-- If any statement fails due to "already exists", it's safe to ignore
-- =============================================================

-- =============================================================
-- PART 1: 20260707000000 - Enhance before_after_projects
-- (only runs if the table exists — skip on fresh databases)
-- =============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'before_after_projects') THEN
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

    DROP POLICY IF EXISTS "Anyone can view before_after_projects" ON public.before_after_projects;
    CREATE POLICY "Anyone can view published projects"
      ON public.before_after_projects FOR SELECT
      USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

    CREATE INDEX IF NOT EXISTS idx_before_after_projects_featured
      ON public.before_after_projects(is_featured, sort_order)
      WHERE status = 'published' AND is_featured = true;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.before_after_projects;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- =============================================================
-- PART 2: 20260708000000 - Normalize projects tables
-- =============================================================
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

CREATE TABLE IF NOT EXISTS public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('before', 'after')),
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

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

DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage feedback" ON public.feedback;
CREATE POLICY "Admins manage feedback"
  ON public.feedback FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(is_featured, created_at DESC) WHERE status = 'published' AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_project_images_project ON public.project_images(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_project_images_type ON public.project_images(project_id, image_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.project_images REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.projects; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_images; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Migrate data from before_after_projects to projects (skip if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'before_after_projects') THEN
    INSERT INTO public.projects (id, title, slug, category, location, description, detail_description, duration_or_stats, stats_label, status, is_featured, completion_date, created_at, updated_at)
    SELECT
      id, title,
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
      category, location, description, detail_description, duration_or_stats, stats_label,
      COALESCE(status, 'draft'), COALESCE(is_featured, false), completion_date, created_at, updated_at
    FROM public.before_after_projects
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
    SELECT p.id, img->>'url', img->>'type', COALESCE((img->>'sort_order')::integer, 0), false
    FROM public.projects p
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE((SELECT images FROM public.before_after_projects WHERE id = p.id)::jsonb, '[]'::jsonb)
    ) AS img
    WHERE img->>'url' IS NOT NULL AND img->>'type' IN ('before', 'after')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
    SELECT p.id, b.before_image_url, 'before', 0, true
    FROM public.projects p
    JOIN public.before_after_projects b ON b.id = p.id
    WHERE b.before_image_url IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = p.id AND pi.image_type = 'before')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.project_images (project_id, image_url, image_type, display_order, is_featured)
    SELECT p.id, b.after_image_url, 'after', 0, true
    FROM public.projects p
    JOIN public.before_after_projects b ON b.id = p.id
    WHERE b.after_image_url IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.project_images pi WHERE pi.project_id = p.id AND pi.image_type = 'after')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- PART 3: 20260709000000 - Services Management
-- =============================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  banner text,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  featured_image text,
  banner_image text,
  service_icon text,
  price_type text NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'starting_from', 'hourly', 'custom_quote', 'package')),
  base_price numeric(12, 2),
  discount_price numeric(12, 2),
  currency text NOT NULL DEFAULT 'XAF',
  tax_included boolean NOT NULL DEFAULT false,
  minimum_charge numeric(12, 2),
  duration text,
  estimated_duration text,
  minimum_time text,
  maximum_time text,
  service_code text,
  featured boolean NOT NULL DEFAULT false,
  popular boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  recommended boolean NOT NULL DEFAULT false,
  seasonal_offer boolean NOT NULL DEFAULT false,
  limited_time_offer boolean NOT NULL DEFAULT false,
  is_appointment_required boolean NOT NULL DEFAULT false,
  instant_booking boolean NOT NULL DEFAULT false,
  quote_required boolean NOT NULL DEFAULT false,
  deposit_required boolean NOT NULL DEFAULT false,
  online_payment_enabled boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  keywords text,
  og_image text,
  canonical_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  total_views integer NOT NULL DEFAULT 0,
  total_bookings integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('featured', 'gallery', 'before', 'after', 'banner', 'icon')),
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  feature text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12, 2) DEFAULT 0,
  duration text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  location text NOT NULL,
  location_type text NOT NULL DEFAULT 'city' CHECK (location_type IN ('city', 'region', 'zip', 'custom')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'booking', 'inquiry', 'share')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.service_categories;
CREATE POLICY "Anyone can view active categories" ON public.service_categories FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage categories" ON public.service_categories;
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view published services" ON public.services;
CREATE POLICY "Anyone can view published services" ON public.services FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view service images" ON public.service_images;
CREATE POLICY "Anyone can view service images" ON public.service_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage service images" ON public.service_images;
CREATE POLICY "Admins manage service images" ON public.service_images FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view service features" ON public.service_features;
CREATE POLICY "Anyone can view service features" ON public.service_features FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage service features" ON public.service_features;
CREATE POLICY "Admins manage service features" ON public.service_features FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view service addons" ON public.service_addons;
CREATE POLICY "Anyone can view service addons" ON public.service_addons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage service addons" ON public.service_addons;
CREATE POLICY "Admins manage service addons" ON public.service_addons FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view service faqs" ON public.service_faqs;
CREATE POLICY "Anyone can view service faqs" ON public.service_faqs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage service faqs" ON public.service_faqs;
CREATE POLICY "Admins manage service faqs" ON public.service_faqs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view service locations" ON public.service_locations;
CREATE POLICY "Anyone can view service locations" ON public.service_locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage service locations" ON public.service_locations;
CREATE POLICY "Admins manage service locations" ON public.service_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.service_analytics;
CREATE POLICY "Anyone can insert analytics" ON public.service_analytics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view analytics" ON public.service_analytics;
CREATE POLICY "Admins view analytics" ON public.service_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(featured, popular, best_seller, recommended) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_service_images_service ON public.service_images(service_id, display_order);
CREATE INDEX IF NOT EXISTS idx_service_features_service ON public.service_features(service_id, display_order);
CREATE INDEX IF NOT EXISTS idx_service_addons_service ON public.service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_service ON public.service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_service ON public.service_locations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_analytics_service ON public.service_analytics(service_id, event_type);
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON public.service_categories(parent_id);

ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.service_categories REPLICA IDENTITY FULL;
ALTER TABLE public.service_images REPLICA IDENTITY FULL;
ALTER TABLE public.service_features REPLICA IDENTITY FULL;
ALTER TABLE public.service_addons REPLICA IDENTITY FULL;
ALTER TABLE public.service_faqs REPLICA IDENTITY FULL;
ALTER TABLE public.service_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.services; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_categories; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_images; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_features; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_addons; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_faqs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.service_locations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

INSERT INTO public.service_categories (name, slug, description, display_order, status) VALUES
  ('Nettoyage Résidentiel', 'residential', 'Services de nettoyage pour maisons et appartements', 1, 'active'),
  ('Nettoyage Commercial', 'commercial', 'Services de nettoyage pour bureaux et commerces', 2, 'active'),
  ('Nettoyage Construction', 'construction', 'Nettoyage après construction et rénovation', 3, 'active'),
  ('Nettoyage de Vitres', 'windows', 'Nettoyage professionnel de vitres et fenêtres', 4, 'active'),
  ('Nettoyage de Véhicules', 'car', 'Nettoyage intérieur et extérieur de véhicules', 5, 'active'),
  ('Nettoyage Industriel', 'industrial', 'Services de nettoyage pour environnements industriels', 6, 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (name, slug, category_id, short_description, description, price_type, base_price, duration, estimated_duration, featured, status, currency) VALUES
  ('Nettoyage Résidentiel', 'residential',
    (SELECT id FROM public.service_categories WHERE slug = 'residential' LIMIT 1),
    'Service de nettoyage complet pour votre domicile',
    'Notre service de nettoyage résidentiel offre une solution complète pour maintenir votre maison impeccable.',
    'fixed', 25000, '2-3 heures', '2-3 heures', true, 'published', 'XAF'),
  ('Nettoyage Commercial', 'commercial',
    (SELECT id FROM public.service_categories WHERE slug = 'commercial' LIMIT 1),
    'Service de nettoyage professionnel pour entreprises',
    'Solution de nettoyage adaptée aux espaces professionnels.',
    'fixed', 50000, '3-5 heures', '3-5 heures', true, 'published', 'XAF'),
  ('Nettoyage Après Construction', 'construction',
    (SELECT id FROM public.service_categories WHERE slug = 'construction' LIMIT 1),
    'Nettoyage complet après travaux et rénovation',
    'Service intensif de nettoyage post-construction.',
    'starting_from', 80000, '4-8 heures', '4-8 heures', true, 'published', 'XAF'),
  ('Nettoyage de Vitres', 'windows',
    (SELECT id FROM public.service_categories WHERE slug = 'windows' LIMIT 1),
    'Nettoyage professionnel de vitres et surfaces vitrées',
    'Service spécialisé de nettoyage de vitres.',
    'fixed', 15000, '1-2 heures', '1-2 heures', true, 'published', 'XAF'),
  ('Nettoyage de Véhicule', 'car',
    (SELECT id FROM public.service_categories WHERE slug = 'car' LIMIT 1),
    'Nettoyage intérieur et extérieur de véhicules',
    'Service de nettoyage complet pour votre véhicule.',
    'fixed', 8000, '1-2 heures', '1-2 heures', true, 'published', 'XAF')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- PART 4: 20260710000000 - Storage buckets and RPC
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects', 'projects', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
CREATE POLICY "Public can view project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'projects' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update project images" ON storage.objects;
CREATE POLICY "Admins can update project images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete project images" ON storage.objects;
CREATE POLICY "Admins can delete project images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'projects' AND public.has_role(auth.uid(), 'admin'::app_role));

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

GRANT EXECUTE ON FUNCTION public.increment_service_views(text) TO anon, authenticated;
