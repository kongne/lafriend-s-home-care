import { Home, Building2, HardHat, Sparkles, Car, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const services = [
  {
    icon: Home,
    title: "Nettoyage Résidentiel",
    description: "Service complet pour votre maison incluant toutes les pièces, sols, surfaces et vitres.",
    features: ["Nettoyage profond", "Produits écologiques", "Équipe expérimentée"]
  },
  {
    icon: Building2,
    title: "Nettoyage Commercial",
    description: "Solutions professionnelles pour bureaux, commerces et espaces de travail.",
    features: ["Horaires flexibles", "Service régulier", "Matériel professionnel"]
  },
  {
    icon: HardHat,
    title: "Nettoyage de Construction",
    description: "Nettoyage après travaux pour un résultat impeccable et prêt à l'usage.",
    features: ["Élimination débris", "Nettoyage complet", "Finitions soignées"]
  },
  {
    icon: Sparkles,
    title: "Nettoyage de Vitres",
    description: "Des vitres cristallines pour plus de luminosité dans vos espaces.",
    features: ["Sans traces", "Hauteurs accessibles", "Produits adaptés"]
  },
  {
    icon: Car,
    title: "Lavage de Voiture",
    description: "Service de lavage automobile complet pour l'extérieur et l'intérieur.",
    features: ["Lavage extérieur", "Nettoyage intérieur", "Traitement des tissus"]
  },
  {
    icon: Home,
    title: "Service Personnalisé",
    description: "Besoin d'un service spécifique? Nous créons une solution sur mesure.",
    features: ["Solutions adaptées", "Devis gratuit", "Conseil expert"]
  }
];

export const Services = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="services" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">Nos Services</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Solutions de Nettoyage Complètes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des services professionnels adaptés à tous vos besoins de nettoyage
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-8 h-8 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">{service.title}</h3>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
