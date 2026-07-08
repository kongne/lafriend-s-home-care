import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Building2, HardHat, Sparkles, Car, FileText, Loader2, Search, X, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { ServiceCard } from "./ServiceCard";
import { Section } from "@/components/ui/section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { supabase } from "@/integrations/supabase/client";

interface DBService {
  id: string; name: string; slug: string; short_description: string | null;
  featured_image: string | null; price_type: string; base_price: number | null;
  currency: string; featured: boolean; popular: boolean; best_seller: boolean;
  recommended: boolean; seasonal_offer: boolean; limited_time_offer: boolean;
  category_id: string | null;
}

const SERVICE_ICONS: Record<string, any> = {
  residential: Home, commercial: Building2, construction: HardHat, windows: Sparkles, car: Car,
};

const fallbackServices = [
  { id: "residential", icon: Home, titleKey: 'services.residential', descKey: 'services.residential.desc', features: ['services.residential.f1', 'services.residential.f2', 'services.residential.f3'], category: "residential" },
  { id: "commercial", icon: Building2, titleKey: 'services.commercial', descKey: 'services.commercial.desc', features: ['services.commercial.f1', 'services.commercial.f2', 'services.commercial.f3'], category: "commercial" },
  { id: "construction", icon: HardHat, titleKey: 'services.construction', descKey: 'services.construction.desc', features: ['services.construction.f1', 'services.construction.f2', 'services.construction.f3'], category: "construction" },
  { id: "windows", icon: Sparkles, titleKey: 'services.windows', descKey: 'services.windows.desc', features: ['services.windows.f1', 'services.windows.f2', 'services.windows.f3'], category: "windows" },
  { id: "car", icon: Car, titleKey: 'services.car', descKey: 'services.car.desc', features: ['services.car.f1', 'services.car.f2', 'services.car.f3'], category: "car" },
  { id: "custom", icon: Home, titleKey: 'services.custom', descKey: 'services.custom.desc', features: ['services.custom.f1', 'services.custom.f2', 'services.custom.f3'], category: "other" },
];

const CATEGORY_ORDER = ["residential", "commercial", "construction", "windows", "car", "other"];

export const Services = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [dbServices, setDbServices] = useState<DBService[] | null>(null);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [svcRes, catRes] = await Promise.all([
          supabase.from("services")
            .select("id, name, slug, short_description, featured_image, price_type, base_price, currency, featured, popular, best_seller, recommended, seasonal_offer, limited_time_offer, category_id")
            .eq("status", "published")
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase.from("service_categories").select("*").order("display_order"),
        ]);
        if (svcRes.data && svcRes.data.length > 0) setDbServices(svcRes.data as DBService[]);
        if (catRes.data) setDbCategories(catRes.data);
      } catch { }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const allServices = dbServices && dbServices.length > 0
    ? dbServices.map((s, i) => ({
        id: s.slug,
        icon: SERVICE_ICONS[s.slug] || Home,
        titleKey: s.name,
        descKey: s.short_description || "",
        features: [] as string[],
        price: s.base_price ? `${s.base_price.toLocaleString()} ${s.currency}` : null,
        priceValue: s.base_price || 0,
        featuredImage: s.featured_image,
        category: dbCategories.find(c => c.id === s.category_id)?.slug || s.slug,
        badges: [
          s.featured && { label: t("services.featured") || "À la une", color: "bg-amber-500" },
          s.popular && { label: "Populaire", color: "bg-blue-500" },
          s.best_seller && { label: "Meilleure vente", color: "bg-green-500" },
        ].filter(Boolean) as { label: string; color: string }[],
      }))
    : fallbackServices;

  const categories = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map(c => ({ id: c.slug, label: c.name }));
    }
    return [
      { id: "residential", label: language === "fr" ? "Résidentiel" : "Residential" },
      { id: "commercial", label: language === "fr" ? "Commercial" : "Commercial" },
      { id: "construction", label: language === "fr" ? "Post-Construction" : "Post-Construction" },
      { id: "windows", label: language === "fr" ? "Vitres" : "Windows" },
      { id: "car", label: language === "fr" ? "Auto" : "Car Wash" },
      { id: "other", label: language === "fr" ? "Autres" : "Other" },
    ];
  }, [dbCategories, language]);

  const filteredServices = useMemo(() => {
    let result = allServices;
    if (activeCategory) {
      result = result.filter(s => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.titleKey.toLowerCase().includes(q) || s.descKey.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allServices, activeCategory, searchQuery]);

  return (
    <Section id="services" bg="muted" tagline={t('services.tagline')} title={t('services.title')} subtitle={t('services.subtitle')}>
      <div ref={ref}>

        {!loading && allServices.length > 0 && (
          <div className={`mb-8 space-y-4 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("services.search") || "Rechercher un service..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
                aria-label="Search services"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                variant={activeCategory === null ? "default" : "outline"}
                onClick={() => setActiveCategory(null)}
                className="text-xs sm:text-sm"
                aria-pressed={activeCategory === null}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                {t("services.all") || "Tous"}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.id)}
                  className="text-xs sm:text-sm"
                  aria-pressed={activeCategory === cat.id}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-semibold text-foreground">{t("services.noResults") || "Aucun service trouvé"}</p>
              <p className="text-sm mt-1">{t("services.tryDifferent") || "Essayez un autre filtre ou terme de recherche."}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setActiveCategory(null); setSearchQuery(""); }}>
                {t("services.reset") || "Réinitialiser les filtres"}
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service as any}
                index={index}
                isVisible={isVisible}
                isDBSource={!!(dbServices && dbServices.length > 0)}
                t={t}
              />
            ))}
          </div>
          )}

        <AnimatedSection>
          <div className="mt-10 md:mt-16 text-center">
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
        </AnimatedSection>
      </div>
    </Section>
  );
};

export default Services;
