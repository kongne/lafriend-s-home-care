
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  icon TEXT,
  background_color TEXT NOT NULL DEFAULT 'bg-primary',
  text_color TEXT NOT NULL DEFAULT 'text-primary-foreground',
  link_url TEXT,
  link_text TEXT,
  show_countdown BOOLEAN NOT NULL DEFAULT false,
  countdown_ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  dismissible BOOLEAN NOT NULL DEFAULT true,
  display_pages TEXT[],
  target_countries TEXT[],
  target_languages TEXT[],
  target_users TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND status = 'active'
    AND starts_at <= now()
    AND ends_at >= now()
  );

CREATE POLICY "Admins can view all announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
