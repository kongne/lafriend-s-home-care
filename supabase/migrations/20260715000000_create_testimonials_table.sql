-- Create testimonials table for admin-managed testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true OR is_active IS NULL);

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER set_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add testimonials permission codes
INSERT INTO public.permissions (code, name, description, module) VALUES
  ('testimonials.view', 'View Testimonials', 'View testimonials list', 'testimonials'),
  ('testimonials.manage', 'Manage Testimonials', 'Create/edit/delete testimonials', 'testimonials')
ON CONFLICT (code) DO NOTHING;

-- Assign testimonials permissions to super_admin and admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name IN ('super_admin', 'admin')
  AND p.code IN ('testimonials.view', 'testimonials.manage')
ON CONFLICT DO NOTHING;

-- Seed some initial testimonials
INSERT INTO public.testimonials (client_name, role, company, content, rating, location, sort_order, is_active) VALUES
  ('Marie Nguema', 'Propriétaire', NULL, 'Lafriend a transformé ma maison ! Le service de nettoyage est impeccable et les jardiniers sont très professionnels. Je recommande vivement.', 5, 'Bafoussam', 1, true),
  ('Paul Kamga', 'Directeur', 'Groupe Kamga Industries', 'Nous faisons appel à Lafriend pour l''entretien de nos bureaux depuis 2 ans. Une équipe fiable, ponctuelle et d''une grande efficacité.', 5, 'Douala', 2, true),
  ('Sandrine Bella', 'Gérante', 'Boutique Bella Mode', 'Le service de nettoyage profond est exceptionnel. Mes locaux n''ont jamais été aussi bien entretenus. Merci à toute l''équipe !', 5, 'Yaoundé', 3, true),
  ('Jean-Pierre Fotso', 'Chef de chantier', 'Fotso Construction', 'Partenariat solide avec Lafriend pour le nettoyage de nos chantiers. Toujours à l''heure et le travail est bien fait.', 5, 'Bafoussam', 4, true)
ON CONFLICT DO NOTHING;
