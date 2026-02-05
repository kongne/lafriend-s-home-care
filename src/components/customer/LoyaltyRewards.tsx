import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
  Gift,
  Star,
  Percent,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Sparkles,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  loyalty_points?: number | null;
  loyalty_tier?: string | null;
  total_spent?: number | null;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  reward_value: number | null;
  service_type: string | null;
  valid_days: number | null;
}

interface CustomerReward {
  id: string;
  status: string;
  redeemed_at: string;
  expires_at: string;
  used_at: string | null;
  reward: Reward;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points: number;
  description: string;
  balance_after: number;
  created_at: string;
}

const LOYALTY_TIERS = {
  bronze: { name: "Bronze", color: "bg-amber-600", textColor: "text-amber-600", minPoints: 0, discount: 0, icon: "🥉" },
  silver: { name: "Argent", color: "bg-gray-400", textColor: "text-gray-500", minPoints: 200, discount: 5, icon: "🥈" },
  gold: { name: "Or", color: "bg-yellow-500", textColor: "text-yellow-600", minPoints: 500, discount: 10, icon: "🥇" },
  platinum: { name: "Platine", color: "bg-purple-500", textColor: "text-purple-600", minPoints: 1000, discount: 15, icon: "💎" },
};

interface LoyaltyRewardsProps {
  profile: Profile | null;
  onPointsUpdate?: () => void;
}

export const LoyaltyRewards = ({ profile, onPointsUpdate }: LoyaltyRewardsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [customerRewards, setCustomerRewards] = useState<CustomerReward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const loyaltyPoints = profile?.loyalty_points ?? 0;
  const loyaltyTier = (profile?.loyalty_tier ?? "bronze") as keyof typeof LOYALTY_TIERS;
  const currentTierInfo = LOYALTY_TIERS[loyaltyTier];

  // Calculate next tier
  const nextTierKey = Object.keys(LOYALTY_TIERS).find(
    (key) => LOYALTY_TIERS[key as keyof typeof LOYALTY_TIERS].minPoints > loyaltyPoints
  ) as keyof typeof LOYALTY_TIERS | undefined;
  const nextTier = nextTierKey ? LOYALTY_TIERS[nextTierKey] : null;
  const pointsToNextTier = nextTier ? nextTier.minPoints - loyaltyPoints : 0;
  const progressToNextTier = nextTier
    ? ((loyaltyPoints - currentTierInfo.minPoints) / (nextTier.minPoints - currentTierInfo.minPoints)) * 100
    : 100;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchRewards(), fetchCustomerRewards(), fetchTransactions()]);
    setLoading(false);
  };

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    if (!error && data) {
      setRewards(data);
    }
  };

  const fetchCustomerRewards = async () => {
    const { data, error } = await supabase
      .from("customer_rewards")
      .select(`
        id,
        status,
        redeemed_at,
        expires_at,
        used_at,
        reward:loyalty_rewards (
          id,
          name,
          description,
          points_required,
          reward_type,
          reward_value,
          service_type,
          valid_days
        )
      `)
      .eq("user_id", user!.id)
      .order("redeemed_at", { ascending: false });

    if (!error && data) {
      // Type assertion to match our interface
      setCustomerRewards(data as unknown as CustomerReward[]);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const confirmRedemption = async () => {
    if (!selectedReward || !user) return;

    setRedeeming(selectedReward.id);
    setShowConfirmDialog(false);

    try {
      const { data, error } = await supabase.rpc("redeem_loyalty_reward", {
        p_user_id: user.id,
        p_reward_id: selectedReward.id,
      });

      if (error) throw error;

      toast({
        title: "Récompense échangée! 🎉",
        description: `Vous avez obtenu: ${selectedReward.name}`,
      });

      // Refresh data
      fetchData();
      onPointsUpdate?.();
    } catch (error: any) {
      console.error("Redemption error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'échanger la récompense",
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
      setSelectedReward(null);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount_percent":
        return <Percent className="h-5 w-5" />;
      case "discount_fixed":
        return <Gift className="h-5 w-5" />;
      case "free_service":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "redeem":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "tier_upgrade":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "bonus":
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const activeRewards = customerRewards.filter(
    (r) => r.status === "active" && !isPast(parseISO(r.expires_at))
  );
  const usedRewards = customerRewards.filter((r) => r.status === "used");

  return (
    <div className="space-y-6">
      {/* Loyalty Status Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${currentTierInfo.color}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Programme Fidélité
            </CardTitle>
            <Badge className={`${currentTierInfo.color} text-white text-lg px-3 py-1`}>
              {currentTierInfo.icon} {currentTierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{loyaltyPoints}</p>
              <p className="text-sm text-muted-foreground">Points disponibles</p>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-lg font-semibold text-muted-foreground">
                  {pointsToNextTier} points
                </p>
                <p className="text-sm text-muted-foreground">pour {nextTier.name}</p>
              </div>
            )}
          </div>

          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTierInfo.name}</span>
                <span>{nextTier.name}</span>
              </div>
              <Progress value={progressToNextTier} className="h-3" />
            </div>
          )}

          {/* Tier Benefits */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Percent className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Réduction permanente</p>
                <p className="text-sm text-muted-foreground">
                  {currentTierInfo.discount}% sur tous les services
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Gains de points</p>
                <p className="text-sm text-muted-foreground">1 point / 1000 FCFA dépensé</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Tabs */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available" className="gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Récompenses</span>
          </TabsTrigger>
          <TabsTrigger value="my-rewards" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Mes Bons</span>
            {activeRewards.length > 0 && (
              <Badge variant="secondary" className="ml-1">{activeRewards.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Available Rewards */}
        <TabsContent value="available">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const canRedeem = loyaltyPoints >= reward.points_required;
              const isRedeeming = redeeming === reward.id;

              return (
                <Card key={reward.id} className={`transition-all ${canRedeem ? 'hover:shadow-lg' : 'opacity-60'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-accent/10">
                        {getRewardIcon(reward.reward_type)}
                      </div>
                      <Badge variant={canRedeem ? "default" : "secondary"}>
                        {reward.points_required} pts
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{reward.name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      disabled={!canRedeem || isRedeeming}
                      onClick={() => handleRedeemReward(reward)}
                    >
                      {isRedeeming ? (
                        "Échange en cours..."
                      ) : canRedeem ? (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Échanger
                        </>
                      ) : (
                        `${reward.points_required - loyaltyPoints} pts manquants`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* My Rewards */}
        <TabsContent value="my-rewards">
          {activeRewards.length === 0 && usedRewards.length === 0 ? (
            <Card className="p-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune récompense</h3>
              <p className="text-muted-foreground">
                Échangez vos points contre des récompenses
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRewards.length > 0 && (
                <>
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Bons actifs ({activeRewards.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeRewards.map((cr) => (
                      <Card key={cr.id} className="border-green-500/30 bg-green-500/5">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{cr.reward.name}</CardTitle>
                            <Badge className="bg-green-500">Actif</Badge>
                          </div>
                          <CardDescription>{cr.reward.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Expire le {format(parseISO(cr.expires_at), "d MMMM yyyy", { locale: fr })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {usedRewards.length > 0 && (
                <>
                  <h3 className="font-semibold flex items-center gap-2 mt-6">
                    <CheckCircle2 className="h-4 w-4 text-gray-500" />
                    Bons utilisés ({usedRewards.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {usedRewards.slice(0, 4).map((cr) => (
                      <Card key={cr.id} className="opacity-60">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{cr.reward.name}</CardTitle>
                            <Badge variant="secondary">Utilisé</Badge>
                          </div>
                          <CardDescription>
                            Utilisé le {format(parseISO(cr.used_at!), "d MMMM yyyy", { locale: fr })}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Transaction History */}
        <TabsContent value="history">
          {transactions.length === 0 ? (
            <Card className="p-12 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune transaction</h3>
              <p className="text-muted-foreground">
                Votre historique de points apparaîtra ici
              </p>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(tx.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points} pts
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Solde: {tx.balance_after} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'échange</DialogTitle>
            <DialogDescription>
              Voulez-vous échanger {selectedReward?.points_required} points contre :
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-accent/10">
                    {selectedReward && getRewardIcon(selectedReward.reward_type)}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedReward?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedReward?.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                Solde après échange: {loyaltyPoints - (selectedReward?.points_required || 0)} points
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button onClick={confirmRedemption}>
              <Gift className="h-4 w-4 mr-2" />
              Confirmer l'échange
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyRewards;