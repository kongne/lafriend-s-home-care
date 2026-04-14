

# Comprehensive Fix & Enhancement Plan

## Current Issues Identified

1. **Console errors**: `ChatWidget` and `BookingModal` missing `forwardRef` — causes React warnings
2. **NotificationCenter** is shared between admin and customer — same dropdown component, no dedicated customer notification page
3. **Bulk actions** only support bookings/contacts — no bulk actions for referrals or reminders
4. **BulkActions** has no success summary after completion (just a toast)
5. **Edge functions** need redeployment to ensure latest code is live
6. **Notifications RLS**: users can't delete their own notifications (only admins can)

## Plan

### 1. Fix React forwardRef warnings
- Wrap `ChatWidget` and `BookingModal` with `React.forwardRef` to eliminate console errors

### 2. Create dedicated Customer Notification Page
- Create `src/components/customer/CustomerNotifications.tsx` — a full-page notification center (not a dropdown)
- Features: unread counter badge in tabs, search/filter by type, "mark all read" button, swipe-to-archive on mobile
- Add a "Notifications" tab to `CustomerPortal.tsx` TabsList with unread badge counter
- Keep the dropdown `NotificationCenter` in the header as a quick-access bell, but clicking "Voir tout" navigates to the dedicated tab

### 3. Enhance BulkActions with success summaries and loading states
- Update `BulkActions.tsx`: after action completes, show a summary toast with count of successful/failed items
- Add a progress indicator during bulk operations (spinner overlay on the action bar)
- Extend `BulkActions` type prop to support `'referrals' | 'reminders'` in addition to existing types
- Add referral bulk actions: mark completed, delete
- Add reminder bulk actions: cancel, delete

### 4. Add bulk actions to Admin referrals and reminders tabs
- Update `ReferralManagement.tsx` to integrate `BulkActions` with selectable referral rows
- Update `EmailRemindersManagement.tsx` to integrate `BulkActions` with selectable reminder rows

### 5. Add notification DELETE policy for users
- Database migration: add RLS policy allowing users to delete their own notifications (`auth.uid() = user_id`)

### 6. Deploy all updated edge functions
- Deploy: `send-booking-confirmation`, `send-status-notification`, `broadcast-notification`, `send-appointment-reminder`, `get-referral-leaderboard`, `send-notification`, `send-referral-notification`, `send-feedback-request`, `send-admin-digest`, `send-sms-notification`

### 7. Mobile responsiveness pass
- Verify and fix responsive classes in `CustomerNotifications` (new component) — ensure all grids use `grid-cols-1` on mobile
- Ensure `BulkActions` action bar stacks vertically on mobile with full-width buttons

## Technical Details

### Files to create:
- `src/components/customer/CustomerNotifications.tsx`

### Files to edit:
- `src/components/ChatWidget.tsx` — add forwardRef
- `src/components/BookingModal.tsx` — add forwardRef  
- `src/components/admin/BulkActions.tsx` — extend types, add success summaries
- `src/pages/CustomerPortal.tsx` — add Notifications tab
- `src/components/admin/ReferralManagement.tsx` — add bulk selection
- `src/components/admin/EmailRemindersManagement.tsx` — add bulk selection

### Database migration:
- Add DELETE policy for users on notifications table: `(auth.uid() IS NOT NULL) AND (user_id = auth.uid())`

### Edge function deployments:
- All 10 edge functions redeployed to ensure latest code is live

