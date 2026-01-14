# Edge Functions Setup & Testing Guide

## Overview

This guide covers the setup, deployment, and testing of all Supabase Edge Functions used in LaFriend's Home Care application.

---

## Edge Functions Available

### 1. **send-appointment-reminder** ✅ FIXED & IMPROVED
**Purpose**: Sends 24-hour appointment reminders to customers
**Trigger**: Runs via cron job (scheduled)
**Language**: TypeScript/Deno

**Features**:
- ✅ Type-safe with interfaces
- ✅ Comprehensive error handling
- ✅ Bilingual email support (FR/EN)
- ✅ Detailed logging with emojis
- ✅ Input validation and sanitization
- ✅ Retry count tracking
- ✅ HTML email escaping to prevent XSS
- ✅ Graceful degradation when email service unavailable

---

### 2. **send-booking-confirmation**
**Purpose**: Sends booking confirmation emails to customers
**Trigger**: Called after booking creation
**Language**: TypeScript/Deno
**Features**: Rate limiting, input validation

---

### 3. **chat-support**
**Purpose**: Handles customer support chat messages
**Trigger**: REST API endpoint
**Language**: TypeScript/Deno

---

### 4. **send-notification**
**Purpose**: Generic notification sending
**Trigger**: Internal function calls
**Language**: TypeScript/Deno

---

### 5. **send-sms-notification**
**Purpose**: Sends SMS notifications
**Trigger**: Internal function calls
**Language**: TypeScript/Deno

---

### 6. **send-status-notification**
**Purpose**: Sends booking status change notifications
**Trigger**: Database triggers
**Language**: TypeScript/Deno

---

## Setup Instructions

### Step 1: Configure Environment Variables in Supabase

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Functions**
2. Set the following environment variables:

```env
# Required for all functions
SUPABASE_URL=https://ggsvvtzviwxpbjsnpzdv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# For email reminders
EMAIL_SERVICE_URL=https://your-email-service.com/send
EMAIL_SERVICE_KEY=your-email-service-api-key

# Optional: For different email providers
# SendGrid
SENDGRID_API_KEY=SG.xxx...
# Mailgun
MAILGUN_API_KEY=key-xxx...
MAILGUN_DOMAIN=mail.yourdomain.com
```

### Step 2: Deploy Functions

#### Option A: Deploy from Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy send-appointment-reminder
```

#### Option B: Deploy from Supabase Dashboard

1. Go to **Supabase Dashboard** → **Functions**
2. Click **Create a new function**
3. Copy the code from `supabase/functions/send-appointment-reminder/index.ts`
4. Paste and save

#### Option C: Deploy from VS Code

Use the Supabase extension:
1. Install: VS Code → Extensions → Search "Supabase"
2. Right-click function folder → **Deploy Function**

---

## Configuration

### Supabase Config File

The `supabase/config.toml` file registers functions:

```toml
project_id = "ggsvvtzviwxpbjsnpzdv"

[functions.send-appointment-reminder]
verify_jwt = false

[functions.send-booking-confirmation]
verify_jwt = false

[functions.chat-support]
verify_jwt = false
```

**Options**:
- `verify_jwt = false`: Allows unauthenticated access (good for webhooks/cron)
- `verify_jwt = true`: Requires valid JWT token (good for authenticated endpoints)

---

## Testing Edge Functions

### Test 1: Test send-appointment-reminder Locally

```bash
# Install Deno (if not installed)
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (using Scoop)
scoop install deno

# Run function locally
supabase functions serve send-appointment-reminder
```

Visit: `http://localhost:54321/functions/v1/send-appointment-reminder`

### Test 2: Manual Test via curl

```bash
# Test via curl
curl -X POST http://localhost:54321/functions/v1/send-appointment-reminder \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test 3: Verify in Production

```bash
# Call function from production
curl -X POST https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test 4: Check Logs

```bash
# View function logs in Supabase Dashboard
# Supabase Dashboard → Functions → send-appointment-reminder → Logs

# Or via Supabase CLI
supabase functions list
supabase functions download send-appointment-reminder
```

---

## Setting Up Cron Triggers

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/send-reminders-cron.yml`:

```yaml
name: Send Appointment Reminders

on:
  schedule:
    # Run every hour at minute 0 (0 0 * * * = every hour)
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call send-appointment-reminder function
        run: |
          curl -X POST \
            https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{}'
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Option B: External Cron Service (e.g., EasyCron.com)

1. Go to **EasyCron.com**
2. Create a new cron job
3. URL: `https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder`
4. Method: POST
5. Schedule: Every hour (or custom schedule)

### Option C: Node.js Cron (Local Development)

```bash
npm install node-cron

# Create cron-job.ts
import cron from 'node-cron';

cron.schedule('0 * * * *', async () => {
  const response = await fetch(
    'https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder',
    { method: 'POST' }
  );
  console.log('Reminder check run:', response.status);
});
```

---

## Email Service Configuration

### SendGrid Setup

1. Get API key from [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
2. Set environment variable: `SENDGRID_API_KEY=SG.xxx...`

**Deno Example**:
```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'noreply@lafriendsservices.com' },
    subject,
    content: [{ type: 'text/html', value: html }],
  }),
});
```

### Mailgun Setup

1. Get API key from [Mailgun Dashboard](https://app.mailgun.com/app/account/security/api_keys)
2. Set environment variables:
   - `MAILGUN_API_KEY=key-xxx...`
   - `MAILGUN_DOMAIN=mail.yourdomain.com`

**Deno Example**:
```typescript
const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  }),
});
```

### Custom Email Service

If using your own email service:

1. Implement HTTP endpoint that accepts:
```json
{
  "to": "customer@email.com",
  "subject": "Your email subject",
  "html": "<html>...</html>"
}
```

2. Return `200 OK` on success or error status on failure

3. Set `EMAIL_SERVICE_URL` to your endpoint

---

## Testing Checklist

### ✅ Pre-Deployment

- [ ] All imports are Deno-compatible (use esm.sh CDN)
- [ ] No Node.js-specific modules (fs, path, etc.)
- [ ] Environment variables are properly validated
- [ ] Error handling is comprehensive
- [ ] Logging is included for debugging
- [ ] Function has CORS headers configured
- [ ] TypeScript compiles without errors

### ✅ Post-Deployment

- [ ] Function appears in Supabase Dashboard
- [ ] Environment variables are set
- [ ] Function can be invoked manually
- [ ] Logs appear when function runs
- [ ] CORS headers work correctly
- [ ] Database queries return expected data
- [ ] Emails are being sent (check spam folder)
- [ ] Retry logic works on failures

### ✅ Production Testing

- [ ] Create test booking with future appointment
- [ ] Verify reminder created in `email_reminders` table
- [ ] Wait for cron to trigger (or manually call function)
- [ ] Check email inbox for reminder email
- [ ] Verify `email_reminders.status` changed to "sent"
- [ ] Check function logs for successful execution
- [ ] Test with invalid data (error handling)
- [ ] Test with missing email service (graceful failure)

---

## Troubleshooting

### Issue: "Missing environment variables"

**Solution**: Check Supabase Dashboard → Functions → Environment variables
```bash
# Verify via CLI
supabase secrets list
```

### Issue: "Module not found" error

**Solution**: Use esm.sh CDN for all imports
```typescript
// ❌ Wrong
import { serve } from "std/http";

// ✅ Correct
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
```

### Issue: Email not sending

**Solutions**:
1. Check `EMAIL_SERVICE_URL` is set
2. Check email service API key is valid
3. Check logs for error messages
4. Verify email format is valid
5. Check spam/junk folder
6. Try with test email service (logs to console)

### Issue: Function timing out

**Solution**: Increase timeout (Supabase default is 6 seconds)
- Add to `supabase/config.toml`:
```toml
[functions.send-appointment-reminder]
timeout_sec = 60
```

### Issue: CORS errors

**Solution**: Verify corsHeaders are set
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Return in responses
headers: { ...corsHeaders, "Content-Type": "application/json" }
```

### Issue: "Function not found" (404)

**Solution**: 
1. Verify function folder name matches config.toml
2. Verify `serve(handler)` is called at end of file
3. Redeploy function
4. Check Supabase Dashboard for function

---

## Monitoring & Logs

### View Logs in Supabase Dashboard

1. **Supabase Dashboard** → **Functions**
2. Click function name
3. View logs in real-time
4. Filter by date/status

### Structured Logging Example

```typescript
// Log with timestamp and emoji for easy scanning
console.log(`📧 Sending email to ${email}`);
console.log(`✅ Email sent successfully`);
console.log(`❌ Error: ${errorMessage}`);
console.log(`⏰ Processing took ${duration}ms`);
console.log(`📊 Summary: ${JSON.stringify(stats)}`);
```

### Monitor Function Health

Create a dashboard query:
```sql
-- Get function execution summary (if logging to table)
SELECT 
  function_name,
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration
FROM function_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name, status;
```

---

## Performance Optimization

### 1. Database Queries

✅ **Good**:
```typescript
const { data } = await supabase
  .from('email_reminders')
  .select('*')
  .eq('status', 'pending')
  .limit(10);
```

❌ **Bad**:
```typescript
// Fetches all reminders then filters in code
const { data } = await supabase
  .from('email_reminders')
  .select('*');
const pending = data.filter(r => r.status === 'pending');
```

### 2. Batch Processing

```typescript
// Process up to 10 reminders per execution
// Use queue system for larger volumes
const reminders = await supabase
  .from('email_reminders')
  .select('*')
  .eq('status', 'pending')
  .limit(10); // Process only 10 at a time
```

### 3. Connection Pooling

Supabase automatically pools connections. No additional configuration needed.

### 4. Caching

Use Deno's built-in caching:
```typescript
// Import once, reuse
const supabase = createClient(url, key);
```

---

## Security Best Practices

✅ **DO**:
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Validate all inputs (email, dates, etc.)
- Sanitize HTML in email templates
- Use HTTPS for all external calls
- Store sensitive data in environment variables
- Log security events for audit trail

❌ **DON'T**:
- Expose API keys in code
- Use `SUPABASE_ANON_KEY` for sensitive operations
- Trust user input without validation
- Log sensitive customer data
- Use unencrypted HTTP calls
- Commit secrets to version control

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] CORS headers set
- [ ] TypeScript types correct
- [ ] Deno compatibility verified
- [ ] Performance tested with sample data
- [ ] Security review completed
- [ ] Monitoring configured
- [ ] Rollback plan documented

---

## Reference: Quick Commands

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy send-appointment-reminder

# Serve locally
supabase functions serve

# List deployed functions
supabase functions list

# Download function code
supabase functions download send-appointment-reminder

# View logs
supabase functions logs send-appointment-reminder

# Test function
curl -X POST http://localhost:54321/functions/v1/send-appointment-reminder
```

---

## Support & Resources

- **Deno Docs**: https://deno.land/manual
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **esm.sh**: https://esm.sh (Deno module registry)
- **SendGrid Docs**: https://sendgrid.com/docs
- **Mailgun Docs**: https://documentation.mailgun.com

---

**Status**: ✅ READY FOR PRODUCTION
**Last Updated**: January 14, 2026
**Version**: 1.0
