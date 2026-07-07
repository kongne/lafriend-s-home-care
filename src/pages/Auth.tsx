import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, User, Globe, KeyRound } from "lucide-react";
import { Seo } from "@/components/Seo";

const loginSchema = z.object({
  email: z.string()
    .email("Email invalide")
    .max(254, "Email trop long"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne peut pas dépasser 128 caractères"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => {
  const hasUppercase = /[A-Z]/.test(data.password);
  const hasLowercase = /[a-z]/.test(data.password);
  const hasNumber = /\d/.test(data.password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}, {
  message: "Le mot de passe doit contenir: majuscule, minuscule, chiffre et caractère spécial",
  path: ["password"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithOAuth, signInWithOTP, verifyOTP, sendPasswordReset } = useAuth();

  useEffect(() => {
    const referralCode = searchParams.get("ref");
    if (referralCode) {
      localStorage.setItem("pendingReferralCode", referralCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const nextRaw = searchParams.get("next");
      const safeNext =
        nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
      navigate(safeNext);
    }
  }, [user, navigate, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSendOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: "Email invalide" });
      return;
    }
    setLoading(true);
    const { error } = await signInWithOTP(formData.email);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setOtpSent(true);
    toast({ title: "Code envoyé", description: "Vérifiez votre boîte email." });
  };

  const handleVerifyOTP = async () => {
    if (!otpToken.trim()) {
      setErrors({ otp: "Code requis" });
      return;
    }
    setLoading(true);
    const { error } = await verifyOTP(formData.email, otpToken);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Connexion réussie", description: "Bienvenue !" });
  };

  const handleForgotPassword = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: "Email invalide" });
      return;
    }
    setLoading(true);
    const { error } = await sendPasswordReset(formData.email);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Email envoyé", description: "Consultez votre boîte email pour réinitialiser votre mot de passe." });
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.issues.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Erreur de connexion",
              description: "Email ou mot de passe incorrect.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Connexion réussie",
            description: "Bienvenue !",
          });
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.issues.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Compte existant",
              description: "Un compte avec cet email existe déjà. Veuillez vous connecter.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erreur",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Compte créé",
            description: "Votre compte a été créé avec succès !",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Seo
        title={isLogin ? "Connexion — LaFriend's" : "Créer un compte — LaFriend's"}
        description={isLogin
          ? "Connectez-vous à votre espace client LaFriend's pour gérer vos réservations de nettoyage."
          : "Créez votre compte LaFriend's pour réserver vos services de nettoyage à Bafoussam."}
        path="/auth"
      />
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? "Connectez-vous pour accéder à votre espace"
                : "Inscrivez-vous pour réserver nos services"}
            </p>
          </div>

          {searchParams.get("ref") && (
            <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
              Code de parrainage détecté : <span className="font-semibold">{searchParams.get("ref")}</span>
            </div>
          )}

          {otpMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="otp-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={otpSent}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {!otpSent ? (
                <Button onClick={handleSendOTP} className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer le code"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp-token">Code de vérification</Label>
                    <Input
                      id="otp-token"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="Entrez le code reçu par email"
                    />
                    {errors.otp && <p className="text-sm text-destructive">{errors.otp}</p>}
                  </div>
                  <Button onClick={handleVerifyOTP} className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</> : "Se connecter avec le code"}
                  </Button>
                </>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setOtpMode(false); setOtpSent(false); setOtpToken(""); setErrors({}); }}
                  className="text-muted-foreground hover:text-primary text-sm"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Jean Dupont"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? "Connexion..." : "Création..."}
                    </>
                  ) : isLogin ? (
                    "Se connecter"
                  ) : (
                    "Créer un compte"
                  )}
                </Button>

                {isLogin && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                >
                  <Globe className="w-5 h-5" />
                  Continuer avec Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('facebook')}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Continuer avec Facebook
                </Button>
              </div>

              {isLogin && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setOtpMode(true); setErrors({}); }}
                    className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
                  >
                    <KeyRound className="w-4 h-4" />
                    Connexion par code
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin
                    ? "Pas encore de compte ? Inscrivez-vous"
                    : "Déjà un compte ? Connectez-vous"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <a href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
