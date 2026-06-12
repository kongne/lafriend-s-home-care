-- 1. UPDATE policy mirror for chat-attachments storage bucket
DROP POLICY IF EXISTS "Users can update own chat attachments" ON storage.objects;
CREATE POLICY "Users can update own chat attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2. Lock audit_logs INSERT to service_role only (drop admin insert policy
--    and revoke INSERT grant from authenticated to prevent any client-side forgery).
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;
REVOKE INSERT ON public.audit_logs FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM anon;
-- service_role bypasses RLS; no policy needed for it.