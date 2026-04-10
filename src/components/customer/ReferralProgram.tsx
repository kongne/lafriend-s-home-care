import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, Copy, Gift, Check, Share2, Loader2 } from "lucide-react";
import { ReferralLeaderboard } from "./ReferralLeaderboard";

interface Referral {
  id: string;
  referred_email: string;
  referral_code: string;
  bonus_points: number;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [newReferralEmail, setNewReferralEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      generateOrFetchReferralCode();
      fetchReferrals();
    }
  }, [user]);

  const generateOrFetchReferralCode = async () => {
    if (!user) return;

    // First check if user already has a referral
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingReferral?.referral_code) {
      setReferralCode(existingReferral.referral_code);
    } else {
      // Generate new code using the database function
      const { data, error } = await supabase.rpc("generate_referral_code", {
        p_user_id: user.id
      });

      if (!error && data) {
        setReferralCode(data);
      }
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReferrals(data);
    }
    setLoading(false);
  };

  const sendReferralInvite = async () => {
    if (!user || !newReferralEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newReferralEmail)) {
      toast({ title: "Erreur", description: "Adresse email invalide", variant: "destructive" });
      return;
    }

    // Check if this email was already referred
    const existingReferral = referrals.find(r => r.referred_email === newReferralEmail);
    if (existingReferral) {
      toast({ title: "Erreur", description: "Cette adresse a déjà été parrainée", variant: "destructive" });
      return;
    }

    setSending(true);

    // Ensure we have a referral code
    let code = referralCode;
    if (!code) {
      const { data } = await supabase.rpc("generate_referral_code", {
        p_user_id: user.id
      });
      if (data) {
        code = data;
        setReferralCode(code);
      }
    }

    const { error } = await supabase.from("referrals").insert({
      referrer_id: user.id,
      referred_email: newReferralEmail,
      referral_code: code,
      bonus_points: 100,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Invitation envoyée", 
        description: `Une invitation a été créée pour ${newReferralEmail}. Partagez votre code de parrainage!` 
      });
      setNewReferralEmail("");
      fetchReferrals();
    }
    setSending(false);
  };

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Lien copié!", description: "Le lien de parrainage a été copié dans le presse-papiers" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: "Code copié!", description: "Le code de parrainage a été copié" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = `🎁 Rejoignez LaFriend's Services et recevez 50 points de bienvenue! Utilisez mon code: ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Parrainage LaFriend's Services",
          text,
          url: link,
        });
      } catch {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const completedReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;
  const totalPointsEarned = referrals
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + r.bonus_points, 0);

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedReferrals}</p>
                <p className="text-sm text-muted-foreground">Parrainages réussis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Users className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReferrals}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-accent/10">
                <Gift className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPointsEarned}</p>
                <p className="text-sm text-muted-foreground">Points gagnés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-accent" />
            Votre Code de Parrainage
          </CardTitle>
          <CardDescription>
            Partagez ce code avec vos amis et gagnez 100 points par parrainage réussi!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 p-4 bg-muted rounded-lg text-center">
              <p className="text-3xl font-bold tracking-wider text-accent">
                {referralCode || "..."}
              </p>
            </div>
            <Button variant="outline" onClick={copyCode} disabled={!referralCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={shareReferral} disabled={!referralCode}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" className="flex-1" onClick={copyReferralLink} disabled={!referralCode}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Invitation */}
      <Card>
        <CardHeader>
          <CardTitle>Inviter un ami</CardTitle>
          <CardDescription>
            Envoyez une invitation par email à vos amis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="Email de votre ami"
              value={newReferralEmail}
              onChange={(e) => setNewReferralEmail(e.target.value)}
              disabled={sending}
            />
            <Button onClick={sendReferralInvite} disabled={sending || !newReferralEmail} className="w-full sm:w-auto">
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Inviter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des parrainages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun parrainage pour le moment</p>
              <p className="text-sm">Invitez vos amis pour gagner des points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{referral.referred_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:self-auto">
                    <Badge 
                      className={
                        referral.status === "completed" 
                          ? "bg-green-500" 
                          : "bg-yellow-500"
                      }
                    >
                      {referral.status === "completed" ? "Complété" : "En attente"}
                    </Badge>
                    {referral.status === "completed" && (
                      <span className="text-sm font-medium text-green-600">
                        +{referral.bonus_points} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Leaderboard */}
      <ReferralLeaderboard />

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Partagez</h4>
              <p className="text-sm text-muted-foreground">
                Partagez votre code de parrainage avec vos amis
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">Inscription</h4>
              <p className="text-sm text-muted-foreground">
                Votre ami s'inscrit avec votre code
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Gagnez</h4>
              <p className="text-sm text-muted-foreground">
                Vous recevez 100 pts, votre ami reçoit 50 pts!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};