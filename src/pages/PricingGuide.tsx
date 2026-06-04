import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { BookingModal } from "@/components/BookingModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { CheckCircle, Home, Building2, Car, Info, Calculator, MapPin } from "lucide-react";

const content = {
  fr: {
    title: "Combien coûte un service de nettoyage au Cameroun ?",
    intro:
      "Vous vous demandez combien coûte un service de nettoyage à Bafoussam, Douala ou Yaoundé ? Ce guide détaille les tarifs pratiqués par LaFriend's Services Ménagers pour le nettoyage résidentiel, commercial et automobile, ainsi que les facteurs qui influencent le prix final.",
    factorsTitle: "Quels facteurs influencent le prix d'un nettoyage ?",
    factors: [
      { t: "Superficie", d: "Plus la surface à nettoyer est grande, plus le temps et l'équipe nécessaires augmentent." },
      { t: "Type de service", d: "Un nettoyage de fond coûte davantage qu'un entretien régulier hebdomadaire." },
      { t: "Fréquence", d: "Les contrats récurrents (hebdomadaires ou mensuels) bénéficient de tarifs préférentiels." },
      { t: "Localisation", d: "Bafoussam, Douala et Yaoundé peuvent avoir de légers ajustements de prix selon le déplacement." },
      { t: "Produits utilisés", d: "Nos produits écologiques sont inclus, sans surcoût." },
      { t: "Niveau de saleté", d: "Un état très encrassé (post-chantier, après-fête) demande plus d'heures." },
    ],
    breakdownTitle: "Grille tarifaire indicative",
    rangesTitle: "Fourchettes de prix selon la taille",
    ranges: [
      { label: "Studio / 1 chambre", price: "15 000 – 25 000 FCFA" },
      { label: "Appartement 2-3 chambres", price: "25 000 – 45 000 FCFA" },
      { label: "Villa 4+ chambres", price: "45 000 – 80 000 FCFA" },
      { label: "Bureau (jusqu'à 100 m²)", price: "25 000 – 50 000 FCFA / passage" },
      { label: "Bureau (100-300 m²)", price: "50 000 – 120 000 FCFA / passage" },
      { label: "Lavage voiture standard", price: "5 000 – 8 000 FCFA" },
      { label: "Lavage voiture complet (int. + ext.)", price: "8 000 – 15 000 FCFA" },
    ],
    saveTitle: "Comment réduire le coût de votre nettoyage ?",
    saveTips: [
      "Optez pour un contrat mensuel plutôt que des interventions ponctuelles.",
      "Regroupez plusieurs services (résidentiel + automobile) pour bénéficier d'une remise.",
      "Parrainez un proche : vous gagnez tous les deux des points fidélité.",
      "Préparez l'espace avant notre arrivée (rangement) pour réduire la durée d'intervention.",
    ],
    faqTitle: "Questions fréquentes sur les tarifs",
    faqs: [
      { q: "Le devis est-il vraiment gratuit ?", a: "Oui. Tous nos devis sont gratuits, sans engagement et envoyés sous 24 h." },
      { q: "Les produits de nettoyage sont-ils inclus ?", a: "Oui, nos produits écologiques et notre matériel professionnel sont inclus dans le prix." },
      { q: "Y a-t-il des frais de déplacement ?", a: "Aucun frais caché à Bafoussam. Pour Douala et Yaoundé, un ajustement peut s'appliquer selon la zone." },
      { q: "Puis-je payer après le service ?", a: "Oui. Le paiement s'effectue à la fin de la prestation, en espèces ou par mobile money." },
    ],
    ctaTitle: "Obtenez un devis personnalisé gratuit",
    ctaText: "Décrivez vos besoins et recevez une estimation précise sous 24 h.",
    ctaQuote: "Demander un devis",
    ctaBook: "Réserver maintenant",
    backToPricing: "Voir la grille tarifaire complète",
  },
  en: {
    title: "How much does a cleaning service cost in Cameroon?",
    intro:
      "Wondering how much a cleaning service costs in Bafoussam, Douala or Yaoundé? This guide breaks down LaFriend's Services Ménagers prices for residential, commercial and automotive cleaning, plus the factors that drive the final price.",
    factorsTitle: "What drives the price of a cleaning service?",
    factors: [
      { t: "Size", d: "The larger the area, the more time and team members are required." },
      { t: "Service type", d: "A deep clean costs more than recurring weekly maintenance." },
      { t: "Frequency", d: "Weekly or monthly contracts unlock preferential pricing." },
      { t: "Location", d: "Bafoussam, Douala and Yaoundé may have small travel-based adjustments." },
      { t: "Products used", d: "Our eco-friendly products are always included at no extra cost." },
      { t: "Soil level", d: "Heavy soil (post-construction, post-party) requires more hours." },
    ],
    breakdownTitle: "Indicative pricing table",
    rangesTitle: "Price ranges by size",
    ranges: [
      { label: "Studio / 1 bedroom", price: "15,000 – 25,000 FCFA" },
      { label: "2-3 bedroom apartment", price: "25,000 – 45,000 FCFA" },
      { label: "Villa 4+ bedrooms", price: "45,000 – 80,000 FCFA" },
      { label: "Office (up to 100 m²)", price: "25,000 – 50,000 FCFA / visit" },
      { label: "Office (100-300 m²)", price: "50,000 – 120,000 FCFA / visit" },
      { label: "Standard car wash", price: "5,000 – 8,000 FCFA" },
      { label: "Full car wash (int. + ext.)", price: "8,000 – 15,000 FCFA" },
    ],
    saveTitle: "How to lower your cleaning cost",
    saveTips: [
      "Pick a monthly contract over one-off visits.",
      "Bundle services (residential + automotive) for a discount.",
      "Refer a friend — you both earn loyalty points.",
      "Tidy the space before we arrive to reduce the work time.",
    ],
    faqTitle: "Pricing FAQ",
    faqs: [
      { q: "Is the quote really free?", a: "Yes. All quotes are free, no commitment, sent within 24 hours." },
      { q: "Are cleaning products included?", a: "Yes — our eco-friendly products and professional equipment are included." },
      { q: "Are there travel fees?", a: "No hidden fees in Bafoussam. For Douala and Yaoundé, a small adjustment may apply." },
      { q: "Can I pay after the service?", a: "Yes. Pay at the end of the service in cash or via mobile money." },
    ],
    ctaTitle: "Get a free personalized quote",
    ctaText: "Describe your needs and get an accurate estimate within 24 hours.",
    ctaQuote: "Request a quote",
    ctaBook: "Book now",
    backToPricing: "View full pricing table",
  },
};

const PricingGuide = () => {
  const { language } = useLanguage();
  const c = content[language as "fr" | "en"] ?? content.fr;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={
          language === "en"
            ? "How Much Does a Cleaning Service Cost? — LaFriend's"
            : "Combien coûte un service de nettoyage ? — LaFriend's"
        }
        description={
          language === "en"
            ? "Transparent pricing guide for residential, commercial and car cleaning services in Cameroon. Real ranges, cost factors and tips to save."
            : "Guide transparent des tarifs de nettoyage résidentiel, commercial et automobile au Cameroun. Fourchettes, facteurs de coût et astuces."
        }
        path="/pricing-guide"
        type="article"
      />
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      <Navbar />

      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-accent font-semibold mb-3">
            <Calculator className="h-4 w-4" />
            {language === "en" ? "Pricing guide" : "Guide des tarifs"}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {c.title}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {c.intro}
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {c.factorsTitle}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {c.factors.map((f, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.t}</h3>
                    <p className="text-sm text-muted-foreground">{f.d}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {c.breakdownTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <Home className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {language === "en" ? "Residential" : "Résidentiel"}
              </h3>
              <p className="text-2xl font-bold text-foreground">15 000+ <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
            </Card>
            <Card className="p-5">
              <Building2 className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {language === "en" ? "Commercial" : "Commercial"}
              </h3>
              <p className="text-2xl font-bold text-foreground">25 000+ <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
            </Card>
            <Card className="p-5">
              <Car className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {language === "en" ? "Car wash" : "Lavage auto"}
              </h3>
              <p className="text-2xl font-bold text-foreground">5 000+ <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
            </Card>
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-4">{c.rangesTitle}</h3>
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <tbody>
                {c.ranges.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-4 text-sm md:text-base text-foreground">{r.label}</td>
                    <td className="p-4 text-sm md:text-base font-semibold text-foreground text-right">{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {language === "en"
              ? "Indicative prices for Bafoussam, Douala and Yaoundé. Final quote depends on the visit."
              : "Prix indicatifs pour Bafoussam, Douala et Yaoundé. Devis final selon visite."}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {c.saveTitle}
          </h2>
          <ul className="space-y-3">
            {c.saveTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {c.faqTitle}
          </h2>
          <div className="space-y-4">
            {c.faqs.map((f, i) => (
              <Card key={i} className="p-5">
                <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{c.ctaTitle}</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">{c.ctaText}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/quote">{c.ctaQuote}</Link>
            </Button>
            <BookingModal>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                {c.ctaBook}
              </Button>
            </BookingModal>
          </div>
          <div className="mt-6">
            <Link to="/#pricing" className="text-sm text-accent hover:underline">
              {c.backToPricing}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingGuide;