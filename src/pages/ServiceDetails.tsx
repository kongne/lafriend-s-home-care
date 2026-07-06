import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BookingModal } from "@/components/BookingModal";
import { Seo } from "@/components/Seo";
import {
  CheckCircle, Clock, Users, ShieldCheck, DollarSign, ChevronRight, MapPin,
  HelpCircle, Star, Image as ImageIcon, ChevronDown, Phone, Calendar,
} from "lucide-react";

interface FullService {
  id: string; name: string; slug: string; category_id: string | null;
  short_description: string | null; description: string | null;
  featured_image: string | null; banner_image: string | null; service_icon: string | null;
  price_type: string; base_price: number | null; discount_price: number | null;
  currency: string; duration: string | null; estimated_duration: string | null;
  featured: boolean; popular: boolean; best_seller: boolean; recommended: boolean;
  is_appointment_required: boolean; instant_booking: boolean; quote_required: boolean;
  online_payment_enabled: boolean;
  seo_title: string | null; seo_description: string | null; keywords: string | null;
  status: string; total_views: number;
}

interface ServiceFeature { id: string; feature: string; is_included: boolean; }
interface ServiceFAQ { id: string; question: string; answer: string; }
interface ServiceAddon { id: string; name: string; description: string | null; price: number | null; duration: string | null; }
interface ServiceLocation { id: string; location: string; location_type: string; }

const fallbackData: Record<string, { icon: string; titleKey: string; descKey: string; features: string[]; highlights: { labelKey: string; icon: string; value: string }[]; included: string[] }> = {
  residential: {
    icon: "Home", titleKey: "services.residential", descKey: "services.residential.desc",
    features: ["services.residential.f1", "services.residential.f2", "services.residential.f3"],
    highlights: [
      { labelKey: "Durée", icon: "Clock", value: "2-3 heures" },
      { labelKey: "Équipe", icon: "Users", value: "1-2 personnes" },
      { labelKey: "Garantie", icon: "ShieldCheck", value: "100% satisfait" },
      { labelKey: "À partir de", icon: "DollarSign", value: "25 000 XAF" },
    ],
    included: ["Nettoyage des sols", "Nettoyage des vitres", "Désinfection cuisine", "Nettoyage salle de bain", "Enlèvement des déchets"],
  },
  commercial: {
    icon: "Building2", titleKey: "services.commercial", descKey: "services.commercial.desc",
    features: ["services.commercial.f1", "services.commercial.f2", "services.commercial.f3"],
    highlights: [
      { labelKey: "Durée", icon: "Clock", value: "3-5 heures" },
      { labelKey: "Équipe", icon: "Users", value: "2-3 personnes" },
      { labelKey: "Garantie", icon: "ShieldCheck", value: "100% satisfait" },
      { labelKey: "À partir de", icon: "DollarSign", value: "50 000 XAF" },
    ],
    included: ["Nettoyage des bureaux", "Nettoyage des vitres", "Désinfection complète", "Nettoyage sanitaires", "Enlèvement des déchets"],
  },
  construction: {
    icon: "HardHat", titleKey: "services.construction", descKey: "services.construction.desc",
    features: ["services.construction.f1", "services.construction.f2", "services.construction.f3"],
    highlights: [
      { labelKey: "Durée", icon: "Clock", value: "4-8 heures" },
      { labelKey: "Équipe", icon: "Users", value: "2-4 personnes" },
      { labelKey: "Garantie", icon: "ShieldCheck", value: "100% satisfait" },
      { labelKey: "À partir de", icon: "DollarSign", value: "80 000 XAF" },
    ],
    included: ["Enlèvement des débris", "Nettoyage poussière", "Nettoyage des sols", "Nettoyage des vitres", "Désinfection complète"],
  },
  windows: {
    icon: "Sparkles", titleKey: "services.windows", descKey: "services.windows.desc",
    features: ["services.windows.f1", "services.windows.f2", "services.windows.f3"],
    highlights: [
      { labelKey: "Durée", icon: "Clock", value: "1-2 heures" },
      { labelKey: "Équipe", icon: "Users", value: "1 personne" },
      { labelKey: "Garantie", icon: "ShieldCheck", value: "Sans traces" },
      { labelKey: "À partir de", icon: "DollarSign", value: "15 000 XAF" },
    ],
    included: ["Nettoyage vitres intérieures", "Nettoyage vitres extérieures", "Cadres et rebords", "Rampes et balustrades"],
  },
  car: {
    icon: "Car", titleKey: "services.car", descKey: "services.car.desc",
    features: ["services.car.f1", "services.car.f2", "services.car.f3"],
    highlights: [
      { labelKey: "Durée", icon: "Clock", value: "1-2 heures" },
      { labelKey: "Équipe", icon: "Users", value: "1 personne" },
      { labelKey: "Garantie", icon: "ShieldCheck", value: "100% satisfait" },
      { labelKey: "À partir de", icon: "DollarSign", value: "8 000 XAF" },
    ],
    included: ["Lavage extérieur", "Aspiration intérieure", "Nettoyage sièges", "Tableau de bord", "Vitres intérieures"],
  },
};

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { t, language } = useLanguage();
  const [service, setService] = useState<FullService | null>(null);
  const [features, setFeatures] = useState<ServiceFeature[]>([]);
  const [faqs, setFaqs] = useState<ServiceFAQ[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serviceId) { setNotFound(true); setLoading(false); return; }
    fetchService();
    trackView();
  }, [serviceId]);

  const trackView = async () => {
    if (!serviceId) return;
    try {
      const { data: svc } = await supabase.from("services").select("id, total_views").eq("slug", serviceId).maybeSingle();
      if (svc) {
        await supabase.from("service_analytics").insert({ service_id: svc.id, event_type: "view" }).then().catch(() => {});
        await supabase.from("services").update({ total_views: (svc.total_views || 0) + 1 }).eq("id", svc.id).then().catch(() => {});
      }
    } catch { /* analytics non-critical */ }
  };

  const fetchService = async () => {
    setLoading(true);
    try {
      const { data: svc } = await supabase
        .from("services")
        .select("*")
        .eq("slug", serviceId)
        .maybeSingle();

      if (!svc) {
        setNotFound(true);
        return;
      }

      if (svc.status !== "published") {
        const { data: roleCheck } = await supabase.rpc("has_role", { _user_id: (await supabase.auth.getUser()).data.user?.id, _role: "admin" });
        if (!roleCheck) { setNotFound(true); return; }
      }

      setService(svc as FullService);

      const [featRes, faqRes, addonRes, locRes] = await Promise.all([
        supabase.from("service_features").select("*").eq("service_id", svc.id).order("display_order"),
        supabase.from("service_faqs").select("*").eq("service_id", svc.id).order("display_order"),
        supabase.from("service_addons").select("*").eq("service_id", svc.id),
        supabase.from("service_locations").select("*").eq("service_id", svc.id),
      ]);

      if (featRes.data) setFeatures(featRes.data as ServiceFeature[]);
      if (faqRes.data) setFaqs(faqRes.data as ServiceFAQ[]);
      if (addonRes.data) setAddons(addonRes.data as ServiceAddon[]);
      if (locRes.data) setLocations(locRes.data as ServiceLocation[]);

    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fallback = !loading && !service && !notFound ? fallbackData[serviceId || ""] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound && !fallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">{t("common.notFound") || "Service introuvable"}</h1>
          <p className="text-muted-foreground">Le service demandé n'existe pas.</p>
          <Link to="/#services"><Button variant="outline"><ChevronRight className="h-4 w-4 mr-1" />{t("nav.services")}</Button></Link>
        </div>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = { Clock, Users, ShieldCheck, DollarSign };
    return icons[iconName] || Clock;
  };

  const displayName = service?.name || (fallback ? t(fallback.titleKey) : "");
  const displayDesc = service?.description || (fallback ? t(fallback.descKey) : "");
  const displayShortDesc = service?.short_description || "";
  const displayImage = service?.banner_image || service?.featured_image || "";
  const displayPrice = service?.base_price ? `${service.base_price.toLocaleString()} ${service.currency}` : "";
  const displayHighlights = service
    ? [
        { label: "Durée", value: service.estimated_duration || service.duration || "-", icon: Clock },
        service.base_price ? { label: service.price_type === "hourly" ? "Taux horaire" : "À partir de", value: `${service.base_price.toLocaleString()} ${service.currency}`, icon: DollarSign } : null,
        service.instant_booking ? { label: "Réservation", value: "Instantanée", icon: Calendar } : null,
        service.is_appointment_required ? { label: "Rendez-vous", value: "Requis", icon: Users } : null,
      ].filter(Boolean)
    : (fallback?.highlights || []).map(h => ({ label: h.labelKey, value: h.value, icon: getIcon(h.icon) }));

  const displayFaqs = service ? faqs : [];
  const displayFeatures = service ? features.filter(f => f.is_included) : [];
  const displayIncluded = service
    ? displayFeatures.map(f => f.feature)
    : (fallback?.included || []).map(i => t(i.replace("services.", "services.")).includes("services.") ? i : i);
  const displayAddons = service ? addons : [];

  const schemaData = service ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.short_description || service.description || "",
    provider: { "@type": "LocalBusiness", name: "L'Africaine Home Care" },
    offers: service.base_price ? {
      "@type": "Offer",
      price: service.base_price,
      priceCurrency: service.currency,
      availability: "https://schema.org/InStock",
    } : undefined,
    areaServed: locations.length > 0
      ? locations.map(l => ({ "@type": "City", name: l.location }))
      : { "@type": "Country", name: "Cameroun" },
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {schemaData && <Seo
        title={service?.seo_title || displayName}
        description={service?.seo_description || displayShortDesc || displayName}
        keywords={service?.keywords || undefined}
        image={service?.featured_image || undefined}
      />}
      {schemaData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      )}

      {displayImage && (
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden bg-muted">
          <img src={displayImage} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{displayName}</h1>
              {displayShortDesc && <p className="text-white/80 mt-2 max-w-2xl">{displayShortDesc}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {!displayImage && (
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{displayName}</h1>
        )}

        {displayHighlights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {displayHighlights.map((h: any, i: number) => h && (
              <Card key={i} className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <h.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{h.label}</p>
                    <p className="font-semibold text-sm">{h.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {(displayDesc || features.length > 0 || displayFaqs.length > 0) && (
              <div className="space-y-4">
                {displayDesc && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">{t("project.details") || "Description"}</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{displayDesc}</p>
                  </div>
                )}

                {displayFeatures.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Ce qui est inclus</h2>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {displayFeatures.map(f => (
                        <div key={f.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                          <span>{f.feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {displayIncluded.length > 0 && !service && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Ce qui est inclus</h2>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {displayIncluded.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {displayAddons.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Options complémentaires</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {displayAddons.map(addon => (
                    <Card key={addon.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm">{addon.name}</h3>
                          {addon.price && <span className="font-bold text-accent text-sm">{addon.price.toLocaleString()} XAF</span>}
                        </div>
                        {addon.description && <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>}
                        {addon.duration && <p className="text-xs text-muted-foreground mt-1">{addon.duration}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {displayFaqs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Questions fréquentes</h2>
                <div className="space-y-3">
                  {displayFaqs.map(faq => (
                    <details key={faq.id} className="group border rounded-lg">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <span className="font-medium text-sm">{faq.question}</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-accent/5 rounded-xl p-6 space-y-4 border border-accent/20">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              {displayPrice && <p className="text-2xl font-bold text-accent">{displayPrice}</p>}
              <div className="space-y-2">
                <BookingModal>
                  <Button className="w-full">{t("project.bookService") || "Réserver"}</Button>
                </BookingModal>
                {service?.quote_required && (
                  <Link to="/quote">
                    <Button variant="outline" className="w-full">Demander un devis</Button>
                  </Link>
                )}
              </div>
              {service?.online_payment_enabled && (
                <p className="text-xs text-muted-foreground text-center">Paiement en ligne sécurisé</p>
              )}
            </div>

            {locations.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Zones desservies</h4>
                  {locations.map(l => (
                    <p key={l.id} className="text-sm text-muted-foreground">{l.location}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <a href="https://wa.me/237670000000" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full text-green-600 border-green-600">
                  <Phone className="h-4 w-4 mr-2" />WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
