import { useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const Footer = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: t('footer.subscribed'),
            description: "Vous êtes déjà inscrit à notre newsletter.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: t('footer.subscribed'),
          description: t('footer.subscribedDesc'),
        });
        setEmail("");
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
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company info */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              LaFriend's <span className="text-accent">Services</span>
            </h3>
            <p className="text-primary-foreground/80 mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/profile.php?id=100090077262286" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {[
                { href: "#services", label: t('nav.services') },
                { href: "#galerie", label: t('nav.gallery') },
                { href: "#tarifs", label: t('nav.pricing') },
                { href: "#temoignages", label: t('nav.testimonials') },
                { href: "#faq", label: t('nav.faq') },
                { href: "#contact", label: t('nav.contact') },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-primary-foreground/80 hover:text-accent transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t('footer.ourServices')}</h4>
            <ul className="space-y-2">
              <li className="text-primary-foreground/80">{t('services.residential')}</li>
              <li className="text-primary-foreground/80">{t('services.commercial')}</li>
              <li className="text-primary-foreground/80">{t('services.construction')}</li>
              <li className="text-primary-foreground/80">{t('services.windows')}</li>
              <li className="text-primary-foreground/80">{t('services.car')}</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-4">{t('footer.newsletter')}</h4>
            <p className="text-primary-foreground/80 mb-4">
              {t('footer.newsletterDesc')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} LaFriend's Services Ménagers. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
