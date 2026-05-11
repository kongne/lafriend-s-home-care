
-- Private bucket for identity docs
INSERT INTO storage.buckets (id, name, public) VALUES ('identities', 'identities', false)
ON CONFLICT (id) DO NOTHING;

-- Table for identity documents
CREATE TABLE IF NOT EXISTS public.identity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('cni','passport')),
  front_url TEXT,
  back_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_documents_user ON public.identity_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_documents_status ON public.identity_documents(status);

ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own identity docs"
  ON public.identity_documents FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners create own identity docs"
  ON public.identity_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own pending docs"
  ON public.identity_documents FOR UPDATE
  USING ((auth.uid() = user_id AND status = 'pending') OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete identity docs"
  ON public.identity_documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_identity_documents_updated_at
  BEFORE UPDATE ON public.identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_verified flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- When admin sets status to approved, flip profile is_verified
CREATE OR REPLACE FUNCTION public.sync_profile_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE public.profiles SET is_verified = true, updated_at = now() WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_verified ON public.identity_documents;
CREATE TRIGGER trg_sync_profile_verified
  AFTER UPDATE ON public.identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verified();

-- Storage policies for identities bucket
-- Path convention: <user_id>/<filename>
CREATE POLICY "Owners read own identity files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'identities'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Owners upload identity files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'identities'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners update own identity files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'identities'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Admins delete identity files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'identities' AND has_role(auth.uid(), 'admin'::app_role));
