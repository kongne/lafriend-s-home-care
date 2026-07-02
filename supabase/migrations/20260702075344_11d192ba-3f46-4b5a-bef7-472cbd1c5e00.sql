-- Restrict Realtime channel subscriptions to authorized participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own room broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send to own rooms" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read own presence" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write own presence" ON realtime.messages;

-- Helper: extract UUID from "room:<uuid>" topic and check participation
CREATE POLICY "Room participants can read realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'room:%'
    AND public.is_room_participant(
      NULLIF(substring(realtime.topic() FROM 6), '')::uuid,
      auth.uid()
    ))
);

CREATE POLICY "Room participants can write realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'room:%'
    AND public.is_room_participant(
      NULLIF(substring(realtime.topic() FROM 6), '')::uuid,
      auth.uid()
    ))
);
