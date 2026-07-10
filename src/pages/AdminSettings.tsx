import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminSettingsCenter } from "@/components/admin/AdminSettingsCenter";
import { User, Settings2, ChevronLeft, ShieldAlert } from "lucide-react";

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [tab, setTab] = useState("account");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setCheckingRole(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setCheckingRole(false);
    };
    checkAdmin();
  }, [user, navigate]);

  if (checkingRole) return null;
  if (!isAdmin) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Succès", description: "Mot de passe mis à jour" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast({ title: "Succès", description: "Email de confirmation envoyé. Vérifiez votre nouvelle adresse." });
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Tableau de bord
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" /> Compte
            </TabsTrigger>
            <TabsTrigger value="configuration" className="gap-2">
              <Settings2 className="h-4 w-4" /> Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>Mettez à jour votre mot de passe pour sécuriser votre compte</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Mot de passe actuel</Label>
                    <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">Nouveau mot de passe</Label>
                    <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
                    <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changer l'email</CardTitle>
                <CardDescription>Modifiez votre adresse email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={loading}>{loading ? "Mise à jour..." : "Mettre à jour l'email"}</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>Détails de votre compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><Label>ID Utilisateur</Label><p className="text-sm text-muted-foreground">{user?.id}</p></div>
                <div><Label>Email actuel</Label><p className="text-sm text-muted-foreground">{user?.email}</p></div>
                <div><Label>Compte créé le</Label><p className="text-sm text-muted-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration">
            <AdminSettingsCenter />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSettings;
