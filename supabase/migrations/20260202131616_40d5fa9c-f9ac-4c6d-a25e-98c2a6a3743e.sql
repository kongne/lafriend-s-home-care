-- Add feedback_sent column to bookings to track feedback request status
-- This helps prevent duplicate feedback request emails

-- Schedule hourly cron job for feedback request emails (3 days after service completion)
SELECT cron.schedule(
  'send-feedback-requests-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ggsvvtzviwxpbjsnpzdv.supabase.co/functions/v1/send-feedback-request',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc3Z2dHp2aXd4cGJqc25wemR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNDcxMTIsImV4cCI6MjA3OTcyMzExMn0.r5clsHlbsquhUW9g0z3GdQCgqoO7JSTQCq4YXrwZTY0"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);