import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, escapeHtml, corsHeaders } from "../_shared/email-service.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get date range for the past week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    // Fetch weekly stats in parallel
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

    // Calculate stats
    const newBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

    const avgRating = feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : "N/A";

    const newReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === "completed").length;

    const unreadContacts = contacts.filter(c => c.status === "unread").length;

    // Service breakdown
    const serviceBreakdown: Record<string, number> = {};
    bookings.forEach(b => {
      serviceBreakdown[b.service_type] = (serviceBreakdown[b.service_type] || 0) + 1;
    });

    const serviceRows = Object.entries(serviceBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(type)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${count}</td></tr>`)
      .join("");

    // Format dates
    const formatDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ message: "No admins to notify" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    for (const role of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    // Also get staff emails
    const { data: staffEmails } = await supabase.from("staff_emails").select("email").eq("is_active", true);
    const allRecipients = [...new Set([...adminEmails, ...(staffEmails || []).map(s => s.email)])];

    if (allRecipients.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
    <div style="background:#1a1a2e;color:#fff;padding:30px;text-align:center">
      <h1 style="margin:0;font-size:24px">📊 Résumé Hebdomadaire</h1>
      <p style="margin:8px 0 0;color:#e8b931;font-size:14px">${formatDate(weekAgo)} — ${formatDate(now)}</p>
    </div>
    
    <div style="padding:30px">
      <!-- KPIs -->
      <table width="100%" cellpadding="0" cellspacing="10" style="margin-bottom:20px">
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

      <!-- Feedback -->
      <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px">
        <h3 style="margin:0 0 8px;color:#1a1a2e">⭐ Avis clients</h3>
        <p style="margin:0;color:#666">${feedback.length} avis reçus — Note moyenne: <strong>${avgRating}/5</strong></p>
      </div>

      <!-- Referrals -->
      <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px">
        <h3 style="margin:0 0 8px;color:#1a1a2e">🤝 Parrainages</h3>
        <p style="margin:0;color:#666">${newReferrals} nouveaux — ${completedReferrals} complétés</p>
      </div>

      <!-- Messages -->
      <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px">
        <h3 style="margin:0 0 8px;color:#1a1a2e">📬 Messages</h3>
        <p style="margin:0;color:#666">${contacts.length} reçus — ${unreadContacts} non lus</p>
      </div>

      ${serviceRows ? `
      <!-- Service Breakdown -->
      <h3 style="margin:20px 0 10px;color:#1a1a2e">📋 Répartition par service</h3>
      <table width="100%" style="border-collapse:collapse">
        <tr style="background:#1a1a2e;color:#fff">
          <th style="padding:8px;text-align:left">Service</th>
          <th style="padding:8px;text-align:center">Réservations</th>
        </tr>
        ${serviceRows}
      </table>
      ` : ""}
    </div>

    <div style="background:#f4f4f4;padding:20px;text-align:center;color:#999;font-size:12px">
      <p>Ce résumé est envoyé chaque lundi à 8h.</p>
      <p>LaFriend's Services Ménagers — Bafoussam, Cameroun</p>
    </div>
  </div>
</body>
</html>`;

    const result = await sendEmail({
      to: allRecipients,
      subject: `📊 Résumé Hebdomadaire — ${formatDate(weekAgo)} au ${formatDate(now)}`,
      html,
    });

    console.log(`✅ Weekly digest sent to ${allRecipients.length} recipients:`, result);

    return new Response(
      JSON.stringify({ success: true, recipients: allRecipients.length, stats: { newBookings, completedBookings, pendingBookings, feedback: feedback.length, referrals: newReferrals } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Weekly digest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
