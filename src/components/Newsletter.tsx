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
        description: validation.error.issues[0].message,
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
    <section id="newsletter" className="bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                {t("newsletter.title") || "Restez informé"}
              </h2>
              <p className="text-primary-foreground/70 text-sm">
                {t("newsletter.subtitle") || "Offres exclusives et conseils de nettoyage."}
              </p>
            </div>
          </div>
          
          {subscribed ? (
            <div className="flex items-center gap-2 text-accent shrink-0">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Merci!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 w-full md:w-auto shrink-0">
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                aria-label="Email"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 min-w-[200px]"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shrink-0"
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
