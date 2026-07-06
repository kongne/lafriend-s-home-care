import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { sendEmail, escapeHtml, corsHeaders, verifyCronSecret, verifyJwt } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>, req: Request): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !supabaseKey) throw new Error("Missing env vars");
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
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
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const { data: completedBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, full_name, email, service_type, preferred_date, updated_at")
      .eq("status", "completed")
      .gte("updated_at", fourDaysAgo.toISOString())
      .lte("updated_at", threeDaysAgo.toISOString())
      .limit(20);

    if (fetchError) throw fetchError;
    if (!completedBookings?.length) return respond(true, { data: { message: "No feedback requests", processed: 0 } }, req);

    let sent = 0, failed = 0;

    for (const booking of completedBookings) {
      try {
        const { data: existing } = await supabase.from("email_reminders").select("id").eq("booking_id", booking.id).eq("reminder_type", "feedback").single();
        if (existing) continue;

        const emailHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
          <body style="font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:30px;text-align:center;">
                <h1 style="margin:0;color:#f5c542;">LaFriend's Services</h1>
                <p style="margin:10px 0 0;opacity:0.9;">Votre avis compte!</p>
              </div>
              <div style="padding:30px;">
                <h2 style="color:#1a1a2e;">Bonjour ${escapeHtml(booking.full_name)},</h2>
                <p style="color:#555;">Nous espérons que vous avez apprécié notre service de <strong>${escapeHtml(booking.service_type)}</strong>.</p>
                <div style="text-align:center;font-size:48px;margin:20px 0;">⭐⭐⭐⭐⭐</div>
                <div style="text-align:center;margin:30px 0;">
                  <a href="https://lafriendsservices.lovable.app/customer-portal" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f5c542,#f59e0b);color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:600;">Donner mon avis</a>
                </div>
              </div>
              <div style="background:#1a1a2e;color:white;padding:20px;text-align:center;font-size:14px;">
                <p style="margin:0;">© ${new Date().getFullYear()} LaFriend's Services</p>
              </div>
            </div>
          </body></html>`;

        const emailResult = await sendEmail({ to: booking.email, subject: "⭐ Votre avis compte! - LaFriend's Services", html: emailHtml });

        await supabase.from("email_reminders").insert({
          booking_id: booking.id, email: booking.email, reminder_type: "feedback",
          scheduled_send_time: now.toISOString(), status: emailResult.success ? "sent" : "failed",
          sent_at: emailResult.success ? now.toISOString() : null, last_error: emailResult.error || null,
        });

        if (emailResult.success) sent++; else failed++;
      } catch (error) { failed++; }
    }

    return respond(true, { data: { processed: completedBookings.length, sent, failed } }, req);
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" }, req);
  }
};

serve(handler);
