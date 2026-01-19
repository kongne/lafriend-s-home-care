-- Create loyalty_transactions table to track all point transactions
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem', 'bonus', 'expire', 'tier_upgrade'
  points INTEGER NOT NULL, -- positive for earn, negative for redeem
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_rewards table to define available rewards
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'discount_percent', 'discount_fixed', 'free_service', 'gift'
  reward_value NUMERIC, -- percentage or fixed amount
  service_type TEXT, -- null for all services, or specific service
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_days INTEGER DEFAULT 30, -- days until reward expires after redemption
  max_redemptions INTEGER, -- null for unlimited
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_rewards table to track redeemed rewards
CREATE TABLE public.customer_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.loyalty_transactions(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL, -- booking where reward was used
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_rewards ENABLE ROW LEVEL SECURITY;

-- Loyalty transactions policies
CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.loyalty_transactions
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only system can insert transactions (via functions)"
ON public.loyalty_transactions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Loyalty rewards policies (all users can view available rewards)
CREATE POLICY "Anyone can view active rewards"
ON public.loyalty_rewards
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
ON public.loyalty_rewards
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'));

-- Customer rewards policies
CREATE POLICY "Users can view their own rewards"
ON public.customer_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customer rewards"
ON public.customer_rewards
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can redeem rewards"
ON public.customer_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
ON public.customer_rewards
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to add loyalty points
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_booking_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points INTEGER;
  v_new_balance INTEGER;
  v_current_tier TEXT;
  v_new_tier TEXT;
BEGIN
  -- Get current points
  SELECT COALESCE(loyalty_points, 0), COALESCE(loyalty_tier, 'bronze')
  INTO v_current_points, v_current_tier
  FROM profiles
  WHERE profiles.user_id = p_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, loyalty_points, loyalty_tier)
    VALUES (p_user_id, 0, 'bronze');
    v_current_points := 0;
    v_current_tier := 'bronze';
  END IF;
  
  -- Calculate new balance
  v_new_balance := GREATEST(0, v_current_points + p_points);
  
  -- Insert transaction
  INSERT INTO loyalty_transactions (user_id, booking_id, transaction_type, points, description, balance_after)
  VALUES (p_user_id, p_booking_id, p_transaction_type, p_points, p_description, v_new_balance);
  
  -- Update profile points
  UPDATE profiles
  SET 
    loyalty_points = v_new_balance,
    loyalty_tier = calculate_loyalty_tier(v_new_balance),
    updated_at = now()
  WHERE profiles.user_id = p_user_id;
  
  -- Get new tier
  SELECT loyalty_tier INTO v_new_tier FROM profiles WHERE profiles.user_id = p_user_id;
  
  -- If tier upgraded, add bonus transaction
  IF v_new_tier != v_current_tier AND p_points > 0 THEN
    INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, balance_after)
    VALUES (p_user_id, 'tier_upgrade', 0, 'Félicitations! Vous êtes passé au niveau ' || v_new_tier, v_new_balance);
  END IF;
  
  RETURN v_new_balance;
END;
$$;

-- Create function to redeem reward
CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_current_points INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_customer_reward_id UUID;
BEGIN
  -- Get reward details
  SELECT * INTO v_reward FROM loyalty_rewards WHERE id = p_reward_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;
  
  -- Check max redemptions
  IF v_reward.max_redemptions IS NOT NULL AND v_reward.current_redemptions >= v_reward.max_redemptions THEN
    RAISE EXCEPTION 'Reward has reached maximum redemptions';
  END IF;
  
  -- Get user's current points
  SELECT COALESCE(loyalty_points, 0) INTO v_current_points
  FROM profiles WHERE profiles.user_id = p_user_id;
  
  -- Check if user has enough points
  IF v_current_points < v_reward.points_required THEN
    RAISE EXCEPTION 'Insufficient points. Required: %, Available: %', v_reward.points_required, v_current_points;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_points - v_reward.points_required;
  
  -- Create transaction
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, balance_after)
  VALUES (p_user_id, 'redeem', -v_reward.points_required, 'Échange: ' || v_reward.name, v_new_balance)
  RETURNING id INTO v_transaction_id;
  
  -- Create customer reward
  INSERT INTO customer_rewards (user_id, reward_id, transaction_id, expires_at)
  VALUES (p_user_id, p_reward_id, v_transaction_id, now() + (COALESCE(v_reward.valid_days, 30) || ' days')::interval)
  RETURNING id INTO v_customer_reward_id;
  
  -- Update profile points
  UPDATE profiles
  SET loyalty_points = v_new_balance, updated_at = now()
  WHERE profiles.user_id = p_user_id;
  
  -- Update reward redemption count
  UPDATE loyalty_rewards
  SET current_redemptions = current_redemptions + 1, updated_at = now()
  WHERE id = p_reward_id;
  
  RETURN v_customer_reward_id;
END;
$$;

-- Insert default rewards
INSERT INTO loyalty_rewards (name, description, points_required, reward_type, reward_value, is_active) VALUES
('5% de réduction', 'Obtenez 5% de réduction sur votre prochain service', 100, 'discount_percent', 5, true),
('10% de réduction', 'Obtenez 10% de réduction sur votre prochain service', 200, 'discount_percent', 10, true),
('15% de réduction', 'Obtenez 15% de réduction sur votre prochain service', 350, 'discount_percent', 15, true),
('20% de réduction', 'Obtenez 20% de réduction sur votre prochain service', 500, 'discount_percent', 20, true),
('5000 FCFA de crédit', 'Crédit de 5000 FCFA sur votre prochain service', 300, 'discount_fixed', 5000, true),
('10000 FCFA de crédit', 'Crédit de 10000 FCFA sur votre prochain service', 550, 'discount_fixed', 10000, true),
('Lavage de Vitres Gratuit', 'Un service de lavage de vitres offert', 400, 'free_service', NULL, true),
('Nettoyage Standard Gratuit', 'Un nettoyage standard offert', 750, 'free_service', NULL, true);

-- Create trigger to auto-award points on booking completion
CREATE OR REPLACE FUNCTION public.award_points_on_booking_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_price INTEGER;
  v_points_earned INTEGER;
BEGIN
  -- Only award points when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.user_id IS NOT NULL THEN
    -- Estimate service price (you can adjust these)
    v_service_price := CASE NEW.service_type
      WHEN 'Nettoyage Standard' THEN 50000
      WHEN 'Nettoyage Approfondi' THEN 80000
      WHEN 'Nettoyage de Déménagement' THEN 120000
      WHEN 'Nettoyage de Bureau' THEN 100000
      WHEN 'Lavage de Vitres' THEN 40000
      WHEN 'Nettoyage de Tapis' THEN 60000
      ELSE 50000
    END;
    
    -- Calculate points (1 point per 1000 FCFA)
    v_points_earned := v_service_price / 1000;
    
    -- Award points
    PERFORM add_loyalty_points(
      NEW.user_id,
      v_points_earned,
      'earn',
      'Points gagnés pour ' || NEW.service_type,
      NEW.id
    );
    
    -- Update total spent in profile
    UPDATE profiles
    SET 
      total_spent = COALESCE(total_spent, 0) + v_service_price,
      updated_at = now()
    WHERE profiles.user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_points_on_completion ON public.bookings;
CREATE TRIGGER trigger_award_points_on_completion
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_booking_completion();