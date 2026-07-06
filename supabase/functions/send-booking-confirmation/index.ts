import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sendEmail, corsHeaders, checkRateLimit, verifyJwt } from "../_shared/email-service.ts";
import { brandedEmail } from "../_shared/email-templates.ts";

function respond(ok: boolean, payload: Record<string, unknown>, req: Request): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const userId = await verifyJwt(req);
    if (!userId) return respond(false, { error: "Unauthorized" }, req);

    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIP)) return respond(false, { error: "Too many requests" }, req);

    const rawText = await req.text();
    let parsedBody: unknown;
    try { parsedBody = rawText ? JSON.parse(rawText) : {}; } catch {
      return respond(false, { error: "Invalid JSON payload" }, req);
    }

    const validatedData = requestSchema.parse(parsedBody);
    const { clientEmail, clientName, serviceType, preferredDate, preferredTime, address, language, staffName, staffPhone } = validatedData;
    const isFrench = language === 'fr';

    const details = [
      { label: "Service", value: serviceType },
      { label: "Date", value: preferredDate },
      { label: isFrench ? "Heure" : "Time", value: preferredTime },
      { label: isFrench ? "Adresse" : "Address", value: address },
    ];
    if (staffName) {
      details.push({ label: isFrench ? "Technicien" : "Technician", value: staffName + (staffPhone ? ` (${staffPhone})` : "") });
    }
    const html = brandedEmail({
      language,
      preheader: isFrench ? "Votre réservation est confirmée" : "Your booking is confirmed",
      heroEmoji: "✅",
      greetingName: clientName,
      intro: isFrench
        ? "Nous sommes heureux de vous confirmer votre rendez-vous. Voici le récapitulatif."
        : "We are pleased to confirm your appointment. Here are the details.",
      detailsTitle: isFrench ? "Détails de la réservation" : "Booking details",
      details,
      ctaLabel: isFrench ? "Voir mes réservations" : "View my bookings",
      ctaUrl: "https://lafriendsservices.lovable.app/customer-portal",
    });
    const subject = isFrench ? `✅ Réservation Confirmée - ${serviceType}` : `✅ Booking Confirmed - ${serviceType}`;
    const emailResult = await sendEmail({ to: clientEmail, subject, html });

    if (!emailResult.success) {
      return respond(false, { error: emailResult.error || "Email send failed" }, req);
    }

    return respond(true, { data: { emailId: emailResult.messageId } }, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond(false, { error: "Invalid input", diagnostics: error.errors }, req);
    }
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" }, req);
  }
};

serve(handler);
