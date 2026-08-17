import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCronSecret, corsHeaders } from "../_shared/email-service.ts";

const MAX_BATCH = 50;
const RETRY_DELAYS_MS = [0, 60_000, 300_000, 1_800_000, 7_200_000];

interface WebhookEvent {
  id: string;
  event_type: string;
  source: string;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  max_retries: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function dispatchToEndpoint(
  endpoint: WebhookEndpoint,
  event: WebhookEvent,
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<void> {
  const payloadObj = {
    event: event.event_type,
    event_id: event.id,
    timestamp: new Date().toISOString(),
    source: event.source,
    data: event.payload,
  };

  const payloadStr = JSON.stringify(payloadObj);
  const signature = await signPayload(endpoint.secret, payloadStr);

  const startTime = Date.now();
  let httpStatus = 0;
  let responseBody = "";
  let errorMessage = "";
  let status: "success" | "failed" = "failed";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": event.event_type,
        "X-Webhook-ID": event.id,
        "User-Agent": "LaFriends-Webhook/1.0",
      },
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    httpStatus = response.status;
    responseBody = await response.text().catch(() => "");

    if (response.ok) {
      status = "success";
    } else {
      errorMessage = `HTTP ${httpStatus}: ${responseBody.slice(0, 500)}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown dispatch error";
    httpStatus = 0;
  }

  const durationMs = Date.now() - startTime;

  await supabaseAdmin.from("webhook_deliveries" as never).insert({
    event_id: event.id,
    endpoint_id: endpoint.id,
    status,
    http_status: httpStatus || null,
    response_body: responseBody.slice(0, 2000) || null,
    error_message: errorMessage || null,
    attempt_number: event.retry_count + 1,
    duration_ms: durationMs,
  } as never);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  const isCron = verifyCronSecret(req);
  if (!isCron) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Fetch pending events (or retry-eligible failed events)
  const now = new Date().toISOString();
  const { data: events, error: fetchError } = await supabaseAdmin
    .from("webhook_events" as never)
    .select("*")
    .or(`status.eq.pending,and(status.eq.failed,retry_count.lt.${5},next_retry_at.lte.${now})`)
    .order("created_at", { ascending: true })
    .limit(MAX_BATCH);

  if (fetchError) {
    console.error("Failed to fetch webhook events:", fetchError.message);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const eventList = (events ?? []) as unknown as WebhookEvent[];
  if (eventList.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: "No pending events" }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // 2. Fetch active endpoints
  const { data: endpoints } = await supabaseAdmin
    .from("webhook_endpoints" as never)
    .select("*")
    .eq("is_active", true);

  const endpointList = (endpoints ?? []) as unknown as WebhookEndpoint[];
  if (endpointList.length === 0) {
    // Mark all events as completed (no subscribers)
    for (const event of eventList) {
      await supabaseAdmin
        .from("webhook_events" as never)
        .update({ status: "completed", processed_at: now } as never)
        .eq("id", event.id);
    }
    return new Response(JSON.stringify({ processed: 0, message: "No active endpoints" }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let failed = 0;

  // 3. Process each event
  for (const event of eventList) {
    // Mark as processing
    await supabaseAdmin
      .from("webhook_events" as never)
      .update({ status: "processing" } as never)
      .eq("id", event.id);

    // Find matching endpoints
    const matchingEndpoints = endpointList.filter(
      (ep) =>
        ep.events.includes(event.event_type) || ep.events.includes("*")
    );

    if (matchingEndpoints.length === 0) {
      await supabaseAdmin
        .from("webhook_events" as never)
        .update({ status: "completed", processed_at: new Date().toISOString() } as never)
        .eq("id", event.id);
      processed++;
      continue;
    }

    // Dispatch to each matching endpoint
    let anyFailed = false;
    for (const endpoint of matchingEndpoints) {
      await dispatchToEndpoint(endpoint, event, supabaseAdmin);
    }

    // Update event status
    const newRetryCount = event.retry_count + 1;
    const finalStatus = anyFailed && newRetryCount < event.max_retries ? "failed" : anyFailed ? "failed" : "completed";
    const nextRetryAt =
      finalStatus === "failed"
        ? new Date(Date.now() + RETRY_DELAYS_MS[Math.min(newRetryCount, RETRY_DELAYS_MS.length - 1)]).toISOString()
        : null;

    await supabaseAdmin
      .from("webhook_events" as never)
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt,
        error_message: anyFailed ? "One or more deliveries failed" : null,
      } as never)
      .eq("id", event.id);

    if (finalStatus === "failed") failed++;
    processed++;
  }

  return new Response(
    JSON.stringify({ processed, failed, total: eventList.length }),
    {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    }
  );
});
