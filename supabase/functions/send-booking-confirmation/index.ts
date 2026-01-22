import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const Deno = globalThis.Deno; // Ensure Deno is available globally

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number; }>();

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

// Sanitize input strings
const sanitizeString = (val: string) => val.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim();

const requestSchema = z.object({
  clientEmail: z.string().email().max(255).transform((val: string) => val.toLowerCase().trim()),
  clientName: z.string().min(1).max(100).transform(sanitizeString),
  serviceType: z.string().min(1).max(100).transform(sanitizeString),
  preferredDate: z.string().min(1).max(50).transform(sanitizeString),
  preferredTime: z.string().min(1).max(50).transform(sanitizeString),
  address: z.string().min(1).max(500).transform(sanitizeString),
  language: z.enum(["fr", "en"]).default("fr"),
  staffName: z.string().max(100).optional().transform((val?: string) => (val ? sanitizeString(val) : undefined)),
  staffPhone: z.string().max(50).optional().transform((val?: string) => val ? sanitizeString(val) : undefined),
});

const handler = async (req: Request): Promise<Response> => {
  console.log("Send booking confirmation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Check admin role using service role client
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: hasRole, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    
    if (roleError || !hasRole) {
      console.warn(`Unauthorized attempt by user ${user.id} to send booking confirmation`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Rate limiting based on IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIP, 10, 60000)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }), // Status 429
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }), // Status 500
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Read raw body for better diagnostics and safer parsing
    const rawText = await req.text();
    let parsedBody: unknown;
    try {
      parsedBody = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      console.warn("Failed to parse JSON body:", String(e));
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload", details: String(e), raw: rawText.slice(0, 1000) }), // Status 400
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log limited headers for debugging
    try {
      const hdrs = Object.fromEntries(req.headers.entries());
      const limited = {
        host: hdrs.host,
        origin: hdrs.origin,
        referer: hdrs.referer,
        "x-forwarded-for": hdrs["x-forwarded-for"],
      };
      console.log("Request headers (limited):", limited);
    } catch (e) {
      console.warn("Failed to serialize headers for logging:", String(e));
    }

    const validatedData = requestSchema.parse(parsedBody);
    const debugMode = Deno.env.get("FUNCTION_DEBUG") === "true" || new URL(req.url).searchParams.get("debug") === "1"; // Debug mode for more verbose output
    
    const { clientEmail, clientName, serviceType, preferredDate, preferredTime, address, language, staffName, staffPhone } = validatedData;
    
    console.log(`Sending confirmation to ${clientEmail} for ${serviceType}${staffName ? ` (Staff: ${staffName})` : ''}`);

    const isFrench = language === 'fr'; // Determine language for email content
    
    // Staff assignment section HTML (conditional)
    const staffSection = staffName ? `
      <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0; font-size: 16px;">
          ${isFrench ? '👤 Votre technicien assigné' : '👤 Your Assigned Technician'}
        </h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 500;">
              ${isFrench ? 'Nom' : 'Name'}
            </td>
            <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">
              ${staffName}
            </td>
          </tr>
          ${staffPhone ? `
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 500;">
              ${isFrench ? 'Téléphone' : 'Phone'}
            </td>
            <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;"> 
              ${staffPhone}
            </td>
          </tr>
          ` : ''}
        </table>
        <p style="margin: 10px 0 0; font-size: 14px; color: #666;">
          ${isFrench 
            ? 'Ce technicien sera présent à votre rendez-vous. N\'hésitez pas à le contacter pour toute question.' 
            : 'This technician will be present at your appointment. Feel free to contact them with any questions.'}
        </p>
      </div>
    ` : '';
    
    const subject = isFrench 
      ? `✅ Réservation Confirmée - ${serviceType}`
      : `✅ Booking Confirmed - ${serviceType}`; // Email subject line
    
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
            
            ${staffSection}
            
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

    // Use custom domain if configured, otherwise use Resend's test domain 
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "LaFriend's Services <onboarding@resend.dev>";
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject,
        html: htmlContent,
      }), // Send email via Resend API
    });
    if (!emailResponse.ok) {
      let errorDetails;
      try {
        errorDetails = await emailResponse.json();
      } catch (e) {
        errorDetails = { message: `Non-OK response and failed to parse body: ${String(e)}` };
      }
      console.error("Resend API error:", errorDetails);
      return new Response( // Return error response if Resend API fails
        JSON.stringify({ error: errorDetails, request: debugMode ? { headers: Object.fromEntries(req.headers.entries()), payload: validatedData } : undefined }),
        { status: emailResponse.status || 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Confirmation email sent successfully:", emailResult);

    const successPayload: Record<string, unknown> = { success: true, emailResult };
    if (debugMode) successPayload.request = { headers: Object.fromEntries(req.headers.entries()), payload: validatedData }; // Include request details in debug mode
    return new Response(
      JSON.stringify(successPayload),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-booking-confirmation function:", error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: error.errors }), // Zod validation error
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message }), // Generic error
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "An unknown error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    ); // Catch-all for unknown errors
  }
};
serve(handler);
