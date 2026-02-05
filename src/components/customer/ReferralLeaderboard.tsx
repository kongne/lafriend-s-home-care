import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Users, Star, Crown } from "lucide-react";
import { error as logError } from "@/lib/logger";

interface LeaderboardEntry {
  referrer_id: string;
  referrer_name: string;
  successful_referrals: number;
  total_points_earned: number;
  rank: number;
}

export function ReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch completed referrals grouped by referrer
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("referrer_id, bonus_points, status")
        .eq("status", "completed");

      if (error) throw error;

      if (!referrals || referrals.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Group by referrer and calculate stats
      const referrerStats = new Map<string, { count: number; points: number }>();
      
      referrals.forEach((r) => {
        const existing = referrerStats.get(r.referrer_id) || { count: 0, points: 0 };
        referrerStats.set(r.referrer_id, {
          count: existing.count + 1,
          points: existing.points + r.bonus_points,
        });
      });

      // Get unique referrer IDs
      const referrerIds = Array.from(referrerStats.keys());

      // Fetch profiles for names
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", referrerIds);

      if (profileError) {
        logError("Error fetching profiles:", profileError);
      }

      // Create profile map
      const profileMap = new Map<string, string>();
      profiles?.forEach((p) => {
        profileMap.set(p.user_id, p.full_name || "Utilisateur");
      });

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = Array.from(referrerStats.entries())
        .map(([referrerId, stats]) => ({
          referrer_id: referrerId,
          referrer_name: profileMap.get(referrerId) || "Utilisateur Anonyme",
          successful_referrals: stats.count,
          total_points_earned: stats.points,
          rank: 0,
        }))
        .sort((a, b) => b.successful_referrals - a.successful_referrals);

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Find current user's rank
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEntry = entries.find((e) => e.referrer_id === user.id);
        if (userEntry) {
          setCurrentUserRank(userEntry);
        }
      }

      setLeaderboard(entries.slice(0, 10)); // Top 10
    } catch (err) {
      logError("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300";
      default:
        return "bg-card hover:bg-muted/50";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Classement des Parrains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Classement des Parrains
          </CardTitle>
          <CardDescription>
            Les meilleurs parrains du mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun parrainage complété pour le moment.</p>
            <p className="text-sm mt-2">Soyez le premier à parrainer un ami!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Classement des Parrains
        </CardTitle>
        <CardDescription>
          Top 10 des meilleurs parrains
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.referrer_id}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${getRankBgColor(entry.rank)} ${
              entry.referrer_id === currentUserId ? "ring-2 ring-accent" : ""
            }`}
          >
            <div className="flex items-center justify-center w-10">
              {getRankIcon(entry.rank)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarFallback className={entry.rank <= 3 ? "bg-accent text-accent-foreground" : ""}>
                {getInitials(entry.referrer_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {entry.referrer_name}
                  {entry.referrer_id === currentUserId && (
                    <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                  )}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.successful_referrals} parrainage{entry.successful_referrals > 1 ? "s" : ""} réussi{entry.successful_referrals > 1 ? "s" : ""}
              </p>
            </div>
            
            <div className="text-right">
              <Badge className="bg-accent text-accent-foreground">
                <Star className="h-3 w-3 mr-1" />
                {entry.total_points_earned} pts
              </Badge>
            </div>
          </div>
        ))}

        {/* Show current user's rank if not in top 10 */}
        {currentUserRank && currentUserRank.rank > 10 && (
          <>
            <div className="text-center py-2 text-muted-foreground">• • •</div>
            <div
              className={`flex items-center gap-4 p-3 rounded-lg border bg-accent/10 ring-2 ring-accent`}
            >
              <div className="flex items-center justify-center w-10 font-bold text-accent">
                #{currentUserRank.rank}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {getInitials(currentUserRank.referrer_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {currentUserRank.referrer_name}
                    <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentUserRank.successful_referrals} parrainage{currentUserRank.successful_referrals > 1 ? "s" : ""} réussi{currentUserRank.successful_referrals > 1 ? "s" : ""}
                </p>
              </div>
              
              <div className="text-right">
                <Badge className="bg-accent text-accent-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  {currentUserRank.total_points_earned} pts
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
