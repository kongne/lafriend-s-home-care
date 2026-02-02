import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Validate environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// HTML escape function
const escapeHtml = (text: string | unknown): string => {
  if (typeof text !== "string") return "";
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Send email via configured service
const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.warn("⚠️ Email service not configured");
      return { success: false, error: "Email service not configured" };
    }

    const fromEmail = gmailUser 
      ? `LaFriend's Services <${gmailUser}>`
      : "LaFriend's Services <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        reply_to: gmailUser || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, error: `Email service returned ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Generate feedback request email
const generateFeedbackEmail = (
  customerName: string,
  serviceType: string,
  completedDate: string,
  language: string = "fr"
): string => {
  const isFrench = language === "fr";
  const feedbackUrl = "https://lafriendsservices.lovable.app/customer";

  return `
    <!DOCTYPE html>
    <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #f5c542;
            font-size: 28px;
          }
          .content { 
            padding: 30px 25px; 
          }
          .stars {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .cta-button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, #f5c542 0%, #f59e0b 100%); 
            color: #1a1a2e !important; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 16px;
          }
          .footer { 
            background: #1a1a2e;
            color: white;
            text-align: center; 
            font-size: 14px; 
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LaFriend's Services</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">
              ${isFrench ? 'Votre avis compte!' : 'Your feedback matters!'}
            </p>
          </div>
          
          <div class="content">
            <h2 style="color: #1a1a2e; margin-top: 0;">
              ${isFrench ? `Bonjour ${escapeHtml(customerName)},` : `Hello ${escapeHtml(customerName)},`}
            </h2>
            
            <p style="color: #555;">
              ${isFrench 
                ? `Nous espérons que vous avez apprécié notre service de <strong>${escapeHtml(serviceType)}</strong> effectué le ${escapeHtml(completedDate)}.`
                : `We hope you enjoyed our <strong>${escapeHtml(serviceType)}</strong> service completed on ${escapeHtml(completedDate)}.`}
            </p>
            
            <div class="stars">⭐⭐⭐⭐⭐</div>
            
            <p style="color: #555;">
              ${isFrench 
                ? 'Votre avis nous aide à améliorer nos services. Prenez quelques instants pour nous donner votre retour.'
                : 'Your feedback helps us improve our services. Take a moment to share your experience with us.'}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}" class="cta-button">
                ${isFrench ? 'Donner mon avis' : 'Give Feedback'}
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px;">
              ${isFrench 
                ? 'En guise de remerciement, vous recevrez des points de fidélité bonus pour votre prochain avis!'
                : 'As a thank you, you\'ll receive bonus loyalty points for your next review!'}
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} LaFriend's Services Ménagers</p>
            <p style="margin: 10px 0 0; opacity: 0.7;">
              📞 +237 693 13 82 92 | 📍 Bafoussam, Cameroun
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("📧 Send feedback request function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const now = new Date();
    // 3 days ago
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    // 4 days ago (to create a 24-hour window)
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    console.log(`⏰ Checking for completed bookings between ${fourDaysAgo.toISOString()} and ${threeDaysAgo.toISOString()}`);

    // Get completed bookings from 3 days ago that haven't received a feedback request
    const { data: completedBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, full_name, email, service_type, preferred_date, updated_at")
      .eq("status", "completed")
      .gte("updated_at", fourDaysAgo.toISOString())
      .lte("updated_at", threeDaysAgo.toISOString())
      .limit(20);

    if (fetchError) {
      console.error("❌ Database fetch error:", fetchError);
      throw fetchError;
    }

    if (!completedBookings || completedBookings.length === 0) {
      console.log("ℹ️ No completed bookings to process for feedback");
      return new Response(
        JSON.stringify({ message: "No feedback requests to send", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📨 Found ${completedBookings.length} booking(s) to send feedback requests`);

    let sent = 0;
    let failed = 0;

    for (const booking of completedBookings) {
      try {
        // Check if we already sent a feedback request for this booking
        const { data: existingReminder } = await supabase
          .from("email_reminders")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", "feedback")
          .single();

        if (existingReminder) {
          console.log(`⏭️ Feedback already sent for booking ${booking.id}`);
          continue;
        }

        const emailSubject = `⭐ Votre avis compte! - LaFriend's Services`;
        const emailHtml = generateFeedbackEmail(
          booking.full_name,
          booking.service_type,
          new Date(booking.preferred_date).toLocaleDateString("fr-FR")
        );

        const emailResult = await sendEmail(booking.email, emailSubject, emailHtml);

        // Record the feedback request
        await supabase.from("email_reminders").insert({
          booking_id: booking.id,
          email: booking.email,
          reminder_type: "feedback",
          scheduled_send_time: now.toISOString(),
          status: emailResult.success ? "sent" : "failed",
          sent_at: emailResult.success ? now.toISOString() : null,
          last_error: emailResult.error || null,
        });

        if (emailResult.success) {
          console.log(`✅ Feedback request sent to ${booking.email}`);
          sent++;
        } else {
          console.warn(`⚠️ Failed to send feedback request to ${booking.email}: ${emailResult.error}`);
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error processing booking ${booking.id}:`, errorMessage);
        failed++;
      }
    }

    const summary = {
      message: "Feedback request processing completed",
      processed: completedBookings.length,
      sent,
      failed,
      timestamp: now.toISOString(),
    };

    console.log(`📊 Summary: ${JSON.stringify(summary)}`);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Function error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
