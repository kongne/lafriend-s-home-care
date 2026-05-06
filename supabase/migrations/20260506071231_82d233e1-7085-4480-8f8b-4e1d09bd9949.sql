
-- ============ CHAT HUB ============
CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','group','booking','support')),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_rooms_booking ON public.chat_rooms(booking_id);

CREATE TABLE public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin','staff','client')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(room_id, user_id)
);
CREATE INDEX idx_chat_participants_room ON public.chat_participants(room_id);
CREATE INDEX idx_chat_participants_user ON public.chat_participants(user_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','file','video','audio','system')),
  media_url text,
  media_metadata jsonb DEFAULT '{}'::jsonb,
  parent_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_edited boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);

CREATE TABLE public.chat_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- security definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_room_participant(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.chat_participants WHERE room_id = _room_id AND user_id = _user_id);
$$;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- chat_rooms policies
CREATE POLICY "Participants can view their rooms" ON public.chat_rooms
  FOR SELECT USING (public.is_room_participant(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "Admins manage rooms" ON public.chat_rooms
  FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- chat_participants policies
CREATE POLICY "View participants of own rooms" ON public.chat_participants
  FOR SELECT USING (public.is_room_participant(room_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self or admin can join" ON public.chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self can update read state" ON public.chat_participants
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self or admin can leave" ON public.chat_participants
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- chat_messages policies
CREATE POLICY "Participants can read messages" ON public.chat_messages
  FOR SELECT USING (public.is_room_participant(room_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Participants can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_room_participant(room_id, auth.uid()));
CREATE POLICY "Authors can update own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors or admins delete" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- read receipts
CREATE POLICY "Participants insert own receipts" ON public.chat_read_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants view receipts" ON public.chat_read_receipts
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  category text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() IS NULL);

-- ============ LOYALTY REDEEM AT CHECKOUT ============
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS points_redeemed integer NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.redeem_points_for_booking(
  p_user_id uuid, p_booking_id uuid, p_points integer
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance integer;
  v_discount numeric;
BEGIN
  IF p_points <= 0 THEN RAISE EXCEPTION 'Invalid points'; END IF;
  SELECT COALESCE(loyalty_points,0) INTO v_balance FROM profiles WHERE user_id = p_user_id;
  IF v_balance < p_points THEN RAISE EXCEPTION 'Insufficient points'; END IF;

  -- 100 pts = 1000 FCFA discount (1 pt = 10 FCFA)
  v_discount := p_points * 10;

  UPDATE bookings
    SET points_redeemed = COALESCE(points_redeemed,0) + p_points,
        discount_amount = COALESCE(discount_amount,0) + v_discount,
        updated_at = now()
  WHERE id = p_booking_id AND user_id = p_user_id;

  PERFORM add_loyalty_points(p_user_id, -p_points, 'redeem', 'Réduction sur réservation', p_booking_id);
  RETURN v_discount::integer;
END;
$$;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-attachments','chat-attachments', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/webm','audio/mpeg','audio/wav','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read chat attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Authenticated upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner can delete attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
