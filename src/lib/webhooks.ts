import { supabase } from "@/integrations/supabase/client";

export type WebhookEventType =
  | "booking.created"
  | "booking.status_changed"
  | "booking.cancelled"
  | "booking.rescheduled"
  | "contact.created"
  | "user.registered"
  | "review.submitted"
  | "kyc.approved"
  | "kyc.rejected"
  | "notification.broadcast"
  | "custom";

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  "booking.created": "Réservation créée",
  "booking.status_changed": "Statut réservation modifié",
  "booking.cancelled": "Réservation annulée",
  "booking.rescheduled": "Réservation reportée",
  "contact.created": "Message contact reçu",
  "user.registered": "Nouvel utilisateur",
  "review.submitted": "Avis soumis",
  "kyc.approved": "KYC approuvé",
  "kyc.rejected": "KYC rejeté",
  "notification.broadcast": "Notification diffusée",
  custom: "Personnalisé",
};

export const ALL_WEBHOOK_EVENTS: WebhookEventType[] = Object.keys(
  WEBHOOK_EVENT_LABELS
) as WebhookEventType[];

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  description: string | null;
  events: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  event_type: string;
  source: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface WebhookDelivery {
  id: string;
  event_id: string;
  endpoint_id: string;
  status: "pending" | "success" | "failed" | "retrying";
  http_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_number: number;
  duration_ms: number | null;
  created_at: string;
  webhook_events?: WebhookEvent;
  webhook_endpoints?: WebhookEndpoint;
}

export interface WebhookDeliveryWithDetails extends WebhookDelivery {
  webhook_events: WebhookEvent;
  webhook_endpoints: Pick<WebhookEndpoint, "id" | "url" | "description">;
}

export function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(40);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export async function fetchWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const { data, error } = await supabase
    .from("webhook_endpoints" as never)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as WebhookEndpoint[];
}

export async function createWebhookEndpoint(
  endpoint: Omit<WebhookEndpoint, "id" | "created_at" | "updated_at" | "created_by">
): Promise<WebhookEndpoint> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("webhook_endpoints" as never)
    .insert({
      url: endpoint.url,
      secret: endpoint.secret,
      description: endpoint.description,
      events: endpoint.events,
      is_active: endpoint.is_active,
      created_by: user?.id ?? null,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as WebhookEndpoint;
}

export async function updateWebhookEndpoint(
  id: string,
  updates: Partial<Pick<WebhookEndpoint, "url" | "secret" | "description" | "events" | "is_active">>
): Promise<void> {
  const { error } = await supabase
    .from("webhook_endpoints" as never)
    .update(updates as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  const { error } = await supabase
    .from("webhook_endpoints" as never)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function fetchWebhookEvents(
  filters?: { event_type?: string; status?: string; limit?: number; offset?: number }
): Promise<{ data: WebhookEvent[]; count: number }> {
  let query = supabase
    .from("webhook_events" as never)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const limit = filters?.limit ?? 25;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as WebhookEvent[],
    count: count ?? 0,
  };
}

export async function fetchWebhookDeliveries(
  filters?: { endpoint_id?: string; event_id?: string; status?: string; limit?: number; offset?: number }
): Promise<{ data: WebhookDeliveryWithDetails[]; count: number }> {
  let query = supabase
    .from("webhook_deliveries" as never)
    .select(
      `
      *,
      webhook_events ( id, event_type, source, status, created_at ),
      webhook_endpoints ( id, url, description )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filters?.endpoint_id) {
    query = query.eq("endpoint_id", filters.endpoint_id);
  }
  if (filters?.event_id) {
    query = query.eq("event_id", filters.event_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const limit = filters?.limit ?? 25;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as WebhookDeliveryWithDetails[],
    count: count ?? 0,
  };
}

export async function sendTestWebhook(
  endpointId: string,
  eventType: WebhookEventType
): Promise<{ success: boolean; message: string }> {
  const { data: endpoint, error: fetchError } = await supabase
    .from("webhook_endpoints" as never)
    .select("*")
    .eq("id", endpointId)
    .single();

  if (fetchError || !endpoint) {
    return { success: false, message: "Endpoint introuvable." };
  }

  const ep = endpoint as unknown as WebhookEndpoint;
  if (!ep.is_active) {
    return { success: false, message: "L'endpoint est désactivé." };
  }

  const testPayload = {
    event: eventType,
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    data: { test: true, message: "Ceci est un test webhook de LaFriend's Home Care" },
  };

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(ep.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(JSON.stringify(testPayload))
    );
    const hexSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const response = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${hexSignature}`,
        "X-Webhook-Event": eventType,
        "X-Webhook-ID": testPayload.event_id,
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Test réussi (${response.status}).`,
      };
    }
    return {
      success: false,
      message: `Le serveur a répondu avec le statut ${response.status}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Erreur de connexion: ${err instanceof Error ? err.message : "inconnue"}`,
    };
  }
}

export async function retryWebhookDelivery(deliveryId: string): Promise<void> {
  const { data: delivery, error: fetchError } = await supabase
    .from("webhook_deliveries" as never)
    .select("event_id, endpoint_id, attempt_number")
    .eq("id", deliveryId)
    .single();

  if (fetchError || !delivery) throw new Error("Delivery introuvable.");

  const d = delivery as { event_id: string; endpoint_id: string; attempt_number: number };

  const { error } = await supabase.from("webhook_deliveries" as never).insert({
    event_id: d.event_id,
    endpoint_id: d.endpoint_id,
    status: "pending",
    attempt_number: d.attempt_number + 1,
  } as never);

  if (error) throw error;
}

export async function getWebhookStats(): Promise<{
  totalEndpoints: number;
  activeEndpoints: number;
  totalEvents: number;
  pendingEvents: number;
  failedEvents: number;
  totalDeliveries: number;
  successRate: number;
}> {
  const [endpoints, events, deliveries] = await Promise.all([
    supabase
      .from("webhook_endpoints" as never)
      .select("id, is_active", { count: "exact" }),
    supabase
      .from("webhook_events" as never)
      .select("id, status", { count: "exact" }),
    supabase
      .from("webhook_deliveries" as never)
      .select("id, status", { count: "exact" }),
  ]);

  const epData = (endpoints.data ?? []) as unknown as { is_active: boolean }[];
  const evData = (events.data ?? []) as unknown as { status: string }[];
  const delData = (deliveries.data ?? []) as unknown as { status: string }[];

  const totalDeliveries = delData.length;
  const successDeliveries = delData.filter((d) => d.status === "success").length;

  return {
    totalEndpoints: endpoints.count ?? epData.length,
    activeEndpoints: epData.filter((e) => e.is_active).length,
    totalEvents: events.count ?? evData.length,
    pendingEvents: evData.filter((e) => e.status === "pending").length,
    failedEvents: evData.filter((e) => e.status === "failed").length,
    totalDeliveries,
    successRate: totalDeliveries > 0 ? Math.round((successDeliveries / totalDeliveries) * 100) : 100,
  };
}
