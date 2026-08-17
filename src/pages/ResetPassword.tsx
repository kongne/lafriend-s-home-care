import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Seo } from "@/components/Seo";

type Phase = "exchanging" | "form" | "success" | "error";

const ResetPassword = () => {
  const [phase, setPhase] = useState<Phase>("exchanging");
  const [errorMessage, setErrorMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error_description") || searchParams.get("error");

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setPhase("error");
      return;
    }

    if (!code) {
      setErrorMessage("Aucun code de réinitialisation trouvé. Le lien est invalide ou a expiré.");
      setPhase("error");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        console.error("Password reset code exchange failed:", exchangeError.message);
        setErrorMessage(
          exchangeError.message.includes("invalid")
            ? "Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien."
            : "Impossible de valider ce lien. Veuillez réessayer."
        );
        setPhase("error");
        return;
      }
      setPhase("form");
    });
  }, [searchParams]);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
    if (!/[A-Z]/.test(pw)) return "Le mot de passe doit contenir au moins une majuscule";
    if (!/[a-z]/.test(pw)) return "Le mot de passe doit contenir au moins une minuscule";
    if (!/\d/.test(pw)) return "Le mot de passe doit contenir au moins un chiffre";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))
      return "Le mot de passe doit contenir au moins un caractère spécial";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const pwError = validatePassword(newPassword);
    if (pwError) errors.password = pwError;
    if (newPassword !== confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      console.error("Password update failed:", error.message);
      toast({
        title: "Erreur",
        description: error.message.includes("same")
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : "Impossible de mettre à jour le mot de passe. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    setPhase("success");
    toast({
      title: "Mot de passe mis à jour",
      description: "Votre mot de passe a été changé avec succès.",
    });

    setTimeout(() => navigate("/auth", { replace: true }), 3000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Seo title="Réinitialiser le mot de passe — LaFriend's" description="Définissez un nouveau mot de passe." path="/auth/reset-password" />
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">

          {phase === "exchanging" && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Vérification du lien de réinitialisation...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center space-y-6 py-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Lien invalide</h1>
                <p className="text-muted-foreground text-sm">{errorMessage}</p>
              </div>
              <Button onClick={() => navigate("/auth", { replace: true })} className="w-full">
                Retour à la connexion
              </Button>
            </div>
          )}

          {phase === "success" && (
            <div className="text-center space-y-6 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Mot de passe modifié</h1>
                <p className="text-muted-foreground text-sm">Redirection vers la connexion...</p>
              </div>
            </div>
          )}

          {phase === "form" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-7 w-7 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Nouveau mot de passe</h1>
                <p className="text-muted-foreground text-sm">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: "" })); }}
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
                  <p className="text-xs text-muted-foreground">
                    Min. 8 caractères, majuscule, minuscule, chiffre et caractère spécial.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                      className="pl-10"
                    />
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</>
                  ) : (
                    "Définir le nouveau mot de passe"
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/auth", { replace: true })}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Retour à la connexion
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
