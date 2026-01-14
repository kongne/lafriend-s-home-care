# Quick Start Guide - New Features

This guide will help you quickly set up and test the three new features.

## Prerequisites
- Node.js 18+ installed
- Supabase project created
- Google account (for reCAPTCHA)

---

## Step 1: Install Dependencies

```bash
# Install package.json updates
npm install
# or
bun install
```

This installs `react-google-recaptcha` needed for CAPTCHA protection.

---

## Step 2: Set Up Environment Variables

1. Copy the template:
```bash
cp .env.local.example .env.local
```

2. Get your reCAPTCHA keys:
   - Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Click "Create"
   - Select reCAPTCHA v3
   - Add your domain (e.g., localhost for development)
   - Get Site Key and Secret Key

3. Update `.env.local`:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_from_google
```

4. Add reCAPTCHA script to `index.html`:
```html
<!-- In <head> section -->
<script src="https://www.google.com/recaptcha/api.js"></script>
```

---

## Step 3: Deploy Database Migrations

The migrations have been created and are ready to deploy:

- `20260114120000_add_feedback_and_reminders.sql` - Creates feedback_ratings and email_reminders tables
- `20260114121000_add_reminder_trigger.sql` - Adds auto-trigger for creating reminders

### Using Supabase CLI:

```bash
# If you have Supabase CLI installed
supabase migration up

# Or use the Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the migration files in order
```

### Manual Deployment:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy contents of `supabase/migrations/20260114120000_add_feedback_and_reminders.sql`
4. Run the query
5. Repeat for `20260114121000_add_reminder_trigger.sql`

---

## Step 4: Configure Email Service (For Reminders)

Choose one of these email services:

### Option A: SendGrid (Recommended)

1. Create [SendGrid account](https://sendgrid.com)
2. Get API Key from Settings → API Keys
3. In Supabase Dashboard → Project Settings → Functions → Environment Variables:
   ```
   SENDGRID_API_KEY=your_key
   EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send
   ```

### Option B: Mailgun

1. Create [Mailgun account](https://www.mailgun.com)
2. Get API Key and verified domain
3. In Supabase Dashboard → Functions Environment:
   ```
   MAILGUN_API_KEY=your_key
   EMAIL_SERVICE_URL=https://api.mailgun.net/v3/your-domain/messages
   ```

### Option C: Test Without Email (Development Only)

The reminders will be created and marked as pending, but won't actually send. Good for testing the flow without external dependencies.

---

## Step 5: Test CAPTCHA Protection

### Frontend Test:

1. Start your app:
```bash
npm run dev
```

2. Navigate to contact or booking form
3. Submit the form
4. In browser DevTools → Network tab, you should see a request to `google.com/recaptcha/api`
5. Form should submit successfully

### Backend Test:

To verify CAPTCHA tokens on the server, add this to your Supabase Edge Function:

```typescript
import { verifyRecaptchaToken } from "@/lib/recaptcha";

// In your function handler:
const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
const result = await verifyRecaptchaToken(
  recaptchaToken,
  secretKey,
  'booking',
  0.5
);

if (!result.success) {
  return { error: 'CAPTCHA verification failed' };
}
```

---

## Step 6: Test Feedback & Rating System

### Display Feedback:

Add to any component (e.g., booking details page):

```tsx
import { FeedbackList } from "@/components/FeedbackList";

<FeedbackList limit={5} />
```

### Submit Feedback:

Add to a page where customers can rate completed services:

```tsx
import { FeedbackForm } from "@/components/FeedbackForm";

<FeedbackForm 
  bookingId="booking_uuid"
  onSuccess={() => {
    console.log("Feedback submitted!");
    // Refresh booking details
  }}
/>
```

### Test Submission:

1. Create a test booking via the booking form
2. Navigate to the booking detail page
3. Click "Leave Feedback"
4. Submit a rating with a comment
5. Verify it appears in the feedback list

---

## Step 7: Test Email Reminders

### Manual Trigger:

```bash
# In your app, call:
import { reminderService } from "@/lib/reminderService";

await reminderService.triggerReminderSending();
```

Or use curl:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-appointment-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Check Reminder Status:

In Supabase Dashboard → SQL Editor:

```sql
-- View all reminders for a booking
SELECT * FROM email_reminders 
WHERE booking_id = 'your_booking_id';

-- View pending reminders
SELECT * FROM email_reminders 
WHERE status = 'pending'
ORDER BY scheduled_send_time;

-- View failed reminders with errors
SELECT booking_id, email, last_error, retry_count
FROM email_reminders
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Set Up Automated Sending:

#### Using GitHub Actions (Easiest):

Create `.github/workflows/send-reminders.yml`:

```yaml
name: Send Email Reminders

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder function
        run: |
          curl -X POST \
            https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-appointment-reminder \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

#### Using Supabase Cron:

Add to a new migration file:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule every hour
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',
  'SELECT http_post(...)'  -- Supabase Edge Function call
);
```

---

## Testing Checklist

### CAPTCHA Protection ✓
- [ ] Forms load without errors
- [ ] reCAPTCHA script loads successfully
- [ ] Forms submit and save to database
- [ ] Rate limiting works (3 bookings in 1 minute blocked)
- [ ] Contact form limiting works (5 contacts in 1 minute blocked)

### Feedback System ✓
- [ ] FeedbackForm component displays correctly
- [ ] Can submit star ratings
- [ ] Comments are saved
- [ ] FeedbackList shows submitted feedback
- [ ] Verified badge appears for authenticated users
- [ ] Statistics calculate correctly

### Email Reminders ✓
- [ ] Reminders created automatically when booking is made
- [ ] `email_reminders` table has entries
- [ ] Manual trigger sends emails (or logs failures)
- [ ] Email contains correct appointment details
- [ ] Reminders marked as 'sent' after processing
- [ ] Failed reminders have error messages
- [ ] Cron job runs on schedule

---

## Common Issues & Solutions

### "reCAPTCHA is not defined"
- **Solution:** Ensure the reCAPTCHA script is in `index.html` before other scripts

### "email_reminders table doesn't exist"
- **Solution:** Run the migration: `20260114120000_add_feedback_and_reminders.sql`

### "Email reminders not sending"
- **Solution:** 
  - Check email service credentials
  - Verify `EMAIL_SERVICE_URL` is set
  - Check Supabase Function logs for errors
  - Ensure email service API key is valid

### "Feedback form not showing"
- **Solution:** Verify `feedback_ratings` table exists (migration deployed)

### "CAPTCHA always fails"
- **Solution:**
  - Check Site Key matches domain
  - Verify `VITE_RECAPTCHA_SITE_KEY` is correct
  - Check browser console for errors
  - Try incognito mode (clear cache issues)

---

## Next Steps

1. **Customize Email Templates** - Edit templates in `send-appointment-reminder/index.ts`
2. **Adjust CAPTCHA Thresholds** - Change score threshold in `BookingForm.tsx` and `Contact.tsx`
3. **Add Analytics** - Track feedback metrics and submission rates
4. **Implement Opt-Out** - Add unsubscribe option for email reminders
5. **Multi-Language Support** - Translate reminder emails and form labels

---

## Support

For detailed documentation, see `FEATURE_IMPLEMENTATION_GUIDE.md`

For issues:
1. Check browser console for errors
2. Check Supabase function logs
3. Verify environment variables are set
4. Check database migrations deployed correctly
