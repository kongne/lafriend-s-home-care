import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const handler = async (req: Request): Promise<Response> => {
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
    const { token, action, minScore } = await req.json();

    // If reCAPTCHA is not configured, allow the request with a warning
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn("RECAPTCHA_SECRET_KEY not configured, allowing request");
      return new Response(JSON.stringify({ 
        success: true, 
        score: 1,
        action: action || "unknown",
        challenge_ts: new Date().toISOString(),
        hostname: "localhost",
        warning: "reCAPTCHA not configured"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!token || !action) {
      return new Response(JSON.stringify({ error: "Missing token or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const result = await response.json();

    if (!result.success || result.action !== action || result.score < (minScore || 0.5)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid reCAPTCHA token",
        score: result.score,
        action: result.action
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      score: result.score,
      action: result.action,
      challenge_ts: result.challenge_ts,
      hostname: result.hostname
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);