-- Create storage bucket for backup files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 524288000, ARRAY['application/json', 'application/gzip', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for backups bucket
DROP POLICY IF EXISTS "Admins read backups" ON storage.objects;
CREATE POLICY "Admins read backups" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins upload backups" ON storage.objects;
CREATE POLICY "Admins upload backups" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins delete backups" ON storage.objects;
CREATE POLICY "Admins delete backups" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );
