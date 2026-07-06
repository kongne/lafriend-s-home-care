import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmail, sendSms, escapeHtml, corsHeaders, verifyCronSecret, verifyJwt } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>, req: Request): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

interface EmailReminder {
  id: string;
  booking_id: string;
  email: string;
  reminder_type: string;
  scheduled_send_time: string;
  status: string;
  retry_count: number;
  bookings?: BookingData | BookingData[];
}

interface BookingData {
  id: string;
  full_name: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  address: string;
  phone?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !supabaseKey) throw new Error("Missing env vars");
const supabase = createClient(supabaseUrl, supabaseKey);

const generateReminderEmail = (name: string, service: string, date: string, time: string, address: string): string => {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:30px;text-align:center;">
          <h1 style="margin:0;color:#f5c542;font-size:28px;">⏰ Rappel de Rendez-vous</h1>
        </div>
        <div style="padding:30px;">
          <p>Bonjour <strong>${escapeHtml(name)}</strong>,</p>
          <p>Nous vous rappelons votre rendez-vous de nettoyage prévu demain !</p>
          <div style="background:#f9f9f9;border-left:4px solid #f5c542;padding:15px;border-radius:4px;margin:20px 0;">
            <p><strong>Service:</strong> ${escapeHtml(service)}</p>
            <p><strong>Date:</strong> ${escapeHtml(date)} à ${escapeHtml(time)}</p>
            <p><strong>Lieu:</strong> ${escapeHtml(address)}</p>
          </div>
          <p style="color:#555;">Si vous devez reprogrammer, contactez-nous dès que possible.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://lafriendsservices.lovable.app/customer-portal" style="display:inline-block;padding:12px 30px;background:#f5c542;color:#1a1a2e;text-decoration:none;border-radius:5px;font-weight:600;">Mon Espace</a>
          </div>
        </div>
        <div style="background:#1a1a2e;color:white;padding:20px;text-align:center;font-size:12px;">
          <p style="margin:0;">LaFriend's Services — Bafoussam, Cameroun</p>
        </div>
      </div>
    </body></html>`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("📧 Send appointment reminder function called");

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return respond(false, { error: "Method not allowed" }, req);

  try {
    const isCron = verifyCronSecret(req);
    if (!isCron) {
      const userId = await verifyJwt(req);
      if (!userId) return respond(false, { error: "Unauthorized" }, req);
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) return respond(false, { error: "Forbidden" }, req);
    }

    const now = new Date();
    const checkWindow = new Date(now.getTime() + 60 * 60 * 1000);

    console.log(`⏰ Checking reminders between ${now.toISOString()} and ${checkWindow.toISOString()}`);

    const { data: reminders, error: fetchError } = await supabase
      .from("email_reminders")
      .select(`id, booking_id, email, reminder_type, scheduled_send_time, status, retry_count, bookings(id, full_name, service_type, preferred_date, preferred_time, address, phone)`)
      .eq("status", "pending")
      .lte("scheduled_send_time", checkWindow.toISOString())
      .gte("scheduled_send_time", now.toISOString())
      .limit(10);

    if (fetchError) throw fetchError;
    if (!reminders?.length) {
      console.log("ℹ️  No reminders to process");
      return respond(true, { data: { message: "No reminders", processed: 0 } }, req);
    }

    let sent = 0, failed = 0;

    for (const reminder of reminders as EmailReminder[]) {
      try {
        const booking = reminder.bookings as BookingData | undefined;
        if (!booking) throw new Error("Booking not found");

        const emailHtml = generateReminderEmail(booking.full_name, booking.service_type, booking.preferred_date, booking.preferred_time, booking.address);
        const emailResult = await sendEmail({ to: reminder.email, subject: `Rappel: Rendez-vous de nettoyage demain`, html: emailHtml });

        let smsResult = { success: false };
        if (booking.phone) {
          smsResult = await sendSms(booking.phone, `⏰ LaFriend's Rappel: Votre RDV est demain ${booking.preferred_date} à ${booking.preferred_time}. Service: ${booking.service_type}.`);
        }

        const success = emailResult.success || smsResult.success;
        await supabase.from("email_reminders").update({
          status: success ? "sent" : "failed",
          sent_at: success ? now.toISOString() : null,
          last_error: success ? null : `Email: ${emailResult.error || 'N/A'}, SMS: N/A`,
          retry_count: (reminder.retry_count || 0) + 1,
        }).eq("id", reminder.id);

        if (success) sent++; else failed++;
      } catch (error) {
        await supabase.from("email_reminders").update({
          status: "failed",
          last_error: error instanceof Error ? error.message : String(error),
          retry_count: (reminder.retry_count || 0) + 1,
        }).eq("id", reminder.id);
        failed++;
      }
    }

    return respond(true, { data: { processed: reminders.length, sent, failed } }, req);
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" }, req);
  }
};

serve(handler);
