import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sendEmail, corsHeaders, checkRateLimit, escapeHtml, verifyJwt } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const sanitizeString = (val: string) => val.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim();

const bookingDataSchema = z.object({
  full_name: z.string().min(1).max(100).transform(sanitizeString),
  email: z.string().email().max(255).transform(val => val.toLowerCase().trim()),
  phone: z.string().min(1).max(30).transform(sanitizeString),
  subject: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : val),
  message: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  service_type: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : val),
  preferred_date: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : val),
  preferred_time: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : val),
  address: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : val),
});

const requestSchema = z.object({
  type: z.enum(["booking", "contact"]),
  data: bookingDataSchema,
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIP)) return respond(false, { error: "Too many requests" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require authenticated admin to dispatch staff notifications
    const userId = await verifyJwt(req);
    if (!userId) return respond(false, { error: "Unauthorized" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return respond(false, { error: "Forbidden: admin role required" });

    const rawBody = await req.json();
    const parseResult = requestSchema.safeParse(rawBody);
    if (!parseResult.success) return respond(false, { error: "Invalid input", diagnostics: parseResult.error.errors });

    const { type, data } = parseResult.data;

    const { data: staffEmails, error: staffError } = await supabase.from("staff_emails").select("email, name").eq("is_active", true);
    if (staffError || !staffEmails?.length) return respond(true, { data: { message: "No staff emails configured" } });

    const recipientEmails = staffEmails.map(s => s.email);

    let subject: string;
    let htmlContent: string;

    if (type === "booking") {
      subject = `🗓️ Nouvelle Réservation - ${escapeHtml(data.service_type)}`;
      htmlContent = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;color:#f5c542;">LaFriend's Services</h1>
        </div>
        <div style="padding:30px;background:#f9f9f9;">
          <h2 style="color:#1a1a2e;">Nouvelle Réservation</h2>
          <p><strong>Client:</strong> ${escapeHtml(data.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Tél:</strong> ${escapeHtml(data.phone)}</p>
          <p><strong>Service:</strong> ${escapeHtml(data.service_type)}</p>
          <p><strong>Date:</strong> ${escapeHtml(data.preferred_date)} à ${escapeHtml(data.preferred_time)}</p>
          <p><strong>Adresse:</strong> ${escapeHtml(data.address)}</p>
          ${data.message ? `<p><strong>Message:</strong> ${escapeHtml(data.message)}</p>` : ''}
        </div>
      </div>`;
    } else {
      subject = `📩 Nouveau Message - ${escapeHtml(data.subject)}`;
      htmlContent = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:20px;text-align:center;">
          <h1 style="margin:0;color:#f5c542;">LaFriend's Services</h1>
        </div>
        <div style="padding:30px;background:#f9f9f9;">
          <h2 style="color:#1a1a2e;">${escapeHtml(data.subject)}</h2>
          <p><strong>De:</strong> ${escapeHtml(data.full_name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Message:</strong> ${escapeHtml(data.message)}</p>
        </div>
      </div>`;
    }

    const result = await sendEmail({ to: recipientEmails, subject, html: htmlContent });
    return respond(true, { data: { emailSent: result.success } });
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
