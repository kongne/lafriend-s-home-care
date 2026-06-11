
-- 1) Audit table for KYC decisions
CREATE TABLE public.kyc_decision_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_document_id UUID NOT NULL REFERENCES public.identity_documents(id) ON DELETE CASCADE,
  subject_user_id UUID NOT NULL,
  decided_by UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  rejection_reason TEXT,
  recipient_email TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending','sent','skipped_no_email','failed')),
  email_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.kyc_decision_audit TO authenticated;
GRANT ALL ON public.kyc_decision_audit TO service_role;

ALTER TABLE public.kyc_decision_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read kyc audit"
  ON public.kyc_decision_audit FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert kyc audit"
  ON public.kyc_decision_audit FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND decided_by = auth.uid());

CREATE POLICY "Admins update kyc audit"
  ON public.kyc_decision_audit FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_kyc_decision_audit_updated_at
  BEFORE UPDATE ON public.kyc_decision_audit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_kyc_decision_audit_doc ON public.kyc_decision_audit(identity_document_id);
CREATE INDEX idx_kyc_decision_audit_created ON public.kyc_decision_audit(created_at DESC);

-- 2) Admin-only email lookup helper (security definer reads auth.users)
CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_email(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(UUID) TO authenticated;
