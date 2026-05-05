import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Settings } from "lucide-react";
import { useProfile } from "@/hooks/portal/useProfile";

export const SettingsTab = () => {
  const { profile, isLoading, updateProfile } = useProfile();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    special_instructions: "",
    preferred_time_slot: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        special_instructions: profile.special_instructions ?? "",
        preferred_time_slot: profile.preferred_time_slot ?? "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          Préférences & Profil
        </CardTitle>
        <CardDescription>
          Vos préférences sont automatiquement utilisées lors de vos prochaines réservations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_time_slot">Créneau horaire préféré</Label>
              <Input id="preferred_time_slot" placeholder="ex: 09:00 - 12:00" value={form.preferred_time_slot} onChange={(e) => setForm({ ...form, preferred_time_slot: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special_instructions">Instructions spéciales</Label>
              <Textarea
                id="special_instructions"
                placeholder="Ex: J'ai un chien, la clé est sous le paillasson..."
                value={form.special_instructions}
                onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">Pré-rempli automatiquement dans vos prochaines réservations.</p>
            </div>
            <Button type="submit" disabled={updateProfile.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
