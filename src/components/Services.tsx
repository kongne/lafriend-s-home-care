import { Home, Building2, HardHat, Sparkles, Car, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";

export const Services = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();

  const services = [
    {
      icon: Home,
      titleKey: 'services.residential',
      descKey: 'services.residential.desc',
      features: ['services.residential.f1', 'services.residential.f2', 'services.residential.f3']
    },
    {
      icon: Building2,
      titleKey: 'services.commercial',
      descKey: 'services.commercial.desc',
      features: ['services.commercial.f1', 'services.commercial.f2', 'services.commercial.f3']
    },
    {
      icon: HardHat,
      titleKey: 'services.construction',
      descKey: 'services.construction.desc',
      features: ['services.construction.f1', 'services.construction.f2', 'services.construction.f3']
    },
    {
      icon: Sparkles,
      titleKey: 'services.windows',
      descKey: 'services.windows.desc',
      features: ['services.windows.f1', 'services.windows.f2', 'services.windows.f3']
    },
    {
      icon: Car,
      titleKey: 'services.car',
      descKey: 'services.car.desc',
      features: ['services.car.f1', 'services.car.f2', 'services.car.f3']
    },
    {
      icon: Home,
      titleKey: 'services.custom',
      descKey: 'services.custom.desc',
      features: ['services.custom.f1', 'services.custom.f2', 'services.custom.f3']
    }
  ];

  return (
    <section id="services" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t('services.tagline')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {t('services.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`p-6 md:p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-7 h-7 md:w-8 md:h-8 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">{t(service.titleKey)}</h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">{t(service.descKey)}</p>
              <ul className="space-y-2">
                {service.features.map((featureKey, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{t(featureKey)}</span>
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
