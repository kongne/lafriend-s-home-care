import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail, sendSms, corsHeaders, escapeHtml, verifyJwt } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

interface StatusNotificationRequest {
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  newStatus: string;
  language?: string;
  sendSms?: boolean;
}

const statusMessages: Record<string, { fr: { subject: string; title: string; message: string; sms: string }; en: { subject: string; title: string; message: string; sms: string } }> = {
  confirmed: {
    fr: { subject: "✅ Réservation Confirmée", title: "Votre réservation est confirmée !", message: "Notre équipe sera présente à l'heure convenue.", sms: "✅ LaFriend's: Votre réservation du {date} à {time} est confirmée!" },
    en: { subject: "✅ Booking Confirmed", title: "Your booking is confirmed!", message: "Our team will be there at the agreed time.", sms: "✅ LaFriend's: Your booking for {date} at {time} is confirmed!" }
  },
  completed: {
    fr: { subject: "🎉 Service Terminé", title: "Service terminé avec succès !", message: "Nous espérons que vous êtes satisfait.", sms: "🎉 LaFriend's: Service terminé! Merci de votre confiance." },
    en: { subject: "🎉 Service Completed", title: "Service completed!", message: "We hope you are satisfied.", sms: "🎉 LaFriend's: Service completed! Thank you." }
  },
  cancelled: {
    fr: { subject: "❌ Réservation Annulée", title: "Réservation annulée", message: "Votre réservation a été annulée.", sms: "❌ LaFriend's: Votre réservation du {date} a été annulée." },
    en: { subject: "❌ Booking Cancelled", title: "Booking cancelled", message: "Your booking has been cancelled.", sms: "❌ LaFriend's: Your booking for {date} has been cancelled." }
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userId = await verifyJwt(req);
    if (!userId) return respond(false, { error: "Unauthorized" });

    const { clientEmail, clientName, clientPhone, serviceType, preferredDate, preferredTime, address, newStatus, language = "fr", sendSms: shouldSendSms = true }: StatusNotificationRequest = await req.json();

    const statusConfig = statusMessages[newStatus];
    if (!statusConfig) return respond(false, { error: "Invalid status" });

    const lang = language === "en" ? "en" : "fr";
    const { subject, title, message, sms: smsTemplate } = statusConfig[lang];
    const statusColor = newStatus === "confirmed" ? "#22c55e" : newStatus === "completed" ? "#3b82f6" : "#ef4444";

    const safe = {
      clientName: escapeHtml(clientName),
      serviceType: escapeHtml(serviceType),
      preferredDate: escapeHtml(preferredDate),
      preferredTime: escapeHtml(preferredTime),
      address: escapeHtml(address),
    };
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4;">
        <div style="max-width:600px;margin:0 auto;background:white;">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center;">
            <h1 style="margin:0;color:#f5c542;font-size:28px;">LaFriend's Services</h1>
          </div>
          <div style="text-align:center;padding:30px 20px 20px;">
            <div style="display:inline-block;background:${statusColor};color:white;padding:12px 24px;border-radius:50px;font-weight:bold;">${subject}</div>
          </div>
          <div style="padding:20px 30px 30px;">
            <h2 style="color:#1a1a2e;">${title}</h2>
            <p style="color:#666;line-height:1.6;">${lang === 'fr' ? 'Bonjour' : 'Hello'} <strong>${safe.clientName}</strong>,<br><br>${message}</p>
            <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin:20px 0;">
              <p><strong>Service:</strong> ${safe.serviceType}</p>
              <p><strong>Date:</strong> ${safe.preferredDate}</p>
              <p><strong>${lang === 'fr' ? 'Heure' : 'Time'}:</strong> ${safe.preferredTime}</p>
              <p><strong>${lang === 'fr' ? 'Adresse' : 'Address'}:</strong> ${safe.address}</p>
            </div>
          </div>
          <div style="background:#1a1a2e;padding:25px;text-align:center;">
            <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">© ${new Date().getFullYear()} LaFriend's Services</p>
          </div>
        </div>
      </body></html>`;

    const emailResult = await sendEmail({ to: clientEmail, subject: `${subject} - LaFriend's Services`, html: htmlContent });

    let smsResult = { success: false, error: "SMS not requested" };
    if (shouldSendSms && clientPhone) {
      const smsMessage = smsTemplate.replace('{date}', preferredDate).replace('{time}', preferredTime).replace('{service}', serviceType);
      smsResult = await sendSms(clientPhone, smsMessage);
    }

    return respond(true, { data: { emailSent: emailResult.success, smsSent: smsResult.success } });
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" });
  }
};

serve(handler);
