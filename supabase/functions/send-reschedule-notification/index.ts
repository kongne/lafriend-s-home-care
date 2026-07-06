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

const sanitize = (s: string) => s.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim();

const schema = z.object({
  clientEmail: z.string().email().max(255).transform((v: string) => v.toLowerCase().trim()),
  clientName: z.string().min(1).max(100).transform(sanitize),
  serviceType: z.string().min(1).max(100).transform(sanitize),
  oldDate: z.string().min(1).max(50).transform(sanitize),
  oldTime: z.string().min(1).max(50).transform(sanitize),
  newDate: z.string().min(1).max(50).transform(sanitize),
  newTime: z.string().min(1).max(50).transform(sanitize),
  address: z.string().min(1).max(500).transform(sanitize),
  language: z.enum(["fr", "en"]).default("fr"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) return respond(false, { error: "Too many requests" }, req);

    const userId = await verifyJwt(req);
    if (!userId) return respond(false, { error: "Unauthorized" }, req);

    const raw = await req.text();
    let body: unknown;
    try { body = raw ? JSON.parse(raw) : {}; } catch { return respond(false, { error: "Invalid JSON" }, req); }

    const data = schema.parse(body);
    const isFr = data.language === "fr";

    const html = brandedEmail({
      language: data.language,
      preheader: isFr ? "Votre rendez-vous a été replanifié" : "Your appointment has been rescheduled",
      heroEmoji: "📅",
      greetingName: data.clientName,
      intro: isFr
        ? "Votre rendez-vous a bien été replanifié. Voici le récapitulatif de la nouvelle date."
        : "Your appointment has been successfully rescheduled. Here are the new details.",
      detailsTitle: isFr ? "Nouvelle réservation" : "New appointment",
      details: [
        { label: "Service", value: data.serviceType },
        { label: isFr ? "Ancienne date" : "Previous date", value: `${data.oldDate} • ${data.oldTime}` },
        { label: isFr ? "Nouvelle date" : "New date", value: `${data.newDate} • ${data.newTime}` },
        { label: isFr ? "Adresse" : "Address", value: data.address },
      ],
      noticeHtml: `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;color:#92400e;font-size:13px;">${isFr ? "💡 Pensez à confirmer votre disponibilité 24h avant le rendez-vous." : "💡 Please confirm your availability 24h before the appointment."}</div>`,
      ctaLabel: isFr ? "Voir mes réservations" : "View my bookings",
      ctaUrl: "https://lafriendsservices.lovable.app/customer-portal",
    });

    const subject = isFr ? `📅 Rendez-vous replanifié - ${data.newDate}` : `📅 Appointment rescheduled - ${data.newDate}`;
    const result = await sendEmail({ to: data.clientEmail, subject, html });
    if (!result.success) return respond(false, { error: result.error || "Email failed" }, req);
    return respond(true, { data: { messageId: result.messageId } }, req);
  } catch (e) {
    if (e instanceof z.ZodError) return respond(false, { error: "Invalid input", diagnostics: e.errors }, req);
    return respond(false, { error: e instanceof Error ? e.message : "Unknown error" }, req);
  }
});