# Feature Implementation Guide

## Overview
This document describes the three new features added to the LaFriend's Home Care application:

1. **CAPTCHA Protection** - Prevent spam on contact and booking forms
2. **Feedback & Rating System** - Allow customers to review their cleaning services
3. **Automated Email Reminders** - Send appointment reminders 24 hours before scheduled service

---

## 1. CAPTCHA Protection

### Overview
reCAPTCHA v3 is integrated into both the booking and contact forms to prevent automated spam submissions while maintaining a seamless user experience (invisible to legitimate users).

### Implementation Details

#### Files Modified/Created:
- `src/lib/recaptcha.ts` - CAPTCHA configuration and utilities
- `src/components/BookingForm.tsx` - Updated with CAPTCHA token generation
- `src/components/Contact.tsx` - Updated with CAPTCHA token generation
- `package.json` - Added `react-google-recaptcha` dependency

#### Environment Variables Required:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

#### Setup Instructions:

1. **Get reCAPTCHA Keys:**
   - Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Create a new site with reCAPTCHA v3
   - Copy the Site Key and Secret Key

2. **Add Environment Variables:**
   ```env
   # .env.local
   VITE_RECAPTCHA_SITE_KEY=your_site_key
   
   # For backend verification (in Supabase Edge Function environment)
   RECAPTCHA_SECRET_KEY=your_secret_key
   ```

3. **Load reCAPTCHA Script:**
   Add to `index.html` in the `<head>` section:
   ```html
   <script src="https://www.google.com/recaptcha/api.js"></script>
   ```

#### How It Works:
- When users submit the contact or booking form, `getRecaptchaToken()` is automatically called
- A reCAPTCHA v3 token is generated invisibly
- The token is sent with the form submission
- On the backend (in Supabase Edge Functions), you should verify the token using `verifyRecaptchaToken()`
- Only submissions with valid tokens and acceptable scores are processed

#### Score Interpretation (reCAPTCHA v3):
- **1.0** - Very likely legitimate
- **0.9** - Probably legitimate
- **0.5** - Neutral
- **0.1** - Probably bot
- **0.0** - Very likely bot

#### Backend Verification Example:
```typescript
import { verifyRecaptchaToken } from './recaptcha.ts';

const result = await verifyRecaptchaToken(
  token,
  secretKey,
  'booking',  // action type
  0.5  // minimum score threshold
);

if (!result.success) {
  // Reject the submission
  return { error: 'CAPTCHA verification failed' };
}
```

---

## 2. Feedback & Rating System

### Overview
After a cleaning service is completed, customers can rate and review their experience. This system includes:
- Overall rating (1-5 stars)
- Detailed ratings for cleanliness, punctuality, and professionalism
- Optional text feedback/comments
- Verified booking badge for authenticated customers
- Aggregate statistics showing average ratings

### Implementation Details

#### Files Created:
- `src/components/FeedbackForm.tsx` - Form for customers to submit feedback
- `src/components/FeedbackList.tsx` - Component to display and review feedback
- `src/hooks/useFeedback.tsx` - Custom hook for feedback management
- `supabase/migrations/20260114120000_add_feedback_and_reminders.sql` - Database schema

#### Database Schema:
```sql
CREATE TABLE feedback_ratings (
  id UUID PRIMARY KEY
  booking_id UUID (foreign key to bookings)
  user_id UUID (foreign key to auth.users)
  rating INTEGER (1-5)
  comment TEXT (optional)
  cleanliness_rating INTEGER (1-5)
  punctuality_rating INTEGER (1-5)
  professionalism_rating INTEGER (1-5)
  is_verified_booking BOOLEAN
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

#### Usage in Components:

**Displaying Feedback List:**
```tsx
import { FeedbackList } from "@/components/FeedbackList";

// Show all feedback with stats
<FeedbackList limit={10} />

// Show feedback for specific booking
<FeedbackList bookingId="booking_uuid" />
```

**Submitting Feedback:**
```tsx
import { FeedbackForm } from "@/components/FeedbackForm";

<FeedbackForm 
  bookingId="booking_uuid"
  onSuccess={() => console.log('Feedback submitted')}
  onCancel={() => console.log('Cancelled')}
/>
```

**Using the Hook:**
```tsx
import { useFeedback } from "@/hooks/useFeedback";

const { loading, submitted, error, submitFeedback } = useFeedback();

const handleSubmit = async () => {
  const result = await submitFeedback({
    bookingId: "uuid",
    rating: 5,
    comment: "Great service!",
    cleanlinessRating: 5,
    punctualityRating: 5,
    professionalismRating: 5,
  });
};
```

#### Features:
- **Star Rating Interface** - Interactive 5-star system for rating each aspect
- **Verified Badge** - Authenticated users get a "Verified Customer" badge
- **Statistics** - Aggregate stats showing average rating and total reviews
- **Timestamps** - Shows when feedback was submitted (using `date-fns` for relative time)
- **Responsive Design** - Works on all devices

#### Best Practices:
1. Display feedback form only after service completion
2. Send customers a notification encouraging them to leave feedback
3. Use aggregate ratings on service pages/cards
4. Highlight negative feedback for quality improvement
5. Respond to feedback publicly when possible

---

## 3. Automated Email Reminders

### Overview
Customers automatically receive email reminders 24 hours before their scheduled cleaning appointment. The system:
- Creates reminders when bookings are made (via database trigger)
- Sends emails at the scheduled time via Edge Function
- Tracks reminder status (pending, sent, failed)
- Supports retry logic for failed attempts

### Implementation Details

#### Files Created:
- `supabase/functions/send-appointment-reminder/index.ts` - Edge Function for sending reminders
- `src/lib/reminderService.ts` - Frontend service for reminder management
- `supabase/migrations/20260114120000_add_feedback_and_reminders.sql` - Database schema
- `supabase/migrations/20260114121000_add_reminder_trigger.sql` - Trigger for auto-creation

#### Database Schema:
```sql
CREATE TABLE email_reminders (
  id UUID PRIMARY KEY
  booking_id UUID (foreign key to bookings)
  email TEXT
  reminder_type TEXT ('24hours', '48hours', etc)
  scheduled_send_time TIMESTAMP
  sent_at TIMESTAMP (null until sent)
  status TEXT ('pending', 'sent', 'failed')
  retry_count INTEGER
  last_error TEXT (null if no error)
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

#### How It Works:

1. **Automatic Creation:**
   - When a booking is inserted, a database trigger automatically creates an email reminder
   - The reminder is scheduled for 24 hours before the appointment
   - Status is set to 'pending'

2. **Sending Process:**
   - The `send-appointment-reminder` Edge Function runs periodically (should be triggered by a cron job)
   - It fetches pending reminders that are due to be sent
   - Sends personalized emails with appointment details
   - Updates reminder status to 'sent' or 'failed'

3. **Email Template:**
   - Includes customer name, service type, date, time, and location
   - Professional HTML formatting
   - Call-to-action button linking to customer portal
   - Branded footer

#### Environment Variables:

```env
# Email Service Configuration
EMAIL_SERVICE_URL=https://api.your-email-service.com/send
EMAIL_SERVICE_KEY=your_email_service_api_key

# Supabase (automatically available in Edge Functions)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Setting Up the Cron Job:

**Option 1: Using Supabase Cron Extension**

Add to `supabase/migrations/20260114130000_setup_cron.sql`:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule reminder function to run every hour
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',  -- Every hour
  'SELECT http_post(
    ''https://your-project.supabase.co/functions/v1/send-appointment-reminder'',
    jsonb_build_object(
      ''Authorization'', ''Bearer ANON_KEY''
    )::text
  )'
);
```

**Option 2: External Cron Service (Recommended)**

Use services like:
- **GitHub Actions** - Free, reliable
- **EasyCron** - Simple setup
- **Upstash** - Serverless cron
- **AWS EventBridge** - For AWS users

Example GitHub Actions workflow:
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
            -H "Authorization: Bearer YOUR_ANON_KEY" \
            -H "Content-Type: application/json"
```

#### Using the Reminder Service:

```tsx
import { reminderService } from "@/lib/reminderService";

// Create a reminder manually
const result = await reminderService.createReminder(
  bookingId,
  "customer@email.com",
  appointmentDateTime,
  "24hours"
);

// Get reminders for a booking
const reminders = await reminderService.getRemindersByBooking(bookingId);

// Get all pending reminders
const pending = await reminderService.getPendingReminders();

// Manually trigger the sending process
const sendResult = await reminderService.triggerReminderSending();

// Cancel a reminder
await reminderService.cancelReminder(reminderId);
```

#### Email Service Integration:

The function supports multiple email services. Update `send-appointment-reminder/index.ts`:

**SendGrid Example:**
```typescript
const emailServiceUrl = 'https://api.sendgrid.com/v3/mail/send';
const emailServiceKey = Deno.env.get('SENDGRID_API_KEY');

// Modify the sendEmail function for SendGrid format
```

**Mailgun Example:**
```typescript
const emailServiceUrl = 'https://api.mailgun.net/v3/your-domain/messages';
// Use Mailgun's form-encoded format
```

#### Monitoring & Troubleshooting:

1. **Check Reminder Status:**
   ```sql
   SELECT * FROM email_reminders
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

2. **View Error Messages:**
   ```sql
   SELECT booking_id, email, last_error, retry_count
   FROM email_reminders
   WHERE status = 'failed';
   ```

3. **Monitor Function Logs:**
   - Go to Supabase Dashboard → Functions → send-appointment-reminder
   - Check execution logs for errors

4. **Test the Function:**
   ```bash
   curl -X POST \
     https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-appointment-reminder \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

#### Advanced Configuration:

**Multiple Reminder Types:**
```typescript
// Create both 24-hour and 48-hour reminders
await reminderService.createReminder(booking, email, appointmentDateTime, "24hours");
await reminderService.createReminder(booking, email, appointmentDateTime, "48hours");
```

**Retry Logic:**
- Failed reminders have `retry_count` tracked
- Failed reminders can be retried the next time the function runs
- Modify the query to include retries:
  ```sql
  WHERE status IN ('pending', 'failed') 
  AND retry_count < 3
  ```

---

## Security Considerations

### CAPTCHA:
- Always verify tokens on the backend
- Use appropriate score thresholds
- Never rely solely on CAPTCHA; combine with rate limiting
- Keep secret keys secure (never expose in frontend)

### Feedback:
- Validate user owns the booking before allowing feedback submission
- Consider implementing spam/abuse detection
- Allow users to edit/delete their own reviews

### Email Reminders:
- Use environment variables for sensitive keys
- Implement rate limiting on the function
- Log all sending attempts for auditing
- Consider opt-out/unsubscribe mechanisms

---

## Testing

### CAPTCHA:
```bash
# Test with score simulation
npm run test:captcha
```

### Feedback:
```bash
# Test feedback submission
npm run test:feedback

# Test rating calculations
npm run test:ratings
```

### Email Reminders:
```bash
# Test reminder creation
npm run test:reminders

# Test email sending
npm run test:email
```

---

## Maintenance

### Regular Tasks:
1. Monitor failed email reminders (check `last_error` column)
2. Review feedback for quality control issues
3. Check CAPTCHA score distribution for adjustments
4. Clean up old reminders (>30 days old)

### Monthly Review:
- Spam submission rates (benchmark: <5% of submissions)
- Email delivery rates (benchmark: >95%)
- Average feedback ratings
- Customer satisfaction trends

---

## Troubleshooting

### CAPTCHA Issues:
- Ensure reCAPTCHA script is loaded
- Check Site Key validity
- Verify domain in reCAPTCHA console
- Check browser console for JavaScript errors

### Feedback Issues:
- Verify booking exists before allowing feedback
- Check database permissions/RLS policies
- Ensure date formatting is correct

### Email Reminder Issues:
- Check email service configuration
- Verify environment variables are set
- Check function logs for errors
- Test email service credentials

---

## API Reference

See individual component and service files for detailed API documentation.
