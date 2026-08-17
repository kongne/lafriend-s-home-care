-- ============================================================
-- WEBHOOK SYSTEM
-- Adds outbound webhook infrastructure: endpoints, events,
-- deliveries, DB triggers for automatic event generation,
-- and RBAC permissions.
-- ============================================================

-- ============================================================
-- 1. WEBHOOK ENDPOINTS
-- Where outbound webhooks are delivered.
-- ============================================================
CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhook_endpoints_active ON public.webhook_endpoints(is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_endpoints_events ON public.webhook_endpoints USING GIN(events);

CREATE TRIGGER trg_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. WEBHOOK EVENTS
-- Queue of events to be dispatched.
-- ============================================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'app',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhook_events_status ON public.webhook_events(status, created_at)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_webhook_events_type ON public.webhook_events(event_type, created_at DESC);
CREATE INDEX idx_webhook_events_created ON public.webhook_events(created_at DESC);

-- ============================================================
-- 3. WEBHOOK DELIVERIES
-- One record per endpoint per event dispatch attempt.
-- ============================================================
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhook_deliveries_event ON public.webhook_deliveries(event_id);
CREATE INDEX idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status)
  WHERE status IN ('pending', 'retrying');

-- Idempotency: prevent duplicate deliveries per event+endpoint
CREATE UNIQUE INDEX idx_webhook_deliveries_unique
  ON public.webhook_deliveries(event_id, endpoint_id, attempt_number);

-- ============================================================
-- 4. RBAC PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (code, name, description, module) VALUES
  ('webhooks.view', 'View Webhooks', 'View webhook endpoints, events, and deliveries', 'webhooks'),
  ('webhooks.manage', 'Manage Webhooks', 'Create, edit, and delete webhook endpoints', 'webhooks'),
  ('webhooks.test', 'Test Webhooks', 'Send test webhook events', 'webhooks'),
  ('webhooks.retry', 'Retry Webhooks', 'Retry failed webhook deliveries', 'webhooks')
ON CONFLICT (code) DO NOTHING;

-- Assign webhook permissions to super_admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
  AND p.code IN ('webhooks.view', 'webhooks.manage', 'webhooks.test', 'webhooks.retry')
ON CONFLICT DO NOTHING;

-- Assign webhook.view to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND p.code IN ('webhooks.view')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. RLS POLICIES
-- Only admins can access webhook tables.
-- ============================================================

-- webhook_endpoints: admin-only
CREATE POLICY "Admins can view webhook endpoints"
  ON public.webhook_endpoints FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert webhook endpoints"
  ON public.webhook_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhook endpoints"
  ON public.webhook_endpoints FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webhook endpoints"
  ON public.webhook_endpoints FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- webhook_events: admin-only for SELECT; service_role inserts
CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhook events"
  ON public.webhook_events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- webhook_deliveries: admin-only
CREATE POLICY "Admins can view webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert webhook deliveries"
  ON public.webhook_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhook deliveries"
  ON public.webhook_deliveries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. DB TRIGGERS — Automatic event generation
-- Inserts into webhook_events when key business events happen.
-- ============================================================

-- Function: insert a webhook event
CREATE OR REPLACE FUNCTION public.emit_webhook_event(
  _event_type TEXT,
  _source TEXT,
  _payload JSONB
) RETURNS UUID AS $$
DECLARE
  _event_id UUID;
BEGIN
  INSERT INTO public.webhook_events (event_type, source, payload)
  VALUES (_event_type, _source, _payload)
  RETURNING id INTO _event_id;

  RETURN _event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: booking created
CREATE OR REPLACE FUNCTION public.webhook_on_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.emit_webhook_event(
    'booking.created',
    'db_trigger',
    jsonb_build_object(
      'id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'address', NEW.address,
      'service_type', NEW.service_type,
      'preferred_date', NEW.preferred_date,
      'preferred_time', NEW.preferred_time,
      'status', NEW.status,
      'estimated_price', NEW.estimated_price,
      'selected_addons', NEW.selected_addons,
      'distance_km', NEW.distance_km,
      'is_recurring', NEW.is_recurring,
      'recurrence_type', NEW.recurrence_type,
      'user_id', NEW.user_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_booking_created();

-- Trigger: booking status changed
CREATE OR REPLACE FUNCTION public.webhook_on_booking_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.emit_webhook_event(
      'booking.status_changed',
      'db_trigger',
      jsonb_build_object(
        'id', NEW.id,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'service_type', NEW.service_type,
        'preferred_date', NEW.preferred_date,
        'preferred_time', NEW.preferred_time,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'estimated_price', NEW.estimated_price,
        'user_id', NEW.user_id,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_booking_status_changed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_booking_status_changed();

-- Trigger: contact submission created
CREATE OR REPLACE FUNCTION public.webhook_on_contact_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.emit_webhook_event(
    'contact.created',
    'db_trigger',
    jsonb_build_object(
      'id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'subject', NEW.subject,
      'message', NEW.message,
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_contact_created
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_contact_created();

-- Trigger: review submitted
CREATE OR REPLACE FUNCTION public.webhook_on_review_submitted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.emit_webhook_event(
    'review.submitted',
    'db_trigger',
    jsonb_build_object(
      'id', NEW.id,
      'booking_id', NEW.booking_id,
      'user_id', NEW.user_id,
      'rating', NEW.rating,
      'comment', NEW.comment,
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_review_submitted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_review_submitted();

-- Trigger: KYC decision (approval/rejection)
CREATE OR REPLACE FUNCTION public.webhook_on_kyc_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    PERFORM public.emit_webhook_event(
      'kyc.' || NEW.status,
      'db_trigger',
      jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'doc_type', NEW.doc_type,
        'status', NEW.status,
        'rejection_reason', NEW.rejection_reason,
        'reviewed_at', NEW.reviewed_at,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_kyc_decision
  AFTER UPDATE ON public.identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_kyc_decision();

-- Trigger: user registered (new profile created)
CREATE OR REPLACE FUNCTION public.webhook_on_user_registered()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.emit_webhook_event(
    'user.registered',
    'db_trigger',
    jsonb_build_object(
      'user_id', NEW.user_id,
      'full_name', NEW.full_name,
      'phone', NEW.phone,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_webhook_user_registered
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.webhook_on_user_registered();
