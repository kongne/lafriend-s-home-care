import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  clientEmail: z.string().email().max(255),
  clientName: z.string().min(1).max(100),
  serviceType: z.string().min(1).max(100),
  preferredDate: z.string().min(1).max(50),
  preferredTime: z.string().min(1).max(50),
  address: z.string().min(1).max(500),
  language: z.enum(['fr', 'en']).default('fr'),
});

const handler = async (req: Request): Promise<Response> => {
  console.log("Send booking confirmation function called");

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

    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    
    const { clientEmail, clientName, serviceType, preferredDate, preferredTime, address, language } = validatedData;
    
    console.log(`Sending confirmation to ${clientEmail} for ${serviceType}`);

    const isFrench = language === 'fr';
    
    const subject = isFrench 
      ? `✅ Réservation Confirmée - ${serviceType}`
      : `✅ Booking Confirmed - ${serviceType}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542; font-size: 28px;">LaFriend's Services</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">
              ${isFrench ? 'Votre réservation est confirmée!' : 'Your booking is confirmed!'}
            </p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a1a2e; margin-top: 0; font-size: 24px;">
              ${isFrench ? `Bonjour ${clientName},` : `Hello ${clientName},`}
            </h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              ${isFrench 
                ? 'Nous sommes heureux de vous informer que votre réservation a été confirmée. Notre équipe sera présente à la date et l\'heure convenues.'
                : 'We are pleased to inform you that your booking has been confirmed. Our team will be present at the agreed date and time.'}
            </p>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #1a1a2e; margin-top: 0; font-size: 18px;">
                ${isFrench ? '📋 Détails de votre réservation' : '📋 Booking Details'}
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #666; font-weight: 500;">
                    ${isFrench ? 'Service' : 'Service'}
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e; font-weight: 600;">
                    ${serviceType}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #666; font-weight: 500;">
                    ${isFrench ? 'Date' : 'Date'}
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e; font-weight: 600;">
                    ${preferredDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #666; font-weight: 500;">
                    ${isFrench ? 'Heure' : 'Time'}
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e; font-weight: 600;">
                    ${preferredTime}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-weight: 500;">
                    ${isFrench ? 'Adresse' : 'Address'}
                  </td>
                  <td style="padding: 12px 0; color: #1a1a2e; font-weight: 600;">
                    ${address}
                  </td>
                </tr>
              </table>
            </div>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              ${isFrench 
                ? 'Si vous avez des questions ou si vous devez modifier votre réservation, n\'hésitez pas à nous contacter.'
                : 'If you have any questions or need to modify your booking, please do not hesitate to contact us.'}
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://lafriends-services.lovable.app" 
                 style="display: inline-block; background: #f5c542; color: #1a1a2e; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${isFrench ? 'Visitez notre site' : 'Visit our website'}
              </a>
            </div>
          </div>
          
          <div style="background: #1a1a2e; color: white; padding: 25px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 14px; opacity: 0.9;">
              ${isFrench ? 'Merci de votre confiance!' : 'Thank you for your trust!'}
            </p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
              © ${new Date().getFullYear()} LaFriend's Services Ménagers
            </p>
            <p style="margin: 10px 0 0; font-size: 12px; opacity: 0.7;">
              📞 +237 693 96 55 01 | 📍 Bafoussam, Cameroun
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LaFriend's Services <onboarding@resend.dev>",
        to: [clientEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Confirmation email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
