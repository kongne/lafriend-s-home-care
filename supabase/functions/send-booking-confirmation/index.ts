import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sendEmail, corsHeaders, checkRateLimit } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

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
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIP)) return respond(false, { error: "Too many requests" });

    const rawText = await req.text();
    let parsedBody: unknown;
    try { parsedBody = rawText ? JSON.parse(rawText) : {}; } catch {
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

    const emailResult = await sendEmail({ to: clientEmail, subject, html: htmlContent });

    if (!emailResult.success) {
      return respond(false, { error: emailResult.error || "Email send failed" });
    }

    return respond(true, { data: { emailId: emailResult.messageId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond(false, { error: "Invalid input", diagnostics: error.errors });
    }
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
