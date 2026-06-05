
# Plan: Performance, Auto-Logout & Security Hardening

Working through the uploaded pagespeed document plus the open security findings in the scanner panel. Grouped by area; each group is an independent batch.

## 1. Auto-logout after 10 min inactivity

- New hook `useIdleLogout` (tracks mousemove/keydown/touch/click/scroll).
- New `<SessionTimeoutDialog>` (shadcn `AlertDialog`) with 60s countdown, "Stay Logged In" / "Log Out Now".
- Mount inside `App.tsx` only when a session exists (uses `useAuth`).
- Timeout = 10 min idle → show modal; 60s no action → `supabase.auth.signOut()` + redirect `/auth` with toast.
- FR/EN strings via `LanguageContext`.

## 2. Mobile/Desktop performance (Prompts A + B + Desktop)

- Hero image: confirm `fetchpriority="high"`, `loading="eager"`, explicit width/height in `HeroSlideshow.tsx`; add `<link rel="preload" as="image">` for the first slide in `index.html`. (Already partially done — verify and patch gaps.)
- All non-hero `<img>` get `loading="lazy"` + `decoding="async"` + width/height — sweep `Gallery`, `Services`, `Testimonials`, `About`.
- Code splitting: ensure `/admin`, `/admin-settings`, `/admin-verifications`, `/portal`, `/chat`, `/onboarding` are `React.lazy` in `App.tsx` (most already are — verify).
- Defer non-critical JS: `ChatWidget` already deferred via `ChatWidgetDeferred`; verify GA/analytics scripts use `defer`.
- Preload Poppins font in `index.html` with `font-display: swap` (already swap; add preload for the weight used in the hero).

## 3. Security fixes from scanner

### Database migration (single migration)
- **profiles**: drop "Deny anonymous access to profiles" permissive SELECT; "Select own profile or admins" already blocks anon.
- **notifications**: drop "Deny anonymous access to notifications" permissive SELECT; change insert policy to admin-only (service role bypasses RLS anyway).
- **staff_time_off**: drop "Deny anonymous access" SELECT; add admin-only SELECT.
- **audit_logs**: drop the `OR (auth.uid() IS NULL)` branch on INSERT.
- **loyalty_transactions**: drop the open INSERT policy entirely (service role inserts via SECURITY DEFINER `add_loyalty_points`).
- **feedback_ratings**: replace open INSERT policy with `auth.uid() = user_id AND booking belongs to caller AND status='completed'`; force `is_verified_booking` via trigger.

### Edge functions
- `broadcast-notification`: require auth via `getClaims`, verify `has_role(admin)`, sanitize title/message/link with `escapeHtml`.
- `send-status-notification`, `send-referral-notification`, `send-booking-confirmation`, `send-cancellation-notification`, `send-kyc-decision`, `send-sms-notification`: add JWT check + escape user-supplied HTML fields. (Keep `send-admin-digest`, `send-appointment-reminder`, `send-feedback-request` cron-callable but require a shared `CRON_SECRET` header.)
- `escapeHtml` helper already exists in `_shared/email-service.ts` — wire it in.

### Storage
- `chat-attachments` bucket → private; rely on signed URLs in `useChatMessages` (need code update to use `createSignedUrl`).

### Repo hygiene
- Add `.env` to `.gitignore` and instruct user to **rotate the leaked Gmail app password** (cannot do this for them). Move runtime creds to Supabase secrets (already present as `GMAIL_USER` / `GMAIL_APP_PASSWORD`).

## Out of scope (need user input / external action)

- Rotating the leaked Gmail password (manual at myaccount.google.com).
- Realtime channel RLS on `realtime.messages` (Supabase-managed; needs careful per-channel policies — flagging for follow-up).
- Public bucket listing lint & extension-in-public lint (low risk, can address later).
- SECURITY DEFINER executable lints (would need to audit each function individually — flagging).

## Execution order

1. Migration (gated on user approval).
2. Edge function updates + chat attachment storage flip.
3. Auto-logout feature.
4. Performance sweep.
5. `.gitignore` update + clear notice to rotate Gmail password.
