import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Owner phone number for notifications
const OWNER_PHONE = "693138292";

interface BookingData {
  full_name: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  phone: string;
  address: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send SMS notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking } = await req.json() as { booking: BookingData };
    
    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Missing booking data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing SMS notification for booking: ${booking.full_name}`);

    // Format the SMS message
    const smsMessage = `🗓️ Nouvelle Réservation!

Client: ${booking.full_name}
Service: ${booking.service_type}
Date: ${booking.preferred_date} à ${booking.preferred_time}
Tél: ${booking.phone}
Adresse: ${booking.address}

Connectez-vous au tableau de bord pour plus de détails.`;

    // Try to send SMS via Twilio if configured
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    let smsSent = false;
    let smsError: string | null = null;

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        // Format phone number for Cameroon (+237)
        const formattedPhone = OWNER_PHONE.startsWith("+") 
          ? OWNER_PHONE 
          : `+237${OWNER_PHONE}`;

        const twilioResponse = await fetch(
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
              Body: smsMessage,
            }),
          }
        );

        const twilioResult = await twilioResponse.json();
        
        if (twilioResponse.ok) {
          console.log("SMS sent successfully via Twilio:", twilioResult.sid);
          smsSent = true;
        } else {
          console.error("Twilio error:", twilioResult);
          smsError = twilioResult.message || "Failed to send SMS";
        }
      } catch (err) {
        console.error("Error sending SMS via Twilio:", err);
        smsError = err instanceof Error ? err.message : "Unknown error";
      }
    } else {
      console.log("Twilio not configured - SMS notification will be stored in database only");
      smsError = "Twilio credentials not configured";
    }

    // Always store notification in database for admin panel
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        type: "booking",
        title: "Nouvelle Réservation",
        message: `${booking.full_name} - ${booking.service_type} le ${booking.preferred_date} à ${booking.preferred_time}`,
        link: "/admin?tab=bookings",
        is_read: false,
      });

    if (notifError) {
      console.error("Error saving notification:", notifError);
    } else {
      console.log("Notification saved to database");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        smsSent,
        smsError,
        notificationSaved: !notifError,
        message: smsSent 
          ? "SMS envoyé avec succès" 
          : "Notification enregistrée (SMS non configuré)"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sms-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
