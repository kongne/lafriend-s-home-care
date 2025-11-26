import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Nettoyage Résidentiel",
    price: "25,000",
    unit: "FCFA/visite",
    features: [
      "Nettoyage complet des pièces",
      "Sols et surfaces",
      "Dépoussiérage",
      "Salle de bain et cuisine",
      "Produits écologiques inclus"
    ]
  },
  {
    name: "Nettoyage Commercial",
    price: "50,000",
    unit: "FCFA/mois",
    popular: true,
    features: [
      "Service hebdomadaire",
      "Bureaux et espaces communs",
      "Sanitaires professionnels",
      "Matériel professionnel",
      "Horaires flexibles",
      "Contrat mensuel"
    ]
  },
  {
    name: "Lavage de Voiture",
    price: "8,000",
    unit: "FCFA/lavage",
    features: [
      "Lavage extérieur complet",
      "Nettoyage intérieur",
      "Aspiration",
      "Traitement des plastiques",
      "Vitres impeccables"
    ]
  }
];

export const Pricing = () => {
  return (
    <section id="tarifs" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <p className="text-accent font-semibold uppercase tracking-wider">Nos Tarifs</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Tarifs Transparents et Compétitifs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des prix justes pour des services de qualité supérieure
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative ${
                plan.popular
                  ? "border-2 border-accent shadow-2xl scale-105"
                  : "border border-border hover:shadow-xl"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Populaire
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-4">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                </div>
                <p className="text-muted-foreground text-sm">{plan.unit}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-full font-semibold ${
                  plan.popular
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Réserver
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            * Prix indicatifs. Devis personnalisé disponible sur demande.
          </p>
        </div>
      </div>
    </section>
  );
};
