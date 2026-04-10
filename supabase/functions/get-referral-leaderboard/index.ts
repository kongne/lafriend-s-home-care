import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/email-service.ts";

interface LeaderboardEntry {
  referrer_id: string;
  referrer_name: string;
  successful_referrals: number;
  total_points_earned: number;
  rank: number;
}

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    let currentUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await authClient.auth.getUser();
      currentUserId = data.user?.id ?? null;
    }

    const { data: referrals, error } = await serviceClient
      .from("referrals")
      .select("referrer_id, bonus_points")
      .eq("status", "completed");

    if (error) {
      return respond(false, { error: error.message });
    }

    if (!referrals || referrals.length === 0) {
      return respond(true, { data: { leaderboard: [], currentUserRank: null, currentUserId } });
    }

    const grouped = new Map<string, { count: number; points: number }>();

    referrals.forEach((referral) => {
      const previous = grouped.get(referral.referrer_id) || { count: 0, points: 0 };
      grouped.set(referral.referrer_id, {
        count: previous.count + 1,
        points: previous.points + referral.bonus_points,
      });
    });

    const referrerIds = Array.from(grouped.keys());
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", referrerIds);

    const nameMap = new Map<string, string>();
    profiles?.forEach((profile) => {
      nameMap.set(profile.user_id, profile.full_name || "Utilisateur");
    });

    const entries: LeaderboardEntry[] = Array.from(grouped.entries())
      .map(([referrerId, stats]) => ({
        referrer_id: referrerId,
        referrer_name: nameMap.get(referrerId) || "Utilisateur anonyme",
        successful_referrals: stats.count,
        total_points_earned: stats.points,
        rank: 0,
      }))
      .sort((a, b) => {
        if (b.successful_referrals !== a.successful_referrals) {
          return b.successful_referrals - a.successful_referrals;
        }

        return b.total_points_earned - a.total_points_earned;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const currentUserRank = currentUserId
      ? entries.find((entry) => entry.referrer_id === currentUserId) || null
      : null;

    return respond(true, {
      data: {
        leaderboard: entries.slice(0, 10),
        currentUserRank,
        currentUserId,
      },
    });
  } catch (error) {
    return respond(false, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});