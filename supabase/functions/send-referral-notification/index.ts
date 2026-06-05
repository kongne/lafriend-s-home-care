import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail, corsHeaders, escapeHtml } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

interface ReferralNotificationRequest {
  referrerEmail: string;
  referrerName: string;
  referredEmail: string;
  referredName: string;
  bonusPoints: number;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { referrerEmail, referrerName, referredEmail, referredName, bonusPoints, language = "fr" }: ReferralNotificationRequest = await req.json();

    const safeReferrerName = escapeHtml(referrerName);
    const safeReferredName = escapeHtml(referredName);
    const safeReferredEmail = escapeHtml(referredEmail);
    const safePoints = Number.isFinite(bonusPoints) ? Math.floor(bonusPoints) : 0;

    const referrerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4;">
        <div style="max-width:600px;margin:0 auto;background:white;">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center;">
            <h1 style="margin:0;color:#f5c542;font-size:28px;">LaFriend's Services</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;">🎉 Félicitations ${safeReferrerName}!</h2>
            <p style="color:#666;line-height:1.6;">Votre ami(e) <strong>${safeReferredName}</strong> (${safeReferredEmail}) vient de s'inscrire!</p>
            <div style="background:linear-gradient(135deg,#f5c542,#f59e0b);border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
              <h3 style="color:#1a1a2e;margin:0 0 10px;">Bonus Gagné</h3>
              <p style="color:#1a1a2e;margin:0;font-size:36px;font-weight:bold;">+${safePoints} points</p>
            </div>
          </div>
          <div style="background:#1a1a2e;padding:25px;text-align:center;">
            <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">© ${new Date().getFullYear()} LaFriend's Services</p>
          </div>
        </div>
      </body></html>`;

    const referredHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4;">
        <div style="max-width:600px;margin:0 auto;background:white;">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center;">
            <h1 style="margin:0;color:#f5c542;font-size:28px;">LaFriend's Services</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;">🎁 Bienvenue ${safeReferredName}!</h2>
            <p style="color:#666;line-height:1.6;">Merci de vous être inscrit(e) grâce à <strong>${safeReferrerName}</strong>!</p>
            <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
              <h3 style="color:white;margin:0 0 10px;">Bonus de Bienvenue</h3>
              <p style="color:white;margin:0;font-size:36px;font-weight:bold;">+50 points</p>
            </div>
          </div>
          <div style="background:#1a1a2e;padding:25px;text-align:center;">
            <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">© ${new Date().getFullYear()} LaFriend's Services</p>
          </div>
        </div>
      </body></html>`;

    const r1 = await sendEmail({ to: referrerEmail, subject: "🎉 Parrainage Réussi - Vous avez gagné des points!", html: referrerHtml });
    const r2 = await sendEmail({ to: referredEmail, subject: "🎁 Bienvenue chez LaFriend's - Bonus de parrainage!", html: referredHtml });

    return respond(true, { data: { referrerEmailSent: r1.success, referredEmailSent: r2.success } });
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
