import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
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

// Input validation schemas
const sanitizeString = (val: string) => val.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim();

const bookingDataSchema = z.object({
  full_name: z.string().min(1).max(100).transform(sanitizeString),
  email: z.string().email().max(255).transform(val => val.toLowerCase().trim()),
  phone: z.string().min(1).max(30).transform(sanitizeString),
  subject: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : val),
  message: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  service_type: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : val),
  preferred_date: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : val),
  preferred_time: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : val),
  address: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : val),
});

const requestSchema = z.object({
  type: z.enum(["booking", "contact"]),
  data: bookingDataSchema,
});

const handler = async (req: Request): Promise<Response> => {
  console.log("Send notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting based on IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIP, 10, 60000)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    const rawBody = await req.json();
    const parseResult = requestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: parseResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, data } = parseResult.data;
    console.log(`Processing ${type} notification for ${data.full_name}`);

    // Fetch active staff emails
    const { data: staffEmails, error: staffError } = await supabase
      .from("staff_emails")
      .select("email, name")
      .eq("is_active", true);

    if (staffError) {
      console.error("Error fetching staff emails:", staffError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch staff emails" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!staffEmails || staffEmails.length === 0) {
      console.log("No staff emails configured, skipping notification");
      return new Response(
        JSON.stringify({ message: "No staff emails configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipientEmails = staffEmails.map((s) => s.email);
    console.log(`Sending to ${recipientEmails.length} recipients`);

    // Escape HTML in user-provided content to prevent injection
    const escapeHtml = (str: string | undefined | null): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let subject: string;
    let htmlContent: string;

    if (type === "booking") {
      subject = `🗓️ Nouvelle Réservation - ${escapeHtml(data.service_type)}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542;">LaFriend's Services</h1>
            <p style="margin: 5px 0 0; opacity: 0.8;">Nouvelle Réservation</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Détails de la réservation</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.full_name)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.email)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Téléphone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.phone)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Adresse:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.address)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Service:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.service_type)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.preferred_date)} à ${escapeHtml(data.preferred_time)}</td></tr>
              ${data.message ? `<tr><td style="padding: 10px;"><strong>Message:</strong></td><td style="padding: 10px;">${escapeHtml(data.message)}</td></tr>` : ''}
            </table>
          </div>
          <div style="background: #1a1a2e; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LaFriend's Services Ménagers</p>
          </div>
        </div>
      `;
    } else {
      subject = `📩 Nouveau Message - ${escapeHtml(data.subject)}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #f5c542;">LaFriend's Services</h1>
            <p style="margin: 5px 0 0; opacity: 0.8;">Nouveau Message de Contact</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1a1a2e; margin-top: 0;">${escapeHtml(data.subject)}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>De:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.full_name)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.email)}</td></tr>
              ${data.phone ? `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Téléphone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.phone)}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
          </div>
          <div style="background: #1a1a2e; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LaFriend's Services Ménagers</p>
          </div>
        </div>
      `;
    }

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LaFriend's Services <onboarding@resend.dev>",
        to: recipientEmails,
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
