import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const checkRateLimit = (ip: string, max = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const r = rateLimitStore.get(ip);
  if (!r || now > r.resetTime) { rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs }); return true; }
  if (r.count >= max) return false;
  r.count++;
  return true;
};

const sanitizeString = (val: string) => val.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim();

const requestSchema = z.object({
  clientEmail: z.string().email().max(255).transform((v: string) => v.toLowerCase().trim()),
  clientName: z.string().min(1).max(100).transform(sanitizeString),
  serviceType: z.string().min(1).max(100).transform(sanitizeString),
  preferredDate: z.string().min(1).max(50).transform(sanitizeString),
  preferredTime: z.string().min(1).max(50).transform(sanitizeString),
  address: z.string().min(1).max(500).transform(sanitizeString),
  language: z.enum(["fr", "en"]).default("fr"),
  staffName: z.string().max(100).optional().transform((v?: string) => v ? sanitizeString(v) : undefined),
  staffPhone: z.string().max(50).optional().transform((v?: string) => v ? sanitizeString(v) : undefined),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return respond(false, { error: 'Missing Authorization header' });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) return respond(false, { error: 'Unauthorized: Invalid token' });

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasRole } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasRole) return respond(false, { error: 'Admin access required' });

    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIP)) return respond(false, { error: "Too many requests" });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return respond(false, { error: "Email service not configured" });

    const rawText = await req.text();
    let parsedBody: unknown;
    try { parsedBody = rawText ? JSON.parse(rawText) : {}; } catch (e) {
      return respond(false, { error: "Invalid JSON payload" });
    }

    const validatedData = requestSchema.parse(parsedBody);
    const { clientEmail, clientName, serviceType, preferredDate, preferredTime, address, language, staffName, staffPhone } = validatedData;
    const isFrench = language === 'fr';

    const staffSection = staffName ? `
      <div style="background:#e8f5e9;border-radius:12px;padding:20px;margin:20px 0;">
        <h3 style="color:#2e7d32;margin-top:0;font-size:16px;">${isFrench ? '👤 Votre technicien assigné' : '👤 Your Assigned Technician'}</h3>
        <p style="margin:8px 0;"><strong>${isFrench ? 'Nom' : 'Name'}:</strong> ${staffName}</p>
        ${staffPhone ? `<p style="margin:8px 0;"><strong>${isFrench ? 'Téléphone' : 'Phone'}:</strong> ${staffPhone}</p>` : ''}
      </div>` : '';

    const subject = isFrench ? `✅ Réservation Confirmée - ${serviceType}` : `✅ Booking Confirmed - ${serviceType}`;

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:white;padding:40px 20px;text-align:center;">
            <h1 style="margin:0;color:#f5c542;font-size:28px;">LaFriend's Services</h1>
            <p style="margin:10px 0 0;opacity:0.9;">${isFrench ? 'Votre réservation est confirmée!' : 'Your booking is confirmed!'}</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;">${isFrench ? `Bonjour ${clientName},` : `Hello ${clientName},`}</h2>
            <p style="color:#555;line-height:1.6;">${isFrench ? 'Nous sommes heureux de vous confirmer votre rendez-vous.' : 'We are pleased to confirm your appointment.'}</p>
            <div style="background:#f8f9fa;border-radius:12px;padding:25px;margin:25px 0;">
              <h3 style="color:#1a1a2e;">${isFrench ? '📋 Détails' : '📋 Details'}</h3>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Date:</strong> ${preferredDate}</p>
              <p><strong>${isFrench ? 'Heure' : 'Time'}:</strong> ${preferredTime}</p>
              <p><strong>${isFrench ? 'Adresse' : 'Address'}:</strong> ${address}</p>
            </div>
            ${staffSection}
            <div style="text-align:center;margin-top:30px;">
              <a href="https://lafriendsservices.lovable.app" style="display:inline-block;background:#f5c542;color:#1a1a2e;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">${isFrench ? 'Visitez notre site' : 'Visit our website'}</a>
            </div>
          </div>
          <div style="background:#1a1a2e;color:white;padding:25px;text-align:center;">
            <p style="margin:0;font-size:14px;opacity:0.9;">${isFrench ? 'Merci de votre confiance!' : 'Thank you for your trust!'}</p>
            <p style="margin:10px 0 0;font-size:12px;opacity:0.7;">📞 +237 693 13 82 92 | 📍 Bafoussam, Cameroun</p>
          </div>
        </div>
      </body></html>`;

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "LaFriend's Services <onboarding@resend.dev>";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: [clientEmail], subject, html: htmlContent }),
    });

    if (!emailResponse.ok) {
      let errorDetails;
      try { errorDetails = await emailResponse.json(); } catch { errorDetails = { message: "Unknown" }; }
      return respond(false, { error: "Email send failed", diagnostics: errorDetails });
    }

    const emailResult = await emailResponse.json();
    return respond(true, { data: { emailId: emailResult.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond(false, { error: "Invalid input", diagnostics: error.errors });
    }
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
