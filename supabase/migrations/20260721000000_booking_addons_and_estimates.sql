-- ============================================================
-- Add estimated_price and selected_addons to bookings
-- Also formalize distance_km, latitude, longitude columns
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude TEXT,
  ADD COLUMN IF NOT EXISTS longitude TEXT;
