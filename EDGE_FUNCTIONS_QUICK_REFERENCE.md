# Edge Functions Quick Reference

## Fixed send-appointment-reminder Function

### Key Improvements ✅

| Issue | Fix |
|-------|-----|
| Missing types | Added TypeScript interfaces |
| No env validation | Explicit error if missing |
| Poor error handling | Detailed error responses |
| No email validation | Validates format before sending |
| No XSS protection | Added HTML escape function |
| Single language | Bilingual (FR/EN) support |
| Basic logging | Structured logging with emojis |
| No input sanitization | Safe string handling |
| Broken retry logic | Fixed retry_count handling |
| No field validation | Validates required fields |

---

## Quick Deploy

### 1. Deploy Function
```bash
supabase functions deploy send-appointment-reminder
```

### 2. Set Environment Variables
```
SUPABASE_URL=https://ggsvvtzviwxpbjsnpzdv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
EMAIL_SERVICE_URL=https://your-email-service.com/send
EMAIL_SERVICE_KEY=your-api-key
```

### 3. Test
```bash
curl -X POST \
  https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder \
  -H "Content-Type: application/json"
```

### 4. Setup Cron (GitHub Actions)
Create `.github/workflows/send-reminders.yml`:
```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-appointment-reminder
```

---

## Function Behavior

### Input
HTTP POST request (no body required)

### Processing
1. Fetches pending reminders within next hour
2. Validates booking data exists
3. Generates email (bilingual)
4. Sends via email service
5. Updates status (sent/failed)
6. Returns summary

### Output
```json
{
  "message": "Reminder processing completed",
  "processed": 2,
  "sent": 2,
  "failed": 0,
  "timestamp": "2026-01-14T10:30:45.123Z"
}
```

### Logs
```
📧 Send appointment reminder function called
⏰ Checking for reminders between ... and ...
📨 Found 2 reminder(s) to process
Processing reminder for booking abc123 (John Doe)
✅ Reminder sent to john@example.com
📊 Summary: {"processed":1,"sent":1,"failed":0}
```

---

## Email Format

### Template Variables
- `${customerName}` - Full name
- `${serviceType}` - Service type (e.g., "Nettoyage complet")
- `${appointmentDate}` - Date (e.g., "2026-01-15")
- `${appointmentTime}` - Time (e.g., "14:00")
- `${address}` - Delivery address

### Languages
- **French** (default): "Rappel de Rendez-vous"
- **English**: "Appointment Reminder"

### Design
- Gradient header (purple)
- Responsive layout
- Mobile-optimized
- Professional styling

---

## Error Handling

### Missing Environment Variables
```
Error: Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
```

### Email Service Down
```
last_error: "Email service not configured"
status: "failed"
```

### Invalid Email
```
last_error: "Invalid email address"
status: "failed"
```

### Booking Not Found
```
last_error: "Booking not found"
status: "failed"
```

---

## File Locations

- **Function**: `supabase/functions/send-appointment-reminder/index.ts`
- **Config**: `supabase/config.toml`
- **Setup Guide**: `EDGE_FUNCTIONS_SETUP.md`
- **Fixes Summary**: `EDGE_FUNCTIONS_FIXES.md`

---

## Testing Checklist

- [ ] Function deployed successfully
- [ ] Environment variables set
- [ ] Function invokable in Supabase Dashboard
- [ ] Test with POST request (no body)
- [ ] Check logs appear in real-time
- [ ] Create test booking with future date
- [ ] Verify reminder created in database
- [ ] Run function manually
- [ ] Verify email in inbox/spam
- [ ] Check reminder marked as "sent"
- [ ] Test error scenarios
- [ ] Setup cron job

---

## Support

For detailed setup and troubleshooting, see:
- **Setup**: [EDGE_FUNCTIONS_SETUP.md](EDGE_FUNCTIONS_SETUP.md)
- **Fixes**: [EDGE_FUNCTIONS_FIXES.md](EDGE_FUNCTIONS_FIXES.md)

---

**Status**: ✅ FIXED & READY
**Updated**: January 14, 2026
