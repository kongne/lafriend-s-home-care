import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return respond(false, { error: "Format de requête invalide." });
    }

    const { messages } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return respond(false, { error: "Service non configuré" });
    }

    const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    const isFrench = userMessages.match(/\b(bonjour|salut|merci|comment|quel|service|nettoyage|prix|je|nous|vous|est|sont|faire|aide)\b/i);
    const language = isFrench ? "French" : "English";

    const systemPrompt = `You are a helpful customer support assistant for LaFriend's Services, a professional cleaning services company based in Bafoussam, Cameroon.

Our services include:
- Nettoyage Résidentiel (apartments, houses, villas)
- Nettoyage Commercial (offices, shops, buildings)  
- Nettoyage Après Construction
- Lavage Auto (interior and exterior)
- Nettoyage de Tapis & Moquettes
- Lavage de Vitres
- Nettoyage Approfondi (deep cleaning)

Pricing (FCFA):
- Standard: from 25,000 FCFA
- Deep cleaning: from 45,000 FCFA
- Commercial: from 50,000 FCFA
- Car wash: from 5,000 FCFA

Business hours: Monday-Saturday, 7:00 AM - 7:00 PM
Contact: +237 693 13 82 92 | lafriendsservices@gmail.com
Location: Bafoussam, Cameroun

IMPORTANT: Respond in ${language}. Be helpful, friendly, and professional. Guide customers to use the booking form on the website for appointments. Keep responses concise.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return respond(false, { error: "Service temporairement indisponible. Veuillez réessayer." });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return respond(true, { data: { message: assistantMessage } });
  } catch (error) {
    console.error("Error in chat-support:", error);
    return respond(false, { error: "Une erreur est survenue. Veuillez réessayer." });
  }
});
