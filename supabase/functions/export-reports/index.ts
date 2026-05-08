import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
};

const toCsv = (rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string => {
  const BOM = "\uFEFF";
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c.key])).join(",")).join("\n");
  return BOM + header + "\n" + body;
};

const REPORT_COLUMNS: Record<string, { key: string; label: string }[]> = {
  bookings: [
    { key: "id", label: "ID" },
    { key: "full_name", label: "Nom complet" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "address", label: "Adresse" },
    { key: "service_type", label: "Service" },
    { key: "preferred_date", label: "Date" },
    { key: "preferred_time", label: "Heure" },
    { key: "status", label: "Statut" },
    { key: "is_recurring", label: "Récurrent" },
    { key: "recurrence_type", label: "Fréquence" },
    { key: "discount_amount", label: "Remise (FCFA)" },
    { key: "points_redeemed", label: "Points utilisés" },
    { key: "created_at", label: "Créé le" },
  ],
  contacts: [
    { key: "full_name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "subject", label: "Sujet" },
    { key: "message", label: "Message" },
    { key: "status", label: "Statut" },
    { key: "created_at", label: "Créé le" },
  ],
  subscribers: [
    { key: "email", label: "Email" },
    { key: "subscribed_at", label: "Inscription" },
    { key: "is_active", label: "Actif" },
  ],
  loyalty: [
    { key: "user_id", label: "Utilisateur" },
    { key: "transaction_type", label: "Type" },
    { key: "points", label: "Points" },
    { key: "balance_after", label: "Solde" },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Date" },
  ],
  referrals: [
    { key: "referral_code", label: "Code" },
    { key: "referrer_id", label: "Parrain" },
    { key: "referred_email", label: "Filleul (email)" },
    { key: "status", label: "Statut" },
    { key: "bonus_points", label: "Points bonus" },
    { key: "completed_at", label: "Complété le" },
    { key: "created_at", label: "Créé le" },
  ],
  revenue: [
    { key: "month", label: "Mois" },
    { key: "total_bookings", label: "Réservations" },
    { key: "completed", label: "Complétées" },
    { key: "estimated_revenue", label: "Revenu estimé (FCFA)" },
    { key: "discounts", label: "Remises (FCFA)" },
  ],
};

const SERVICE_PRICE: Record<string, number> = {
  "Nettoyage Standard": 50000,
  "Nettoyage Approfondi": 80000,
  "Nettoyage de Déménagement": 120000,
  "Nettoyage de Bureau": 100000,
  "Lavage de Vitres": 40000,
  "Nettoyage de Tapis": 60000,
};
const priceFor = (s: string) => SERVICE_PRICE[s] ?? 50000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return respond(false, { error: "Unauthorized" });

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return respond(false, { error: "Unauthorized" });

    const admin = createClient(supabaseUrl, service);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return respond(false, { error: "Forbidden" });

    const url = new URL(req.url);
    const type = (url.searchParams.get("type") || "bookings").toLowerCase();

    let rows: Record<string, unknown>[] = [];

    if (type === "bookings") {
      const { data } = await admin.from("bookings").select("*").order("created_at", { ascending: false });
      rows = data || [];
    } else if (type === "contacts") {
      const { data } = await admin.from("contact_submissions").select("*").order("created_at", { ascending: false });
      rows = data || [];
    } else if (type === "subscribers") {
      const { data } = await admin.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
      rows = data || [];
    } else if (type === "loyalty") {
      const { data } = await admin.from("loyalty_transactions").select("*").order("created_at", { ascending: false });
      rows = data || [];
    } else if (type === "referrals") {
      const { data } = await admin.from("referrals").select("*").order("created_at", { ascending: false });
      rows = data || [];
    } else if (type === "revenue") {
      const { data: bookings } = await admin.from("bookings").select("status,service_type,discount_amount,preferred_date");
      const groups: Record<string, { total: number; completed: number; revenue: number; discounts: number }> = {};
      for (const b of bookings || []) {
        const month = (b.preferred_date as string)?.slice(0, 7) || "unknown";
        groups[month] ??= { total: 0, completed: 0, revenue: 0, discounts: 0 };
        groups[month].total++;
        if (b.status === "completed") {
          groups[month].completed++;
          groups[month].revenue += priceFor(b.service_type as string) - Number(b.discount_amount || 0);
        }
        groups[month].discounts += Number(b.discount_amount || 0);
      }
      rows = Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, v]) => ({
          month,
          total_bookings: v.total,
          completed: v.completed,
          estimated_revenue: v.revenue,
          discounts: v.discounts,
        }));
    } else {
      return respond(false, { error: "Unknown report type" });
    }

    const csv = toCsv(rows, REPORT_COLUMNS[type]);
    const filename = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    // Audit log
    await admin.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "export_report",
      category: "admin",
      metadata: { type, rows: rows.length, filename },
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    });

    return respond(true, { data: { csv, filename, rows: rows.length } });
  } catch (e) {
    return respond(false, { error: e instanceof Error ? e.message : "Server error" });
  }
});