import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, checkRateLimit } from "../_shared/email-service.ts";

async function verifySignature(
  secret: string,
  payload: string,
  signatureHeader: string
): Promise<boolean> {
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expectedSig = signatureHeader.slice(7);
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hexSig = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (hexSig.length !== expectedSig.length) return false;
  let result = 0;
  for (let i = 0; i < hexSig.length; i++) {
    result |= hexSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Rate limit
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`webhook-in:${clientIp}`, 30, 60_000)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const webhookId = req.headers.get("X-Webhook-ID") || "unknown";
  const webhookEvent = req.headers.get("X-Webhook-Event") || "unknown";
  const signatureHeader = req.headers.get("X-Webhook-Signature") || "";

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify signature against registered endpoints
  const { data: endpoints } = await supabaseAdmin
    .from("webhook_endpoints" as never)
    .select("id, secret, url")
    .eq("is_active", true);

  let authenticated = false;
  let matchedEndpointId = null;

  if (endpoints && endpoints.length > 0) {
    for (const ep of endpoints as unknown as { id: string; secret: string; url: string }[]) {
      if (signatureHeader) {
        const valid = await verifySignature(ep.secret, rawBody, signatureHeader);
        if (valid) {
          authenticated = true;
          matchedEndpointId = ep.id;
          break;
        }
      }
    }
  }

  // For inbound webhooks, we accept without signature if no secret configured
  // but log a warning
  if (!authenticated && signatureHeader) {
    console.warn(`Webhook ${webhookId}: Invalid signature from ${clientIp}`);
    // Still process but log the event as unauthenticated
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Record the inbound event
  const { error: insertError } = await supabaseAdmin.from("webhook_events" as never).insert({
    event_type: `inbound.${webhookEvent}`,
    source: "inbound",
    payload: {
      ...payload,
      _meta: {
        webhook_id: webhookId,
        client_ip: clientIp,
        authenticated,
        endpoint_id: matchedEndpointId,
        received_at: new Date().toISOString(),
      },
    },
    status: "completed",
    processed_at: new Date().toISOString(),
  } as never);

  if (insertError) {
    console.error("Failed to record inbound webhook:", insertError.message);
  }

  // Process known inbound event types
  const eventType = String(payload.event || webhookEvent);
  const eventData = (payload.data || payload) as Record<string, unknown>;

  let processed = false;

  switch (eventType) {
    case "payment.completed":
    case "payment.success": {
      console.log(`Inbound payment event received: ${JSON.stringify(eventData).slice(0, 200)}`);
      processed = true;
      break;
    }
    case "payment.failed": {
      console.log(`Inbound payment failure received: ${JSON.stringify(eventData).slice(0, 200)}`);
      processed = true;
      break;
    }
    case "ping":
    case "test": {
      processed = true;
      break;
    }
    default: {
      console.log(`Inbound webhook received (unhandled type: ${eventType}): ${JSON.stringify(eventData).slice(0, 200)}`);
      processed = true;
    }
  }

  return new Response(
    JSON.stringify({
      received: true,
      event_id: webhookId,
      event_type: eventType,
      processed,
    }),
    {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    }
  );
});
