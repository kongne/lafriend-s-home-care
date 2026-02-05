 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 import { sendEmail, sendSms, escapeHtml, corsHeaders } from "../_shared/email-service.ts";

// Type definitions
interface EmailReminder {
  id: string;
  booking_id: string;
  email: string;
  reminder_type: string;
  scheduled_send_time: string;
  status: string;
  retry_count: number;
  bookings?: BookingData | BookingData[];
}

interface BookingData {
  id: string;
  full_name: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  address: string;
  phone?: string;
}

// Validate environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate reminder email HTML with proper formatting
const generateReminderEmail = (
  customerName: string,
  serviceType: string,
  appointmentDate: string,
  appointmentTime: string,
  address: string,
  language: string = "fr"
): string => {
  // Validate language parameter to prevent injection
  const validLanguages = ["en", "fr"];
  const isEnglish = validLanguages.includes(language) ? language === "en" : true;

  const content = {
    fr: {
      title: "Rappel de Rendez-vous",
      greeting: `Bonjour <strong>${customerName}</strong>,`,
      message: "Nous vous écrivons pour vous rappeler votre rendez-vous de nettoyage prévu demain !",
      serviceLabel: "Service",
      dateLabel: "Date et Heure",
      locationLabel: "Lieu",
      rescheduleMessage: "Si vous avez besoin de reprogrammer ou d'annuler, veuillez nous contacter dès que possible.",
      buttonText: "Accéder à votre compte",
      closing: "Merci de votre confiance!",
      company: "LaFriends Services",
      footer: "Ce message a été envoyé automatiquement. Veuillez ne pas y répondre.",
    },
    en: {
      title: "Appointment Reminder",
      greeting: `Hello <strong>${customerName}</strong>,`,
      message: "We are writing to remind you about your cleaning appointment scheduled for tomorrow!",
      serviceLabel: "Service",
      dateLabel: "Date and Time",
      locationLabel: "Location",
      rescheduleMessage: "If you need to reschedule or cancel, please contact us as soon as possible.",
      buttonText: "Access Your Account",
      closing: "Thank you for your trust!",
      company: "LaFriends Services",
      footer: "This message was sent automatically. Please do not reply to this email.",
    },
  };

  const text = isEnglish ? content.en : content.fr;

  // Sanitize language attribute for HTML safety
  const safeLang = escapeHtml(language).substring(0, 5);
  return `
    <!DOCTYPE html>
    <html lang="${safeLang}">
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
            padding: 0;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 30px 20px; 
          }
          .greeting {
            margin-bottom: 20px;
            font-size: 16px;
          }
          .message {
            margin-bottom: 25px;
            font-size: 15px;
            color: #555;
          }
          .detail-row { 
            margin: 12px 0; 
            padding: 15px; 
            background: #f9f9f9; 
            border-left: 4px solid #667eea;
            border-radius: 4px;
          }
          .label { 
            font-weight: 600; 
            color: #667eea;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            margin-top: 5px;
            color: #333;
            font-size: 15px;
          }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #667eea; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 25px 0;
            font-weight: 600;
          }
          .button:hover {
            background: #764ba2;
          }
          .closing {
            margin-top: 20px;
            font-weight: 600;
            color: #333;
          }
          .footer { 
            text-align: center; 
            font-size: 12px; 
            color: #999; 
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .company {
            font-weight: 600;
            color: #667eea;
          }
          @media (max-width: 600px) {
            .container { width: 100%; }
            .content { padding: 20px 15px; }
            .header { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${text.title}</h1>
          </div>
          
          <div class="content">
            <p class="greeting">${escapeHtml(text.greeting)}</p>
            <p class="message">${escapeHtml(text.message)}</p>
            
            <div class="detail-row">
              <div class="label">${escapeHtml(text.serviceLabel)}</div>
              <div class="value">${escapeHtml(serviceType)}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">${escapeHtml(text.dateLabel)}</div>
              <div class="value">${escapeHtml(appointmentDate)} à ${escapeHtml(appointmentTime)}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">${escapeHtml(text.locationLabel)}</div>
              <div class="value">${escapeHtml(address)}</div>
            </div>
            
            <p style="margin-top: 20px; color: #555;">${escapeHtml(text.rescheduleMessage)}</p>
            
            <center>
              <a href="https://www.lafriendsservices.com" class="button">${escapeHtml(text.buttonText)}</a>
            </center>
            
            <p class="closing">${escapeHtml(text.closing)}</p>
            <p><span class="company">${escapeHtml(text.company)}</span></p>
          </div>
          
          <div class="footer">
            <p>${escapeHtml(text.footer)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Main handler for sending reminders
const handler = async (req: Request): Promise<Response> => {
  console.log("📧 Send appointment reminder function called");

  // Validate HTTP method
  if (req.method !== "POST" && req.method !== "OPTIONS") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = new Date();
    // Add 1 hour to check window
    const checkWindow = new Date(now.getTime() + 60 * 60 * 1000);

    console.log(
      `⏰ Checking for reminders between ${now.toISOString()} and ${checkWindow.toISOString()}`
    );

    // Get pending reminders
    const { data: reminders, error: fetchError } = await supabase
      .from("email_reminders")
      .select(
        `
        id,
        booking_id,
        email,
        reminder_type,
        scheduled_send_time,
        status,
        retry_count,
        bookings(
          id,
          full_name,
          service_type,
          preferred_date,
          preferred_time,
          address,
          phone
        )
      `
      )
      .eq("status", "pending")
      .lte("scheduled_send_time", checkWindow.toISOString())
      .gte("scheduled_send_time", now.toISOString())
      .limit(10);

    if (fetchError) {
      console.error("❌ Database fetch error:", fetchError);
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      console.log("ℹ️  No reminders to process");
      return new Response(
        JSON.stringify({ message: "No reminders to send", processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📨 Found ${reminders.length} reminder(s) to process`);

    let processed = 0;
    let sent = 0;
    let failed = 0;

    // Process each reminder
    for (const reminder of reminders as EmailReminder[]) {
      try {
        const booking = reminder.bookings as BookingData | undefined;

        if (!booking) {
          throw new Error("Booking not found");
        }

        console.log(
          `Processing reminder for booking ${booking.id} (${booking.full_name})`
        );

        // Generate email
        const emailSubject = `Rappel: Rendez-vous de nettoyage demain`;
        const emailHtml = generateReminderEmail(
          booking.full_name,
          booking.service_type,
          booking.preferred_date,
          booking.preferred_time,
          booking.address
        );

         // Send email using shared Gmail service
         const emailResult = await sendEmail({
           to: reminder.email,
           subject: emailSubject,
           html: emailHtml,
         });

        // Send SMS reminder if phone is available
        let smsResult: { success: boolean; error?: string } = { success: false, error: "No phone number" };
        if (booking.phone) {
          const smsMessage = `⏰ LaFriend's Rappel: Votre RDV est demain ${booking.preferred_date} à ${booking.preferred_time}. Service: ${booking.service_type}. À demain!`;
          smsResult = await sendSms(booking.phone, smsMessage);
        }

        // Update reminder status (success if either email or SMS sent)
        const reminderSuccess = emailResult.success || smsResult.success;
        const newRetryCount = (reminder.retry_count || 0) + 1;
        const { error: updateError } = await supabase
          .from("email_reminders")
          .update({
            status: reminderSuccess ? "sent" : "failed",
            sent_at: reminderSuccess ? now.toISOString() : null,
            last_error: reminderSuccess ? null : `Email: ${emailResult.error || 'N/A'}, SMS: ${smsResult.error || 'N/A'}`,
            retry_count: newRetryCount,
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
          failed++;
        } else {
          if (reminderSuccess) {
            console.log(`✅ Reminder sent to ${reminder.email} (Email: ${emailResult.success}, SMS: ${smsResult.success})`);
            sent++;
          } else {
            console.warn(
              `⚠️ Failed to send reminder to ${reminder.email}: Email: ${emailResult.error}, SMS: ${smsResult.error}`
            );
            failed++;
          }
          processed++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error processing reminder ${reminder.id}:`,
          errorMessage
        );

        // Mark as failed
        const newRetryCount = (reminder.retry_count || 0) + 1;
        await supabase
          .from("email_reminders")
          .update({
            status: "failed",
            last_error: errorMessage,
            retry_count: newRetryCount,
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);

        failed++;
        processed++;
      }
    }

    const summary = {
      message: "Reminder processing completed",
      processed,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    };

    console.log(`📊 Summary: ${JSON.stringify(summary)}`);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("❌ Function error:", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Create reminders when bookings are created
export const createReminder = async (bookingId: string): Promise<void> => {
  console.log(`Creating reminder for booking ${bookingId}`);

  try {
    // Fetch booking details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError) {
      console.error("Error fetching booking:", fetchError);
      throw fetchError;
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Validate required fields
    if (!booking.email || !booking.preferred_date || !booking.preferred_time) {
      console.warn(`Booking ${bookingId} missing required fields for reminder`);
      return;
    }

    // Calculate reminder send time (24 hours before appointment)
    const appointmentDateTime = new Date(
      `${booking.preferred_date}T${booking.preferred_time}`
    );
    // Subtract 24 hours
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

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
          retry_count: 0,
        });

      if (insertError) {
        console.error("Error creating reminder:", insertError);
        throw insertError;
      }

      console.log(
        `✅ Reminder created for ${booking.email} at ${reminderTime.toISOString()}`
      );
    } else {
      console.warn(`Reminder time is in the past for booking ${bookingId}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`❌ Error creating reminder for booking ${bookingId}:`, errorMessage);
  }
};

// Main entrypoint
serve(handler);
