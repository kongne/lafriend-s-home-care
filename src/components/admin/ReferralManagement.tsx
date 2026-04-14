import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Gift, 
  TrendingUp, 
  Search, 
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
  Award,
  Mail,
} from "lucide-react";
import { error as logError } from "@/lib/logger";
import { BulkActions } from "./BulkActions";

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_user_id: string | null;
  referral_code: string;
  status: string;
  bonus_points: number;
  created_at: string;
  completed_at: string | null;
  referrer_profile?: {
    full_name: string | null;
  };
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsAwarded: number;
}

export function ReferralManagement() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalPointsAwarded: 0,
  });
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [newBonusPoints, setNewBonusPoints] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkAction = useCallback(async (action: string, ids: string[]): Promise<{ success: number; failed: number }> => {
    if (action === 'delete') {
      // Admins need a delete policy — for now update status
      const { error } = await supabase.from("referrals").update({ status: 'cancelled' }).in("id", ids);
      setSelectedIds([]);
      fetchReferrals();
      return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
    }
    const { error } = await supabase.from("referrals").update({ status: action }).in("id", ids);
    setSelectedIds([]);
    fetchReferrals();
    return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setReferrals(data || []);
      calculateStats(data || []);
    } catch (err) {
      logError("Error fetching referrals:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les parrainages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Referral[]) => {
    const completed = data.filter(r => r.status === "completed");
    const pending = data.filter(r => r.status === "pending");
    const totalPoints = completed.reduce((acc, r) => acc + r.bonus_points, 0);

    setStats({
      totalReferrals: data.length,
      completedReferrals: completed.length,
      pendingReferrals: pending.length,
      totalPointsAwarded: totalPoints,
    });
  };

  const updateBonusPoints = async () => {
    if (!editingReferral || !newBonusPoints) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ bonus_points: parseInt(newBonusPoints) })
        .eq("id", editingReferral.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Points de bonus mis à jour",
      });
      setEditingReferral(null);
      setNewBonusPoints("");
      fetchReferrals();
    } catch (err) {
      logError("Error updating bonus points:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les points",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendReminderEmail = async (referral: Referral) => {
    try {
      // Get referrer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", referral.referrer_id)
        .single();

      await supabase.functions.invoke("send-referral-notification", {
        method: "POST",
        body: {
          referrerEmail: "reminder@example.com", // Would need to fetch actual email
          referrerName: profile?.full_name || "Utilisateur",
          referredEmail: referral.referred_email,
          referredName: "Ami(e)",
          bonusPoints: referral.bonus_points,
        },
      });

      toast({
        title: "Email envoyé",
        description: "Rappel de parrainage envoyé",
      });
    } catch (err) {
      logError("Error sending reminder:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rappel",
        variant: "destructive",
      });
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.referred_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Complété</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Parrainages</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-accent opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complétés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedReferrals}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points Distribués</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPointsAwarded}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                Gestion des Parrainages
              </CardTitle>
              <CardDescription>
                Gérez les parrainages et les bonus de points
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchReferrals}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BulkActions
            selectedIds={selectedIds}
            onSelectAll={(checked) => setSelectedIds(checked ? filteredReferrals.map(r => r.id) : [])}
            allSelected={selectedIds.length === filteredReferrals.length && filteredReferrals.length > 0}
            someSelected={selectedIds.length > 0 && selectedIds.length < filteredReferrals.length}
            onBulkAction={handleBulkAction}
            type="referrals"
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Email Parrainé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Points Bonus</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun parrainage trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(referral.id)}
                          onCheckedChange={(checked) => toggleSelection(referral.id, checked as boolean)}
                        />
                      </TableCell>
                        {referral.referral_code}
                      </TableCell>
                      <TableCell>{referral.referred_email}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-50">
                          {referral.bonus_points} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingReferral(referral);
                              setNewBonusPoints(referral.bonus_points.toString());
                            }}
                          >
                            Modifier
                          </Button>
                          {referral.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendReminderEmail(referral)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingReferral} onOpenChange={(open) => !open && setEditingReferral(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Bonus de Parrainage</DialogTitle>
            <DialogDescription>
              Ajustez les points bonus pour ce parrainage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Parrainé</Label>
              <Input value={editingReferral?.referred_email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Code de Parrainage</Label>
              <Input value={editingReferral?.referral_code || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonusPoints">Points Bonus</Label>
              <Input
                id="bonusPoints"
                type="number"
                value={newBonusPoints}
                onChange={(e) => setNewBonusPoints(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReferral(null)}>
              Annuler
            </Button>
            <Button onClick={updateBonusPoints} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
