import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Building2, HardHat, Sparkles, Car, CheckCircle, ChevronRight, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";
import { supabase } from "@/integrations/supabase/client";

interface DBService {
  id: string; name: string; slug: string; short_description: string | null;
  featured_image: string | null; price_type: string; base_price: number | null;
  currency: string; featured: boolean; popular: boolean; best_seller: boolean;
  recommended: boolean; seasonal_offer: boolean; limited_time_offer: boolean;
}

const FALLBACK_ICONS: Record<string, any> = {
  residential: Home, commercial: Building2, construction: HardHat, windows: Sparkles, car: Car,
};

const fallbackServices = [
  { id: "residential", icon: Home, titleKey: 'services.residential', descKey: 'services.residential.desc', features: ['services.residential.f1', 'services.residential.f2', 'services.residential.f3'] },
  { id: "commercial", icon: Building2, titleKey: 'services.commercial', descKey: 'services.commercial.desc', features: ['services.commercial.f1', 'services.commercial.f2', 'services.commercial.f3'] },
  { id: "construction", icon: HardHat, titleKey: 'services.construction', descKey: 'services.construction.desc', features: ['services.construction.f1', 'services.construction.f2', 'services.construction.f3'] },
  { id: "windows", icon: Sparkles, titleKey: 'services.windows', descKey: 'services.windows.desc', features: ['services.windows.f1', 'services.windows.f2', 'services.windows.f3'] },
  { id: "car", icon: Car, titleKey: 'services.car', descKey: 'services.car.desc', features: ['services.car.f1', 'services.car.f2', 'services.car.f3'] },
  { id: "custom", icon: Home, titleKey: 'services.custom', descKey: 'services.custom.desc', features: ['services.custom.f1', 'services.custom.f2', 'services.custom.f3'] },
];

export const Services = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dbServices, setDbServices] = useState<DBService[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await supabase
          .from("services")
          .select("id, name, slug, short_description, featured_image, price_type, base_price, currency, featured, popular, best_seller, recommended, seasonal_offer, limited_time_offer")
          .eq("status", "published")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (data && data.length > 0) setDbServices(data as DBService[]);
      } catch { /* fallback */ }
      finally { setLoading(false); }
    };
    fetchServices();
  }, []);

  const displayServices = dbServices && dbServices.length > 0
    ? dbServices.map((s, i) => ({
        id: s.slug,
        icon: FALLBACK_ICONS[s.slug] || Home,
        titleKey: s.name,
        descKey: s.short_description || "",
        features: [] as string[],
        price: s.base_price ? `${s.base_price.toLocaleString()} ${s.currency}` : null,
        featuredImage: s.featured_image,
        badges: [
          s.featured && { label: t("services.featured") || "À la une", color: "bg-amber-500" },
          s.popular && { label: "Populaire", color: "bg-blue-500" },
          s.best_seller && { label: "Meilleure vente", color: "bg-green-500" },
        ].filter(Boolean) as { label: string; color: string }[],
      }))
    : fallbackServices;

  return (
    <section id="services" className="section-padding bg-secondary">
      <div className="section-container">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="section-subtitle !mb-2 uppercase tracking-wider text-accent font-semibold text-sm">{t('services.tagline')}</p>
          <h2 className="section-title">
            {t('services.title')}
          </h2>
          <p className="section-subtitle">
            {t('services.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayServices.map((service, index) => {
              const isDBSource = dbServices && dbServices.length > 0;
              const isCustom = service.id === "custom" && !isDBSource;
              return (
                <Card
                  key={service.id}
                  className={`card-elevated group cursor-pointer relative overflow-hidden ${
                    isVisible ? "animate-fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                  onClick={() => isCustom ? navigate("/quote") : navigate(`/services/${service.id}`)}
                >
                  {(service as any).badges?.length > 0 && (
                    <div className="absolute top-3 right-3 z-10 flex gap-1">
                      {(service as any).badges.map((b: any, i: number) => (
                        <Badge key={i} className={`${b.color} text-white text-[10px]`}>{b.label}</Badge>
                      ))}
                    </div>
                  )}
                  {isDBSource && (service as any).featuredImage ? (
                    <div className="mb-4 md:mb-6 h-12 w-12 md:h-16 md:w-16 rounded-full overflow-hidden">
                      <img src={(service as any).featuredImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="mb-4 md:mb-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                        {(service as any).icon && <service.icon className="w-6 h-6 md:w-8 md:h-8 text-accent group-hover:text-accent-foreground transition-colors duration-300" />}
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-accent transition-colors">
                    {isDBSource ? service.titleKey : t(service.titleKey)}
                  </h3>
                  <p className="text-muted-foreground mb-4 md:mb-6 text-sm leading-relaxed">
                    {isDBSource ? service.descKey : t(service.descKey)}
                  </p>
                  {!isDBSource && (service as any).features?.length > 0 && (
                    <ul className="space-y-2 mb-4 md:mb-6">
                      {(service as any).features.map((featureKey: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>{t(featureKey)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(service as any).price && (
                    <p className="text-lg font-bold text-accent mb-3">À partir de {(service as any).price}</p>
                  )}
                  <div className="flex gap-2">
                    <BookingModal>
                      <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-sm" onClick={e => e.stopPropagation()}>
                        {t('hero.book')}
                      </Button>
                    </BookingModal>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={e => { e.stopPropagation(); isCustom ? navigate("/quote") : navigate(`/services/${service.id}`); }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className={`mt-10 md:mt-16 text-center transition-all duration-700 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/quote")}
            className="font-semibold px-6 md:px-8"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('services.requestQuote') || "Demander un devis gratuit"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
