import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const faqs = [
  {
    question: "Quels types de services de nettoyage proposez-vous?",
    answer: "Nous offrons une gamme complète de services: nettoyage résidentiel, commercial, après construction, lavage de vitres, et lavage automobile. Chaque service peut être personnalisé selon vos besoins spécifiques."
  },
  {
    question: "Comment puis-je réserver un service?",
    answer: "Vous pouvez réserver directement sur notre site en remplissant le formulaire de réservation, nous appeler au +237 693 96 55 01, ou nous contacter via WhatsApp. Nous confirmerons votre rendez-vous dans les plus brefs délais."
  },
  {
    question: "Quels sont vos tarifs?",
    answer: "Nos tarifs varient selon le type de service et la superficie à nettoyer. Le nettoyage résidentiel commence à 15,000 FCFA, le commercial à 25,000 FCFA, et le lavage auto à 5,000 FCFA. Contactez-nous pour un devis personnalisé gratuit."
  },
  {
    question: "Utilisez-vous des produits écologiques?",
    answer: "Oui, nous privilégions l'utilisation de produits écologiques et respectueux de l'environnement. Sur demande, nous pouvons utiliser exclusivement des produits bio pour votre nettoyage."
  },
  {
    question: "Quelle est votre zone d'intervention?",
    answer: "Nous intervenons principalement à Douala et ses environs. Pour les zones plus éloignées, des frais de déplacement supplémentaires peuvent s'appliquer. Contactez-nous pour vérifier la disponibilité dans votre secteur."
  },
  {
    question: "Vos équipes sont-elles assurées?",
    answer: "Absolument. Toutes nos équipes sont formées professionnellement et couvertes par une assurance responsabilité civile pour votre tranquillité d'esprit."
  }
];

export const FAQ = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="faq" className="py-20 bg-secondary">
      <div className="container mx-auto px-4 max-w-4xl">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Questions Fréquentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className={`space-y-4 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6 data-[state=open]:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-accent transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
