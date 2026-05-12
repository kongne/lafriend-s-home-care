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
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).optional().transform((v?: string) => v ? sanitize(v) : undefined),
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
    const approved = data.decision === "approved";

    const html = brandedEmail({
      language: data.language,
      preheader: approved
        ? (isFr ? "Votre identité a été validée" : "Your identity has been verified")
        : (isFr ? "Votre vérification a été refusée" : "Your verification was rejected"),
      heroEmoji: approved ? "✅" : "⚠️",
      heroBg: approved
        ? "linear-gradient(135deg,#065f46 0%,#1a1a2e 100%)"
        : "linear-gradient(135deg,#7f1d1d 0%,#1a1a2e 100%)",
      greetingName: data.clientName,
      intro: approved
        ? (isFr
            ? "Bonne nouvelle ! Votre identité a été validée par notre équipe. Vous pouvez désormais profiter pleinement de nos services."
            : "Good news! Your identity has been verified by our team. You can now fully enjoy our services.")
        : (isFr
            ? "Nous n'avons pas pu valider votre vérification d'identité. Veuillez recommencer le processus avec des documents valides."
            : "We couldn't validate your identity verification. Please restart the process with valid documents."),
      detailsTitle: isFr ? "Statut de vérification" : "Verification status",
      details: [
        { label: isFr ? "Décision" : "Decision", value: approved ? (isFr ? "Validée ✅" : "Approved ✅") : (isFr ? "Refusée ❌" : "Rejected ❌") },
        { label: "Date", value: new Date().toLocaleString(isFr ? "fr-FR" : "en-US") },
      ],
      noticeHtml: !approved && data.reason
        ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;color:#991b1b;font-size:13px;"><strong>${isFr ? "Motif du rejet" : "Rejection reason"}:</strong> ${data.reason}</div>`
        : undefined,
      ctaLabel: approved
        ? (isFr ? "Accéder à mon espace" : "Go to my dashboard")
        : (isFr ? "Recommencer la vérification" : "Restart verification"),
      ctaUrl: approved
        ? "https://lafriendsservices.lovable.app/customer-portal"
        : "https://lafriendsservices.lovable.app/onboarding",
      footerNote: isFr
        ? "Vos données sont stockées de manière sécurisée et confidentielle."
        : "Your data is stored securely and confidentially.",
    });

    const subject = approved
      ? (isFr ? "✅ Identité validée — LaFriend's Services" : "✅ Identity verified — LaFriend's Services")
      : (isFr ? "⚠️ Vérification d'identité refusée" : "⚠️ Identity verification rejected");

    const result = await sendEmail({ to: data.clientEmail, subject, html });
    if (!result.success) return respond(false, { error: result.error || "Email failed" });
    return respond(true, { data: { messageId: result.messageId } });
  } catch (e) {
    if (e instanceof z.ZodError) return respond(false, { error: "Invalid input", diagnostics: e.errors });
    return respond(false, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});