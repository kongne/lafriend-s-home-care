import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Veuillez entrer un email valide").max(255);

export const Newsletter = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast({
        title: "Erreur",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: validation.data.toLowerCase().trim(),
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Déjà inscrit",
            description: "Cet email est déjà inscrit à notre newsletter.",
          });
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast({
          title: "Inscription réussie!",
          description: "Vous recevrez nos dernières actualités.",
        });
        setEmail("");
      }
    } catch (err) {
      console.error("Newsletter error:", err);
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
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-6">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {t("newsletter.title") || "Restez informé"}
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            {t("newsletter.subtitle") || "Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives et conseils de nettoyage."}
          </p>
          
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Merci pour votre inscription!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 flex-1"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("newsletter.subscribe") || "S'inscrire"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
