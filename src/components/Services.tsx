import { useNavigate } from "react-router-dom";
import { Home, Building2, HardHat, Sparkles, Car, CheckCircle, ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";

export const Services = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const services = [
    { id: "residential", icon: Home, titleKey: 'services.residential', descKey: 'services.residential.desc', features: ['services.residential.f1', 'services.residential.f2', 'services.residential.f3'] },
    { id: "commercial", icon: Building2, titleKey: 'services.commercial', descKey: 'services.commercial.desc', features: ['services.commercial.f1', 'services.commercial.f2', 'services.commercial.f3'] },
    { id: "construction", icon: HardHat, titleKey: 'services.construction', descKey: 'services.construction.desc', features: ['services.construction.f1', 'services.construction.f2', 'services.construction.f3'] },
    { id: "windows", icon: Sparkles, titleKey: 'services.windows', descKey: 'services.windows.desc', features: ['services.windows.f1', 'services.windows.f2', 'services.windows.f3'] },
    { id: "car", icon: Car, titleKey: 'services.car', descKey: 'services.car.desc', features: ['services.car.f1', 'services.car.f2', 'services.car.f3'] },
    { id: "custom", icon: Home, titleKey: 'services.custom', descKey: 'services.custom.desc', features: ['services.custom.f1', 'services.custom.f2', 'services.custom.f3'] }
  ];

  return (
    <section id="services" className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-10 md:mb-16 space-y-3 md:space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider text-sm">{t('services.tagline')}</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {t('services.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`p-5 md:p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card group cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => service.id !== "custom" ? navigate(`/services/${service.id}`) : navigate("/quote")}
            >
              <div className="mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-6 h-6 md:w-8 md:h-8 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-accent transition-colors">{t(service.titleKey)}</h3>
              <p className="text-muted-foreground mb-4 md:mb-6 text-sm">{t(service.descKey)}</p>
              <ul className="space-y-2 mb-4 md:mb-6">
                {service.features.map((featureKey, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{t(featureKey)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <BookingModal>
                  <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-sm" onClick={e => e.stopPropagation()}>
                    {t('hero.book')}
                  </Button>
                </BookingModal>
                <Button variant="outline" size="icon" className="shrink-0" onClick={e => { e.stopPropagation(); service.id !== "custom" ? navigate(`/services/${service.id}`) : navigate("/quote"); }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quote CTA */}
        <div className={`mt-8 md:mt-12 text-center transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/quote")}
            className="font-semibold px-6 md:px-8"
          >
            <FileText className="h-4 w-4 mr-2" />
            Demander un devis gratuit
          </Button>
        </div>
      </div>
    </section>
  );
};
