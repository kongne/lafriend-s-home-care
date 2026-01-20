import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  reward_value: number | null;
  service_type: string | null;
  is_active: boolean;
  valid_days: number | null;
  max_redemptions: number | null;
  current_redemptions: number;
  created_at: string;
}

const rewardTypes = [
  { value: "discount_percentage", label: "Remise (%)" },
  { value: "discount_fixed", label: "Remise (FCFA)" },
  { value: "free_service", label: "Service gratuit" },
  { value: "bonus_points", label: "Points bonus" },
];

const serviceTypes = [
  { value: null, label: "Tous les services" },
  { value: "menage", label: "Ménage" },
  { value: "repassage", label: "Repassage" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "jardinage", label: "Jardinage" },
];

export const LoyaltyRewardsManagement = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points_required: 100,
    reward_type: "discount_percentage",
    reward_value: 10,
    service_type: null as string | null,
    is_active: true,
    valid_days: 30,
    max_redemptions: null as number | null,
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .order("points_required", { ascending: true });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setRewards(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      points_required: 100,
      reward_type: "discount_percentage",
      reward_value: 10,
      service_type: null,
      is_active: true,
      valid_days: 30,
      max_redemptions: null,
    });
    setEditingReward(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      points_required: reward.points_required,
      reward_type: reward.reward_type,
      reward_value: reward.reward_value || 0,
      service_type: reward.service_type,
      is_active: reward.is_active,
      valid_days: reward.valid_days || 30,
      max_redemptions: reward.max_redemptions,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.points_required) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    setSaving(true);
    const rewardData = {
      name: formData.name,
      description: formData.description,
      points_required: formData.points_required,
      reward_type: formData.reward_type,
      reward_value: formData.reward_value,
      service_type: formData.service_type,
      is_active: formData.is_active,
      valid_days: formData.valid_days,
      max_redemptions: formData.max_redemptions,
    };

    let error;
    if (editingReward) {
      const result = await supabase
        .from("loyalty_rewards")
        .update(rewardData)
        .eq("id", editingReward.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("loyalty_rewards")
        .insert(rewardData);
      error = result.error;
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: editingReward ? "Récompense mise à jour" : "Récompense créée" });
      setDialogOpen(false);
      resetForm();
      fetchRewards();
    }
    setSaving(false);
  };

  const toggleRewardStatus = async (reward: LoyaltyReward) => {
    const { error } = await supabase
      .from("loyalty_rewards")
      .update({ is_active: !reward.is_active })
      .eq("id", reward.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut mis à jour" });
      fetchRewards();
    }
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette récompense ?")) return;

    const { error } = await supabase
      .from("loyalty_rewards")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Récompense supprimée" });
      fetchRewards();
    }
  };

  const getRewardTypeLabel = (type: string) => {
    return rewardTypes.find(t => t.value === type)?.label || type;
  };

  const formatRewardValue = (reward: LoyaltyReward) => {
    if (reward.reward_type === "discount_percentage") {
      return `${reward.reward_value}%`;
    } else if (reward.reward_type === "discount_fixed") {
      return `${reward.reward_value?.toLocaleString()} FCFA`;
    } else if (reward.reward_type === "bonus_points") {
      return `+${reward.reward_value} pts`;
    }
    return "-";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold">Gestion des Récompenses</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Récompense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Modifier la récompense" : "Créer une récompense"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 10% de réduction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la récompense"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points requis *</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_days">Validité (jours)</Label>
                  <Input
                    id="valid_days"
                    type="number"
                    min="1"
                    value={formData.valid_days || ""}
                    onChange={(e) => setFormData({ ...formData, valid_days: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de récompense</Label>
                  <Select
                    value={formData.reward_type}
                    onValueChange={(value) => setFormData({ ...formData, reward_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward_value">Valeur</Label>
                  <Input
                    id="reward_value"
                    type="number"
                    min="0"
                    value={formData.reward_value || ""}
                    onChange={(e) => setFormData({ ...formData, reward_value: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service applicable</Label>
                  <Select
                    value={formData.service_type || "all"}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value === "all" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les services</SelectItem>
                      {serviceTypes.filter(s => s.value).map((type) => (
                        <SelectItem key={type.value!} value={type.value!}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_redemptions">Limite d'échanges</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    min="1"
                    value={formData.max_redemptions || ""}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: parseInt(e.target.value) || null })}
                    placeholder="Illimité"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Actif</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingReward ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Récompenses disponibles ({rewards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Échanges</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {reward.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reward.points_required} pts</Badge>
                    </TableCell>
                    <TableCell>{getRewardTypeLabel(reward.reward_type)}</TableCell>
                    <TableCell>{formatRewardValue(reward)}</TableCell>
                    <TableCell>
                      {reward.current_redemptions}
                      {reward.max_redemptions && ` / ${reward.max_redemptions}`}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={reward.is_active ? "bg-green-500" : "bg-gray-500"}
                      >
                        {reward.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleRewardStatus(reward)}
                          title={reward.is_active ? "Désactiver" : "Activer"}
                        >
                          <Switch checked={reward.is_active} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(reward)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteReward(reward.id)}
                          title="Supprimer"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rewards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune récompense configurée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};