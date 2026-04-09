import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, escapeHtml, corsHeaders } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    const [bookingsResult, feedbackResult, referralsResult, contactsResult] = await Promise.all([
      supabase.from("bookings").select("*").gte("created_at", weekAgoStr),
      supabase.from("feedback_ratings").select("*").gte("created_at", weekAgoStr),
      supabase.from("referrals").select("*").gte("created_at", weekAgoStr),
      supabase.from("contact_submissions").select("*").gte("created_at", weekAgoStr),
    ]);

    const bookings = bookingsResult.data || [];
    const feedback = feedbackResult.data || [];
    const referrals = referralsResult.data || [];
    const contacts = contactsResult.data || [];

    const newBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;
    const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "N/A";

    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (!adminRoles?.length) return respond(true, { data: { message: "No admins" } });

    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) adminEmails.push(userData.user.email);
    }

    const { data: staffEmails } = await supabase.from("staff_emails").select("email").eq("is_active", true);
    const allRecipients = [...new Set([...adminEmails, ...(staffEmails || []).map(s => s.email)])];

    if (!allRecipients.length) return respond(true, { data: { message: "No recipients" } });

    const formatDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:#1a1a2e;color:#fff;padding:30px;text-align:center">
            <h1 style="margin:0;font-size:24px">📊 Résumé Hebdomadaire</h1>
            <p style="margin:8px 0 0;color:#e8b931;">${formatDate(weekAgo)} — ${formatDate(now)}</p>
          </div>
          <div style="padding:30px">
            <table width="100%" cellpadding="0" cellspacing="10">
              <tr>
                <td style="background:#f0f9ff;padding:15px;border-radius:8px;text-align:center;width:50%">
                  <div style="font-size:28px;font-weight:bold;color:#1a1a2e">${newBookings}</div>
                  <div style="color:#666;font-size:12px">Nouvelles réservations</div>
                </td>
                <td style="background:#f0fdf4;padding:15px;border-radius:8px;text-align:center;width:50%">
                  <div style="font-size:28px;font-weight:bold;color:#16a34a">${completedBookings}</div>
                  <div style="color:#666;font-size:12px">Terminées</div>
                </td>
              </tr>
              <tr>
                <td style="background:#fffbeb;padding:15px;border-radius:8px;text-align:center">
                  <div style="font-size:28px;font-weight:bold;color:#d97706">${pendingBookings}</div>
                  <div style="color:#666;font-size:12px">En attente</div>
                </td>
                <td style="background:#fef2f2;padding:15px;border-radius:8px;text-align:center">
                  <div style="font-size:28px;font-weight:bold;color:#dc2626">${cancelledBookings}</div>
                  <div style="color:#666;font-size:12px">Annulées</div>
                </td>
              </tr>
            </table>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0">
              <h3 style="margin:0 0 8px;color:#1a1a2e">⭐ Avis: ${feedback.length} reçus — Note: ${avgRating}/5</h3>
            </div>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0">
              <h3 style="margin:0 0 8px;color:#1a1a2e">🤝 Parrainages: ${referrals.length} — 📬 Messages: ${contacts.length}</h3>
            </div>
          </div>
          <div style="background:#f4f4f4;padding:20px;text-align:center;color:#999;font-size:12px">
            <p>LaFriend's Services — Bafoussam, Cameroun</p>
          </div>
        </div>
      </body></html>`;

    const result = await sendEmail({ to: allRecipients, subject: `📊 Résumé Hebdomadaire — ${formatDate(weekAgo)} au ${formatDate(now)}`, html });

    return respond(true, { data: { recipients: allRecipients.length, emailSent: result.success } });
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
});
