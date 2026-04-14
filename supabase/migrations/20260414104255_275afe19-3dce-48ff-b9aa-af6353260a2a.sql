CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));