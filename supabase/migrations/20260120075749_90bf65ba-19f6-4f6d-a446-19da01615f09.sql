-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  bonus_points INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if user already has a referral code
  SELECT referral_code INTO v_code FROM referrals WHERE referrer_id = p_user_id LIMIT 1;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate new unique code
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Function to process referral when new user signs up
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code TEXT, p_new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Find the referral
  SELECT * INTO v_referral FROM referrals 
  WHERE referral_code = p_referral_code 
    AND status = 'pending' 
    AND referred_user_id IS NULL
  LIMIT 1;
  
  IF v_referral IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE referrals 
  SET referred_user_id = p_new_user_id,
      status = 'completed',
      completed_at = now()
  WHERE id = v_referral.id;
  
  -- Award bonus points to referrer
  SELECT add_loyalty_points(
    v_referral.referrer_id,
    v_referral.bonus_points,
    'referral_bonus',
    'Bonus de parrainage - Code: ' || p_referral_code,
    NULL
  ) INTO v_new_balance;
  
  -- Award welcome bonus to new user
  SELECT add_loyalty_points(
    p_new_user_id,
    50,
    'referral_bonus',
    'Bonus de bienvenue - Parrainage',
    NULL
  ) INTO v_new_balance;
  
  RETURN TRUE;
END;
$$;

-- Add update policy for admins on loyalty_rewards
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.loyalty_rewards;

CREATE POLICY "Admins can manage all rewards"
  ON public.loyalty_rewards FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));