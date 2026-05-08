import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sendEmail, corsHeaders, checkRateLimit } from "../_shared/email-service.ts";
import { brandedEmail } from "../_shared/email-templates.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const sanitize = (s: string) => s.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim();

const schema = z.object({
  clientEmail: z.string().email().max(255).transform((v: string) => v.toLowerCase().trim()),
  clientName: z.string().min(1).max(100).transform(sanitize),
  serviceType: z.string().min(1).max(100).transform(sanitize),
  preferredDate: z.string().min(1).max(50).transform(sanitize),
  preferredTime: z.string().min(1).max(50).transform(sanitize),
  reason: z.string().max(500).optional().transform((v?: string) => v ? sanitize(v) : undefined),
  refundInfo: z.string().max(300).optional().transform((v?: string) => v ? sanitize(v) : undefined),
  language: z.enum(["fr", "en"]).default("fr"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) return respond(false, { error: "Too many requests" });

    const raw = await req.text();
    let body: unknown;
    try { body = raw ? JSON.parse(raw) : {}; } catch { return respond(false, { error: "Invalid JSON" }); }

    const data = schema.parse(body);
    const isFr = data.language === "fr";

    const noticeBits: string[] = [];
    if (data.reason) noticeBits.push(`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;color:#991b1b;font-size:13px;margin-bottom:10px;"><strong>${isFr ? "Motif" : "Reason"}:</strong> ${data.reason}</div>`);
    if (data.refundInfo) noticeBits.push(`<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;color:#065f46;font-size:13px;"><strong>${isFr ? "Remboursement" : "Refund"}:</strong> ${data.refundInfo}</div>`);

    const html = brandedEmail({
      language: data.language,
      preheader: isFr ? "Votre réservation a été annulée" : "Your booking has been cancelled",
      heroEmoji: "❌",
      heroBg: "linear-gradient(135deg,#7f1d1d 0%,#1a1a2e 100%)",
      greetingName: data.clientName,
      intro: isFr
        ? "Nous vous confirmons l'annulation de votre réservation."
        : "We confirm the cancellation of your booking.",
      detailsTitle: isFr ? "Réservation annulée" : "Cancelled booking",
      details: [
        { label: "Service", value: data.serviceType },
        { label: "Date", value: `${data.preferredDate} • ${data.preferredTime}` },
      ],
      noticeHtml: noticeBits.join("") || undefined,
      ctaLabel: isFr ? "Réserver à nouveau" : "Book again",
      ctaUrl: "https://lafriendsservices.lovable.app/#booking",
      footerNote: isFr
        ? "Nous restons à votre disposition pour toute nouvelle demande."
        : "We remain at your service for any new request.",
    });

    const subject = isFr ? `❌ Réservation annulée - ${data.serviceType}` : `❌ Booking cancelled - ${data.serviceType}`;
    const result = await sendEmail({ to: data.clientEmail, subject, html });
    if (!result.success) return respond(false, { error: result.error || "Email failed" });
    return respond(true, { data: { messageId: result.messageId } });
  } catch (e) {
    if (e instanceof z.ZodError) return respond(false, { error: "Invalid input", diagnostics: e.errors });
    return respond(false, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});