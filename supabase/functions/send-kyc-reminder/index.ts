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
  status: z.enum(["none", "pending", "rejected"]).default("none"),
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

    const intro = data.status === "pending"
      ? (isFr
          ? "Votre vérification est encore en cours. Notre équipe examine vos documents et vous recevrez une réponse sous 24-48h."
          : "Your verification is still in progress. Our team is reviewing your documents and you'll get a reply within 24-48h.")
      : data.status === "rejected"
        ? (isFr
            ? "Votre dernière vérification a été refusée. Vous pouvez recommencer dès maintenant en téléchargeant des documents valides."
            : "Your last verification was rejected. You can restart now by uploading valid documents.")
        : (isFr
            ? "Vous n'avez pas encore vérifié votre identité. Cela ne prend que quelques minutes et débloque toutes nos fonctionnalités."
            : "You haven't verified your identity yet. It takes only a few minutes and unlocks all features.");

    const html = brandedEmail({
      language: data.language,
      preheader: isFr ? "Relance vérification d'identité" : "Identity verification reminder",
      heroEmoji: "🪪",
      heroBg: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
      greetingName: data.clientName,
      intro,
      ctaLabel: isFr ? "Vérifier mon identité" : "Verify my identity",
      ctaUrl: "https://lafriendsservices.lovable.app/onboarding",
      footerNote: isFr
        ? "Vos données sont stockées de manière sécurisée et confidentielle."
        : "Your data is stored securely and confidentially.",
    });

    const subject = isFr
      ? "🪪 Relance — Vérifiez votre identité"
      : "🪪 Reminder — Verify your identity";

    const result = await sendEmail({ to: data.clientEmail, subject, html });
    if (!result.success) return respond(false, { error: result.error || "Email failed" });
    return respond(true, { data: { messageId: result.messageId } });
  } catch (e) {
    if (e instanceof z.ZodError) return respond(false, { error: "Invalid input", diagnostics: e.errors });
    return respond(false, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});