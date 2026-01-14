import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { addHours, subHours } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Email service configuration (using a service like SendGrid, Mailgun, etc.)
const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    // For demo purposes, using a simple SMTP approach
    // In production, integrate with SendGrid, Mailgun, AWS SES, etc.
    const emailServiceUrl = Deno.env.get("EMAIL_SERVICE_URL") || "";
    const emailServiceKey = Deno.env.get("EMAIL_SERVICE_KEY") || "";

    if (!emailServiceUrl) {
      console.warn("Email service URL not configured");
      return false;
    }

    const response = await fetch(emailServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${emailServiceKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Generate reminder email HTML
const generateReminderEmail = (
  customerName: string,
  serviceType: string,
  appointmentDate: string,
  appointmentTime: string,
  address: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }
          .label { font-weight: bold; color: #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rappel de Rendez-vous</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${customerName}</strong>,</p>
            
            <p>Nous vous écrivons pour vous rappeler votre rendez-vous de nettoyage prévu demain !</p>
            
            <div class="detail-row">
              <div class="label">Service</div>
              <div>${serviceType}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Date et Heure</div>
              <div>${appointmentDate} à ${appointmentTime}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Lieu</div>
              <div>${address}</div>
            </div>
            
            <p>Si vous avez besoin de reprogrammer ou d'annuler, veuillez nous contacter dès que possible.</p>
            
            <center>
              <a href="https://www.lafriendsservices.com" class="button">Accéder à votre compte</a>
            </center>
            
            <p>Merci de votre confiance!</p>
            <p><strong>LaFriends Services</strong></p>
          </div>
          
          <div class="footer">
            <p>Ce message a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Main handler for sending reminders
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get pending reminders that need to be sent
    const now = new Date();
    const checkWindow = addHours(now, 1); // Check for reminders within the next hour

    const { data: reminders, error: fetchError } = await supabase
      .from("email_reminders")
      .select(
        `
        id,
        booking_id,
        email,
        reminder_type,
        scheduled_send_time,
        bookings(
          id,
          full_name,
          service_type,
          preferred_date,
          preferred_time,
          address
        )
      `
      )
      .eq("status", "pending")
      .lte("scheduled_send_time", checkWindow.toISOString())
      .gte("scheduled_send_time", now.toISOString())
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send", processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let processed = 0;
    let sent = 0;

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const booking = (reminder as any).bookings;

        if (!booking) {
          throw new Error("Booking not found");
        }

        // Generate and send email
        const emailSubject = `Rappel: Rendez-vous de nettoyage demain`;
        const emailHtml = generateReminderEmail(
          booking.full_name,
          booking.service_type,
          booking.preferred_date,
          booking.preferred_time,
          booking.address
        );

        const emailSent = await sendEmail(reminder.email, emailSubject, emailHtml);

        // Update reminder status
        const { error: updateError } = await supabase
          .from("email_reminders")
          .update({
            status: emailSent ? "sent" : "failed",
            sent_at: emailSent ? now.toISOString() : null,
            last_error: emailSent ? null : "Email service unavailable",
            retry_count: (reminder as any).retry_count + 1,
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error("Error updating reminder:", updateError);
        } else {
          if (emailSent) {
            sent++;
          }
          processed++;
        }
      } catch (error) {
        console.error("Error processing reminder:", error);

        // Mark as failed
        await supabase
          .from("email_reminders")
          .update({
            status: "failed",
            last_error: (error as Error).message,
            retry_count: (reminder as any).retry_count + 1,
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);

        processed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminder processing completed",
        processed,
        sent,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Create reminders when bookings are created (call from booking trigger)
export const createReminder = async (bookingId: string) => {
  try {
    // Fetch booking details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      throw new Error("Booking not found");
    }

    // Calculate reminder send time (24 hours before appointment)
    const appointmentDateTime = new Date(
      `${booking.preferred_date}T${booking.preferred_time}`
    );
    const reminderTime = subHours(appointmentDateTime, 24);

    // Only create reminder if it's in the future
    if (reminderTime > new Date()) {
      const { error: insertError } = await supabase
        .from("email_reminders")
        .insert({
          booking_id: bookingId,
          email: booking.email,
          reminder_type: "24hours",
          scheduled_send_time: reminderTime.toISOString(),
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error("Error creating reminder:", error);
  }
};

serve(handler);
