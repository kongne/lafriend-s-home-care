
-- 1. BOOKINGS: trigger to prevent customers from changing sensitive fields
CREATE OR REPLACE FUNCTION public.protect_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can update anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-admin updates: lock sensitive fields to their previous values
  NEW.status            := OLD.status;
  NEW.discount_amount   := OLD.discount_amount;
  NEW.points_redeemed   := OLD.points_redeemed;
  NEW.assigned_staff_id := OLD.assigned_staff_id;
  NEW.is_recurring      := OLD.is_recurring;
  NEW.user_id           := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_booking_sensitive_fields ON public.bookings;
CREATE TRIGGER trg_protect_booking_sensitive_fields
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_sensitive_fields();

-- Add a WITH CHECK to the user-update policy so user_id can't be flipped
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. PROFILES: trigger to prevent customers from boosting loyalty / verification
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.loyalty_points := OLD.loyalty_points;
  NEW.loyalty_tier   := OLD.loyalty_tier;
  NEW.total_spent    := OLD.total_spent;
  NEW.is_verified    := OLD.is_verified;
  NEW.user_id        := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. CUSTOMER_REWARDS: remove open INSERT, redemptions go through SECURITY DEFINER fn
DROP POLICY IF EXISTS "Users can redeem rewards" ON public.customer_rewards;

-- 4. NEWSLETTER_SUBSCRIBERS: tie updates to the authenticated user's verified email
DROP POLICY IF EXISTS "Subscribers can update their own subscription" ON public.newsletter_subscribers;
CREATE POLICY "Subscribers can update their own subscription"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND email = auth.email())
  WITH CHECK (auth.uid() IS NOT NULL AND email = auth.email());

-- 5. USER_ROLES: explicit RESTRICTIVE policy so only admins can write roles
CREATE POLICY "Only admins can write user roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
