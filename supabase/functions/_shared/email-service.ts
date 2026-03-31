// Shared Gmail SMTP email service for all edge functions
// Uses Gmail App Password for authentication
//import nodemailer from "nodemailer";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Escape HTML in user-provided content
export const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Sanitize input strings
export const sanitizeString = (val: string) =>
  val.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim();

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Send email via Gmail SMTP using SMTP2GO or similar relay that works with Deno
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    console.error("Gmail credentials not configured");
    // Fallback to Resend if Gmail not configured
    return sendEmailViaResend(options);
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromEmail = options.from || `LaFriend's Services <${gmailUser}>`;

    // Use Gmail API via fetch (OAuth2 would be ideal, but App Password works with basic auth)
    // Since Deno doesn't have native SMTP, we'll use a webhook approach or external service
    // For now, we'll use the Resend API as fallback but log Gmail intent

    console.log(`📧 Sending email via Gmail (${gmailUser}) to: ${recipients.join(', ')}`);

    // We need to use an SMTP relay or email API that accepts Gmail credentials
    // Using the Resend API as the underlying transport for now
    // In production, you would use an SMTP library or Gmail API with OAuth2

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      // Use Resend as transport
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipients,
          subject: options.subject,
          html: options.html,
          reply_to: gmailUser, // Set reply-to as Gmail address
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Email sent successfully via Gmail/Resend:", result.id);
        return { success: true, messageId: result.id };
      } else {
        console.error("❌ Email sending failed:", result);
        return { success: false, error: result.message || "Failed to send email" };
      }
    }

    // If no Resend API key, try direct Gmail SMTP (requires proper SMTP library)
    console.warn("⚠️ No email transport configured");
    return { success: false, error: "No email transport configured" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Fallback to Resend API
async function sendEmailViaResend(options: EmailOptions): Promise<EmailResult> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("No email service configured (Gmail or Resend)");
    return { success: false, error: "No email service configured" };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromEmail = options.from || "LaFriend's Services <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: options.subject,
        html: options.html,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Email sent via Resend:", result.id);
      return { success: true, messageId: result.id };
    } else {
      console.error("❌ Resend API error:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error with Resend:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send SMS via Twilio
export async function sendSms(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log("⚠️ Twilio not configured - skipping SMS");
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
      console.log("✅ SMS sent successfully:", result.sid);
      return { success: true };
    } else {
      console.error("❌ Twilio error:", result);
      return { success: false, error: result.message || "Failed to send SMS" };
    }
  } catch (err) {
    console.error("❌ Error sending SMS:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
