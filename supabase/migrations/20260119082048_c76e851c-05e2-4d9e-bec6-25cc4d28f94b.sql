-- =====================================================
-- FIX REMAINING SECURITY ISSUES
-- =====================================================

-- 1. Add explicit SELECT policies for staff tables (only admins)
-- These tables currently have "ALL" policy for admins but no explicit SELECT denial for others

-- staff_members: Add explicit SELECT restriction to admins only
CREATE POLICY "Only admins can view staff members" 
ON public.staff_members 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role)
);

-- staff_emails: Add explicit SELECT restriction to admins only  
CREATE POLICY "Only admins can view staff emails" 
ON public.staff_emails 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role)
);

-- staff_availability: Add explicit SELECT restriction to admins only
CREATE POLICY "Only admins can view staff availability" 
ON public.staff_availability 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role)
);

-- 2. Fix notifications - Allow users to update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);