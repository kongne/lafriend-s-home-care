# Scope — One large pass

Given the size, I'll execute in 4 sequential phases, each ending with a deployable checkpoint. All emails stay on Gmail SMTP with branded HTML templates.

## Phase 1 — The 4 requested features

### 1.1 CSV reports export (admin)
- New edge function `export-reports` (verify_jwt=true, admin-gated): aggregates bookings, contacts, subscribers, loyalty, referrals into CSVs. Returns base64-encoded ZIP or a single CSV per `type` query param.
- Update `src/pages/Admin.tsx` reports tab + `QuickActions` to call the function and trigger download for: bookings, contacts, subscribers, revenue summary, loyalty transactions.
- Reuse existing `exportToCSV` for client-side fallback; edge function adds server-aggregated reports (revenue by month, top customers, staff workload).

### 1.2 Pay-with-Points in BookingForm
- Add a step in `BookingForm` (after service selection, before submit) showing user's loyalty balance.
- Slider/input to choose points to redeem (multiples of 10), live preview: estimated price → discount → final price.
- On successful insert, call `redeem_points_for_booking(user_id, booking_id, points)` RPC.
- Show confirmation summary card with breakdown.

### 1.3 Voice note recorder in chat
- New component `VoiceRecorder.tsx` using `MediaRecorder` (audio/webm;codecs=opus), max 5 min with countdown.
- Live waveform visualizer (optional: simple animated bars).
- Upload to `chat-attachments` via existing `uploadChatAttachment` (already supports audio kind).
- Send as `chat_messages` with `type='audio'`.
- In `ChatRoom.tsx` audio bubbles: HTML5 `<audio>` player + duration display.

### 1.4 Branded transactional emails (Gmail SMTP)
- New edge functions: `send-reschedule-notification`, `send-cancellation-notification` (mirror existing `send-booking-confirmation` style).
- Refresh `send-booking-confirmation` and `send-status-notification` templates with consistent branded HTML (navy/gold, logo, Poppins fallback, FR/EN).
- Wire from `BookingCard` reschedule/cancel actions and admin booking status updates.

## Phase 2 — KYC / Identity Verification

- Migration: `identities` private storage bucket; `identity_documents` table (user_id, doc_type cni|passport, front_url, back_url, selfie_url, status pending|approved|rejected, reviewed_by, reviewed_at, rejection_reason, expires_at). RLS: owner + admin only.
- Add `is_verified boolean DEFAULT false` to `profiles` and `staff_members`.
- Onboarding flow `src/pages/Onboarding.tsx`:
  - Step 1: Phone OTP (Supabase phone auth — needs Twilio already configured ✓).
  - Step 2: Upload CNI front/back (file inputs, image compression).
  - Step 3: Selfie capture via `getUserMedia`.
- Admin verification queue `src/components/admin/VerificationQueue.tsx`: side-by-side ID vs Selfie, Approve/Reject with reason → notification to user.
- Cron-style edge function `purge-rejected-identities` (manual trigger or pg_cron): delete docs older than 30 days where status='rejected' or user deleted.

## Phase 3 — Audit & monitoring

- Extend `audit_logs` table (already exists): add triggers on `bookings`, `staff_members`, `identity_documents`, `user_roles` for INSERT/UPDATE/DELETE → log to `audit_logs`.
- Edge function `security-alert`: on suspicious event (5 failed logins, admin login from new IP), email admin via Gmail SMTP.
- New admin tab "Security": active sessions count, recent audit events table, failed login attempts (from auth.audit_log_entries via service role), Emergency Kill Switch toggle (sets `app_settings.maintenance_mode=true` → app shows maintenance page).
- New `app_settings` singleton table.

## Phase 4 — Admin MFA + RLS audit

- Enable Supabase MFA via `configure_auth`.
- Force MFA enrollment for admins: redirect from `/admin` to `/admin/setup-mfa` if `aal < aal2` and role='admin'.
- Run `supabase--linter` + manual RLS review pass on every table; fix any gaps found.
- Enable HIBP password protection.
- Update `mem://security/access-control-and-rls` and security memory.

## Technical notes

- All new edge functions follow `{ ok, data?, error? }` HTTP 200 contract (per project rule).
- All Zod schemas use v4 `.issues`.
- Translations FR/EN added to `LanguageContext` for every new UI string.
- Confetti on successful verification approval (matches existing pattern).
- Realtime invalidation via existing TanStack Query hooks.

## Out of scope (will flag at the end)

- Face comparison API (Rekognition) — needs paid AWS account; admin manual review only for now.
- Database rollback automation — Supabase handles backups natively, just document in ADMIN_PLAYBOOK.md.
- Custom domain for branded `From:` email — stays `lafriendsservices@gmail.com`.

## Estimated execution

This will span many tool calls (~15-25 file creations, 4-5 migrations, 6+ edge functions). Expect a long single response.
