import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    fr: {
      subject: "✅ Réservation Confirmée",
      title: "Votre réservation est confirmée !",
      message: "Nous avons le plaisir de vous confirmer votre rendez-vous. Notre équipe sera présente à l'heure convenue.",
      sms: "✅ LaFriend's: Votre réservation du {date} à {time} est confirmée! Service: {service}. Merci!"
    },
    en: {
      subject: "✅ Booking Confirmed",
      title: "Your booking is confirmed!",
      message: "We are pleased to confirm your appointment. Our team will be there at the agreed time.",
      sms: "✅ LaFriend's: Your booking for {date} at {time} is confirmed! Service: {service}. Thank you!"
    }
  },
  completed: {
    fr: {
      subject: "🎉 Service Terminé",
      title: "Service terminé avec succès !",
      message: "Nous espérons que vous êtes satisfait de notre service. N'hésitez pas à nous contacter pour toute question ou pour une nouvelle réservation.",
      sms: "🎉 LaFriend's: Service terminé! Merci de votre confiance. Laissez-nous un avis!"
    },
    en: {
      subject: "🎉 Service Completed",
      title: "Service completed successfully!",
      message: "We hope you are satisfied with our service. Feel free to contact us for any questions or a new booking.",
      sms: "🎉 LaFriend's: Service completed! Thank you for your trust. Leave us a review!"
    }
  },
  cancelled: {
    fr: {
      subject: "❌ Réservation Annulée",
      title: "Votre réservation a été annulée",
      message: "Votre réservation a été annulée. Si vous n'êtes pas à l'origine de cette annulation, veuillez nous contacter immédiatement.",
      sms: "❌ LaFriend's: Votre réservation du {date} a été annulée. Questions? Contactez-nous."
    },
    en: {
      subject: "❌ Booking Cancelled",
      title: "Your booking has been cancelled",
      message: "Your booking has been cancelled. If you did not request this cancellation, please contact us immediately.",
      sms: "❌ LaFriend's: Your booking for {date} has been cancelled. Questions? Contact us."
    }
  }
};

// Send SMS via Twilio
async function sendSms(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log("Twilio not configured - skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    // Format phone number for Cameroon (+237)
    const formattedPhone = phone.startsWith("+") ? phone : `+237${phone.replace(/^0/, '')}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: formattedPhone,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("SMS sent successfully:", result.sid);
      return { success: true };
    } else {
      console.error("Twilio error:", result);
      return { success: false, error: result.message || "Failed to send SMS" };
    }
  } catch (err) {
    console.error("Error sending SMS:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send status notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      clientEmail,
      clientName,
      clientPhone,
      serviceType,
      preferredDate,
      preferredTime,
      address,
      newStatus,
      language = "fr",
      sendSms: shouldSendSms = true
    }: StatusNotificationRequest = await req.json();

    console.log(`Sending ${newStatus} notification to ${clientEmail}`);

    const statusConfig = statusMessages[newStatus];
    if (!statusConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const lang = language === "en" ? "en" : "fr";
    const { subject, title, message, sms: smsTemplate } = statusConfig[lang];

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    // Get status color
    const statusColor = newStatus === "confirmed" ? "#22c55e" : 
                        newStatus === "completed" ? "#3b82f6" : 
                        newStatus === "cancelled" ? "#ef4444" : "#6b7280";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542; font-size: 28px;">LaFriend's Services</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Services Ménagers Professionnels</p>
          </div>
          
          <!-- Status Badge -->
          <div style="text-align: center; padding: 30px 20px 20px;">
            <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; font-size: 16px;">
              ${subject}
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 20px 30px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 15px; font-size: 22px;">${title}</h2>
            <p style="color: #666; margin: 0 0 25px; line-height: 1.6;">
              ${lang === 'fr' ? 'Bonjour' : 'Hello'} <strong>${clientName}</strong>,<br><br>
              ${message}
            </p>
            
            <!-- Booking Details -->
            <div style="background-color: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin: 0 0 15px; font-size: 16px;">${lang === 'fr' ? 'Détails de la réservation' : 'Booking Details'}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">
                    <strong>${lang === 'fr' ? 'Service' : 'Service'}:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #eee; text-align: right;">
                    ${serviceType}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">
                    <strong>${lang === 'fr' ? 'Date' : 'Date'}:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #eee; text-align: right;">
                    ${preferredDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">
                    <strong>${lang === 'fr' ? 'Heure' : 'Time'}:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #eee; text-align: right;">
                    ${preferredTime}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">
                    <strong>${lang === 'fr' ? 'Adresse' : 'Address'}:</strong>
                  </td>
                  <td style="padding: 8px 0; color: #333; text-align: right;">
                    ${address}
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Contact Info -->
            <p style="color: #666; font-size: 14px; margin: 25px 0 0; line-height: 1.6;">
              ${lang === 'fr' 
                ? 'Si vous avez des questions, n\'hésitez pas à nous contacter.'
                : 'If you have any questions, feel free to contact us.'}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1a1a2e; padding: 25px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
              © ${new Date().getFullYear()} LaFriend's Services Ménagers
            </p>
            <p style="color: rgba(255,255,255,0.6); margin: 10px 0 0; font-size: 12px;">
              ${lang === 'fr' ? 'Cet email a été envoyé automatiquement.' : 'This email was sent automatically.'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `LaFriend's Services <${fromEmail}>`,
        to: [clientEmail],
        subject: `${subject} - LaFriend's Services`,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Status notification email sent:", emailResult);

    let smsResult = { success: false, error: "SMS not requested" };

    // Send SMS if phone is provided and SMS is enabled
    if (shouldSendSms && clientPhone) {
      const smsMessage = smsTemplate
        .replace('{date}', preferredDate)
        .replace('{time}', preferredTime)
        .replace('{service}', serviceType);
      
      smsResult = await sendSms(clientPhone, smsMessage);
    }

    if (!emailResponse.ok) {
      console.error("Email sending failed:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResult,
        smsResult,
        message: smsResult.success 
          ? "Email et SMS envoyés avec succès"
          : "Email envoyé avec succès"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
