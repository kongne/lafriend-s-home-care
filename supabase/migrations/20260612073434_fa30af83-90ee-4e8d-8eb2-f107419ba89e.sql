-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public roles.
-- Triggers run as the table owner regardless of these grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_feedback_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_booking_sensitive_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points_on_booking_completion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking_reminder() FROM PUBLIC, anon, authenticated;

-- admin_get_user_email must only be callable by signed-in users (it internally checks admin role).
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM PUBLIC, anon;

-- Internal helpers used by RLS / other SECURITY DEFINER functions; not meant to be RPC'd by clients.
REVOKE EXECUTE ON FUNCTION public.add_loyalty_points(uuid, integer, text, text, uuid) FROM PUBLIC, anon, authenticated;
