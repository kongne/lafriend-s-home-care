-- Services Management: Complete CMS tables
-- Date: 2026-07-09

-- 1. Service categories table (self-referencing for nested categories)
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

-- 2. Services table
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

-- 3. Service images table
CREATE TABLE IF NOT EXISTS public.service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('featured', 'gallery', 'before', 'after', 'banner', 'icon')),
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Service features table
CREATE TABLE IF NOT EXISTS public.service_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  feature text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Service add-ons table
CREATE TABLE IF NOT EXISTS public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12, 2) DEFAULT 0,
  duration text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Service FAQs table
CREATE TABLE IF NOT EXISTS public.service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Service locations table
CREATE TABLE IF NOT EXISTS public.service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  location text NOT NULL,
  location_type text NOT NULL DEFAULT 'city' CHECK (location_type IN ('city', 'region', 'zip', 'custom')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Service analytics tracking
CREATE TABLE IF NOT EXISTS public.service_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'booking', 'inquiry', 'share')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies: public can read published services, admins can manage all
CREATE POLICY "Anyone can view active categories" ON public.service_categories FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published services" ON public.services FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view service images" ON public.service_images FOR SELECT USING (true);
CREATE POLICY "Admins manage service images" ON public.service_images FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view service features" ON public.service_features FOR SELECT USING (true);
CREATE POLICY "Admins manage service features" ON public.service_features FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view service addons" ON public.service_addons FOR SELECT USING (true);
CREATE POLICY "Admins manage service addons" ON public.service_addons FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view service faqs" ON public.service_faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage service faqs" ON public.service_faqs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view service locations" ON public.service_locations FOR SELECT USING (true);
CREATE POLICY "Admins manage service locations" ON public.service_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics" ON public.service_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view analytics" ON public.service_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes
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

-- Realtime
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

-- Insert default categories
INSERT INTO public.service_categories (name, slug, description, display_order, status) VALUES
  ('Nettoyage Résidentiel', 'residential', 'Services de nettoyage pour maisons et appartements', 1, 'active'),
  ('Nettoyage Commercial', 'commercial', 'Services de nettoyage pour bureaux et commerces', 2, 'active'),
  ('Nettoyage Construction', 'construction', 'Nettoyage après construction et rénovation', 3, 'active'),
  ('Nettoyage de Vitres', 'windows', 'Nettoyage professionnel de vitres et fenêtres', 4, 'active'),
  ('Nettoyage de Véhicules', 'car', 'Nettoyage intérieur et extérieur de véhicules', 5, 'active'),
  ('Nettoyage Industriel', 'industrial', 'Services de nettoyage pour environnements industriels', 6, 'active')
ON CONFLICT (slug) DO NOTHING;

-- Insert default services from existing hardcoded data
INSERT INTO public.services (name, slug, category_id, short_description, description, price_type, base_price, duration, estimated_duration, featured, status, currency) VALUES
  (
    'Nettoyage Résidentiel',
    'residential',
    (SELECT id FROM public.service_categories WHERE slug = 'residential' LIMIT 1),
    'Service de nettoyage complet pour votre domicile',
    'Notre service de nettoyage résidentiel offre une solution complète pour maintenir votre maison impeccable. Nous utilisons des produits écologiques et des équipements professionnels pour garantir des résultats exceptionnels.',
    'fixed', 25000, '2-3 heures', '2-3 heures', true, 'published', 'XAF'
  ),
  (
    'Nettoyage Commercial',
    'commercial',
    (SELECT id FROM public.service_categories WHERE slug = 'commercial' LIMIT 1),
    'Service de nettoyage professionnel pour entreprises',
    'Solution de nettoyage adaptée aux espaces professionnels. Nos équipes interviennent selon vos horaires d''ouverture pour minimiser les perturbations.',
    'fixed', 50000, '3-5 heures', '3-5 heures', true, 'published', 'XAF'
  ),
  (
    'Nettoyage Après Construction',
    'construction',
    (SELECT id FROM public.service_categories WHERE slug = 'construction' LIMIT 1),
    'Nettoyage complet après travaux et rénovation',
    'Service intensif de nettoyage post-construction. Nous éliminons la poussière, les débris et les résidus de chantier pour rendre votre espace prêt à l''utilisation.',
    'starting_from', 80000, '4-8 heures', '4-8 heures', true, 'published', 'XAF'
  ),
  (
    'Nettoyage de Vitres',
    'windows',
    (SELECT id FROM public.service_categories WHERE slug = 'windows' LIMIT 1),
    'Nettoyage professionnel de vitres et surfaces vitrées',
    'Service spécialisé de nettoyage de vitres pour particuliers et professionnels. Résultats sans traces garantis.',
    'fixed', 15000, '1-2 heures', '1-2 heures', true, 'published', 'XAF'
  ),
  (
    'Nettoyage de Véhicule',
    'car',
    (SELECT id FROM public.service_categories WHERE slug = 'car' LIMIT 1),
    'Nettoyage intérieur et extérieur de véhicules',
    'Service de nettoyage complet pour votre véhicule. Lavage extérieur, aspiration intérieure, nettoyage des sièges et tableau de bord.',
    'fixed', 8000, '1-2 heures', '1-2 heures', true, 'published', 'XAF'
  )
ON CONFLICT (slug) DO NOTHING;
