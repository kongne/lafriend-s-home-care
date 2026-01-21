import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralNotificationRequest {
  referrerEmail: string;
  referrerName: string;
  referredEmail: string;
  referredName: string;
  bonusPoints: number;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send referral notification function called");

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
      referrerEmail,
      referrerName,
      referredEmail,
      referredName,
      bonusPoints,
      language = "fr"
    }: ReferralNotificationRequest = await req.json();

    console.log(`Sending referral notification to ${referrerEmail} for ${referredEmail}`);

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    // Email to referrer (the person who referred)
    const referrerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542; font-size: 28px;">LaFriend's Services</h1>
          </div>
          
          <div style="text-align: center; padding: 30px 20px 20px;">
            <div style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; font-size: 16px;">
              🎉 Parrainage Réussi!
            </div>
          </div>
          
          <div style="padding: 20px 30px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 15px; font-size: 22px;">Félicitations ${referrerName}!</h2>
            <p style="color: #666; margin: 0 0 25px; line-height: 1.6;">
              Votre ami(e) <strong>${referredName}</strong> (${referredEmail}) vient de s'inscrire en utilisant votre code de parrainage!
            </p>
            
            <div style="background: linear-gradient(135deg, #f5c542 0%, #f59e0b 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #1a1a2e; margin: 0 0 10px; font-size: 18px;">Bonus Gagné</h3>
              <p style="color: #1a1a2e; margin: 0; font-size: 36px; font-weight: bold;">+${bonusPoints} points</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 25px 0 0; line-height: 1.6;">
              Continuez à parrainer vos amis pour gagner encore plus de points et débloquer des récompenses exclusives!
            </p>
          </div>
          
          <div style="background-color: #1a1a2e; padding: 25px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
              © ${new Date().getFullYear()} LaFriend's Services Ménagers
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email to referred (the new user who signed up)
    const referredHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542; font-size: 28px;">LaFriend's Services</h1>
          </div>
          
          <div style="text-align: center; padding: 30px 20px 20px;">
            <div style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; font-size: 16px;">
              🎁 Bienvenue!
            </div>
          </div>
          
          <div style="padding: 20px 30px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 15px; font-size: 22px;">Bienvenue ${referredName}!</h2>
            <p style="color: #666; margin: 0 0 25px; line-height: 1.6;">
              Merci de vous être inscrit(e) chez LaFriend's Services grâce au parrainage de <strong>${referrerName}</strong>!
            </p>
            
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: white; margin: 0 0 10px; font-size: 18px;">Bonus de Bienvenue</h3>
              <p style="color: white; margin: 0; font-size: 36px; font-weight: bold;">+50 points</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 25px 0 0; line-height: 1.6;">
              Vos points de bienvenue ont été ajoutés à votre compte! Utilisez-les pour obtenir des réductions sur vos prochaines réservations.
            </p>
          </div>
          
          <div style="background-color: #1a1a2e; padding: 25px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
              © ${new Date().getFullYear()} LaFriend's Services Ménagers
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to referrer
    const referrerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `LaFriend's Services <${fromEmail}>`,
        to: [referrerEmail],
        subject: "🎉 Parrainage Réussi - Vous avez gagné des points!",
        html: referrerHtml,
      }),
    });

    const referrerResult = await referrerResponse.json();
    console.log("Referrer email sent:", referrerResult);

    // Send email to referred
    const referredResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `LaFriend's Services <${fromEmail}>`,
        to: [referredEmail],
        subject: "🎁 Bienvenue chez LaFriend's - Bonus de parrainage!",
        html: referredHtml,
      }),
    });

    const referredResult = await referredResponse.json();
    console.log("Referred email sent:", referredResult);

    return new Response(
      JSON.stringify({
        success: true,
        referrerEmailSent: referrerResponse.ok,
        referredEmailSent: referredResponse.ok,
        message: "Referral notifications sent successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-referral-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
