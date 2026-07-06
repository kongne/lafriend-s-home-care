import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { sendSms, corsHeaders, verifyJwt } from "../_shared/email-service.ts";

function respond(ok: boolean, payload: Record<string, unknown>, req: Request): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

const OWNER_PHONE = "693138292";

interface BookingData {
  full_name: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  phone: string;
  address: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    // Only authenticated admins can trigger owner SMS + admin notification inserts
    const userId = await verifyJwt(req);
    if (!userId) return respond(false, { error: "Unauthorized" }, req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) return respond(false, { error: "Forbidden: admin role required" }, req);

    const { booking } = await req.json() as { booking: BookingData };
    if (!booking) return respond(false, { error: "Missing booking data" }, req);

    const smsMessage = `🗓️ Nouvelle Réservation!\nClient: ${booking.full_name}\nService: ${booking.service_type}\nDate: ${booking.preferred_date} à ${booking.preferred_time}\nTél: ${booking.phone}`;

    const smsResult = await sendSms(OWNER_PHONE, smsMessage);

    const { error: notifError } = await supabase.from("notifications").insert({
      type: "booking",
      title: "Nouvelle Réservation",
      message: `${booking.full_name} - ${booking.service_type} le ${booking.preferred_date}`,
      link: "/admin?tab=bookings",
      is_read: false,
    });

    return respond(true, { data: { smsSent: smsResult.success, notificationSaved: !notifError } }, req);
  } catch (error) {
    return respond(false, { error: error instanceof Error ? error.message : "Unknown error" }, req);
  }
};

serve(handler);
