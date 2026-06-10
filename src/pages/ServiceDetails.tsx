import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Home, Building2, HardHat, Sparkles, Car, CheckCircle, 
  Clock, Shield, Star, ArrowLeft, Phone, MessageCircle,
  Banknote, Users, Zap
} from "lucide-react";
import { Seo } from "@/components/Seo";

const servicesData: Record<string, {
  icon: any;
  titleKey: string;
  descKey: string;
  features: string[];
  price: string;
  duration: string;
  image: string;
  highlights: { icon: any; label: string; value: string }[];
  included: string[];
  process: { step: number; title: string; desc: string }[];
}> = {
  residential: {
    icon: Home,
    titleKey: "services.residential",
    descKey: "services.residential.desc",
    features: ["services.residential.f1", "services.residential.f2", "services.residential.f3"],
    price: "25,000 FCFA",
    duration: "2-4 heures",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop",
    highlights: [
      { icon: Clock, label: "Durée", value: "2-4h" },
      { icon: Users, label: "Équipe", value: "2-3 personnes" },
      { icon: Shield, label: "Garantie", value: "100% satisfait" },
      { icon: Banknote, label: "À partir de", value: "25,000 FCFA" },
    ],
    included: [
      "Nettoyage complet de toutes les pièces",
      "Dépoussiérage meubles et surfaces",
      "Lavage et désinfection des sols",
      "Nettoyage cuisine et salle de bain",
      "Aspirateur tapis et moquettes",
      "Vidage des poubelles",
    ],
    process: [
      { step: 1, title: "Réservation", desc: "Choisissez votre date et heure en ligne" },
      { step: 2, title: "Confirmation", desc: "Recevez la confirmation par email ou WhatsApp" },
      { step: 3, title: "Intervention", desc: "Notre équipe arrive à l'heure convenue" },
      { step: 4, title: "Satisfaction", desc: "Vérification finale et feedback" },
    ],
  },
  commercial: {
    icon: Building2,
    titleKey: "services.commercial",
    descKey: "services.commercial.desc",
    features: ["services.commercial.f1", "services.commercial.f2", "services.commercial.f3"],
    price: "50,000 FCFA",
    duration: "3-6 heures",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
    highlights: [
      { icon: Clock, label: "Durée", value: "3-6h" },
      { icon: Users, label: "Équipe", value: "3-5 personnes" },
      { icon: Shield, label: "Garantie", value: "100% satisfait" },
      { icon: Banknote, label: "À partir de", value: "50,000 FCFA" },
    ],
    included: [
      "Nettoyage bureaux et espaces de travail",
      "Désinfection postes de travail",
      "Nettoyage sanitaires et cuisines communes",
      "Lavage des vitres intérieures",
      "Entretien des sols (carrelage, moquette)",
      "Gestion des déchets et recyclage",
    ],
    process: [
      { step: 1, title: "Devis gratuit", desc: "Évaluation de vos locaux et besoins" },
      { step: 2, title: "Planification", desc: "Horaires adaptés à votre activité" },
      { step: 3, title: "Intervention", desc: "Équipe dédiée et équipement pro" },
      { step: 4, title: "Suivi qualité", desc: "Rapport d'intervention et feedback" },
    ],
  },
  construction: {
    icon: HardHat,
    titleKey: "services.construction",
    descKey: "services.construction.desc",
    features: ["services.construction.f1", "services.construction.f2", "services.construction.f3"],
    price: "80,000 FCFA",
    duration: "4-8 heures",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=600&fit=crop",
    highlights: [
      { icon: Clock, label: "Durée", value: "4-8h" },
      { icon: Users, label: "Équipe", value: "4-6 personnes" },
      { icon: Shield, label: "Garantie", value: "100% satisfait" },
      { icon: Banknote, label: "À partir de", value: "80,000 FCFA" },
    ],
    included: [
      "Évacuation gravats et débris",
      "Nettoyage poussière de construction",
      "Lavage vitrerie intérieure/extérieure",
      "Décapage et nettoyage des sols",
      "Nettoyage des sanitaires neufs",
      "Désinfection complète des lieux",
    ],
    process: [
      { step: 1, title: "Visite technique", desc: "Évaluation du chantier et devis" },
      { step: 2, title: "Planification", desc: "Coordination avec le maître d'œuvre" },
      { step: 3, title: "Nettoyage", desc: "Intervention en plusieurs phases" },
      { step: 4, title: "Livraison", desc: "Remise de locaux propres et prêts" },
    ],
  },
  windows: {
    icon: Sparkles,
    titleKey: "services.windows",
    descKey: "services.windows.desc",
    features: ["services.windows.f1", "services.windows.f2", "services.windows.f3"],
    price: "15,000 FCFA",
    duration: "1-3 heures",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200&h=600&fit=crop",
    highlights: [
      { icon: Clock, label: "Durée", value: "1-3h" },
      { icon: Users, label: "Équipe", value: "1-2 personnes" },
      { icon: Shield, label: "Garantie", value: "Sans traces" },
      { icon: Banknote, label: "À partir de", value: "15,000 FCFA" },
    ],
    included: [
      "Nettoyage vitres intérieures et extérieures",
      "Lavage des cadres et rebords",
      "Nettoyage des volets et stores",
      "Traitement anti-traces",
      "Nettoyage des miroirs",
      "Séchage sans traces",
    ],
    process: [
      { step: 1, title: "Estimation", desc: "Nombre et taille des vitres" },
      { step: 2, title: "Préparation", desc: "Protection des sols et meubles" },
      { step: 3, title: "Nettoyage", desc: "Technique professionnelle sans traces" },
      { step: 4, title: "Inspection", desc: "Vérification de chaque vitre" },
    ],
  },
  car: {
    icon: Car,
    titleKey: "services.car",
    descKey: "services.car.desc",
    features: ["services.car.f1", "services.car.f2", "services.car.f3"],
    price: "8,000 FCFA",
    duration: "1-2 heures",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&h=600&fit=crop",
    highlights: [
      { icon: Clock, label: "Durée", value: "1-2h" },
      { icon: Users, label: "Équipe", value: "1-2 personnes" },
      { icon: Shield, label: "Garantie", value: "Éclat garanti" },
      { icon: Banknote, label: "À partir de", value: "8,000 FCFA" },
    ],
    included: [
      "Lavage extérieur complet",
      "Aspiration intérieur",
      "Nettoyage tableau de bord",
      "Lavage des vitres",
      "Nettoyage jantes et pneus",
      "Parfum d'ambiance offert",
    ],
    process: [
      { step: 1, title: "Accueil", desc: "Réception et inspection du véhicule" },
      { step: 2, title: "Lavage", desc: "Nettoyage extérieur et intérieur" },
      { step: 3, title: "Finitions", desc: "Détails et touches finales" },
      { step: 4, title: "Remise", desc: "Véhicule propre et parfumé" },
    ],
  },
};

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const service = serviceId ? servicesData[serviceId] : null;

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Service non trouvé</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = service.icon;

  const serviceTitle = t(service.titleKey);
  const serviceDesc = t(service.descKey);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${serviceTitle} à Bafoussam — LaFriend's`}
        description={`${serviceDesc} À partir de ${service.price}. Réservez votre service ${serviceTitle.toLowerCase()} avec LaFriend's.`.slice(0, 158)}
        path={`/services/${serviceId}`}
      />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative h-[50vh] min-h-[300px] md:h-[60vh]">
        <img
          src={service.image}
          alt={t(service.titleKey)}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-4 text-foreground/80 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent flex items-center justify-center">
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-accent-foreground" />
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {t(service.titleKey)}
              </h1>
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
              {t(service.descKey)}
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 md:py-12 space-y-10 md:space-y-16">
        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {service.highlights.map((h, i) => (
            <Card key={i} className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow">
              <h.icon className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-accent" />
              <p className="text-xs md:text-sm text-muted-foreground">{h.label}</p>
              <p className="font-bold text-sm md:text-lg text-foreground">{h.value}</p>
            </Card>
          ))}
        </div>

        {/* What's Included */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-foreground">
            Ce qui est inclus
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {service.included.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 md:p-4 rounded-lg bg-secondary">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-foreground">
            Comment ça marche
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {service.process.map((step) => (
              <Card key={step.step} className="p-4 md:p-6 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-5xl md:text-6xl font-bold text-accent/10">
                  {step.step}
                </div>
                <Badge className="bg-accent text-accent-foreground mb-3 text-xs">
                  Étape {step.step}
                </Badge>
                <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 md:py-12 bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
            Prêt à réserver ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base">
            Réservez en quelques clics ou demandez un devis personnalisé
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BookingModal>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8">
                <Zap className="h-4 w-4 mr-2" /> Réserver maintenant
              </Button>
            </BookingModal>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/#contact")}
              className="font-semibold px-8"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Demander un devis
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open(`https://wa.me/237693138292?text=${encodeURIComponent(`Bonjour, je suis intéressé par le service: ${t(service.titleKey)}. Pouvez-vous me donner plus d'informations ?`)}`, "_blank")}
              className="font-semibold px-8 text-green-600 border-green-600 hover:bg-green-50"
            >
              <Phone className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetails;
