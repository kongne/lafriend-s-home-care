import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";

export const Pricing = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();

  const pricingPlans = [
    {
      nameKey: 'pricing.residential',
      price: "25,000",
      unitKey: 'pricing.residential.unit',
      features: [
        'pricing.residential.f1',
        'pricing.residential.f2',
        'pricing.residential.f3',
        'pricing.residential.f4',
        'pricing.residential.f5'
      ]
    },
    {
      nameKey: 'pricing.commercial',
      price: "50,000",
      unitKey: 'pricing.commercial.unit',
      popular: true,
      features: [
        'pricing.commercial.f1',
        'pricing.commercial.f2',
        'pricing.commercial.f3',
        'pricing.commercial.f4',
        'pricing.commercial.f5',
        'pricing.commercial.f6'
      ]
    },
    {
      nameKey: 'pricing.car',
      price: "8,000",
      unitKey: 'pricing.car.unit',
      features: [
        'pricing.car.f1',
        'pricing.car.f2',
        'pricing.car.f3',
        'pricing.car.f4',
        'pricing.car.f5'
      ]
    }
  ];

  return (
    <section id="tarifs" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t('pricing.tagline')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {t('pricing.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`p-6 md:p-8 relative transition-all duration-500 hover:-translate-y-2 ${
                plan.popular
                  ? "border-2 border-accent shadow-2xl lg:scale-105"
                  : "border border-border hover:shadow-xl"
              } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold animate-bounce-subtle">
                  {t('pricing.popular')}
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">{t(plan.nameKey)}</h3>
                <div className="mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-primary">{plan.price}</span>
                </div>
                <p className="text-muted-foreground text-sm">{t(plan.unitKey)}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((featureKey, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm md:text-base">{t(featureKey)}</span>
                  </li>
                ))}
              </ul>

              <BookingModal>
                <Button
                  className={`w-full font-semibold transition-transform hover:scale-105 ${
                    plan.popular
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {t('pricing.book')}
                </Button>
              </BookingModal>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm md:text-base">
            {t('pricing.note')}
          </p>
        </div>
      </div>
    </section>
  );
};
