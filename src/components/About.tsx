import { Award, Users, Clock, Shield, ArrowRight, Star, MapPin, Phone, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";
import { Button } from "./ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export const About = () => {
  const { t } = useLanguage();
  const { ref, isVisible } = useScrollReveal();

  const stats = [
    { icon: Users, value: "500+", labelKey: "about.stat1" },
    { icon: Clock, value: "24/7", labelKey: "about.stat2" },
    { icon: Award, value: "5+", labelKey: "about.stat3" },
    { icon: Shield, value: "100%", labelKey: "about.stat4" }
  ];

  return (
    <section id="apropos" className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`grid lg:grid-cols-2 gap-8 md:gap-12 items-start transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Left content */}
          <div className="space-y-5">
            <p className="text-accent font-semibold uppercase tracking-wider text-sm">{t('about.tagline')}</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {t('about.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed">
              <p dangerouslySetInnerHTML={{ __html: t('about.p1') }} />
              <p>{t('about.p2')}</p>
              <p>{t('about.p3')}</p>
              <p>{t('about.p4')}</p>
            </div>
            
            {/* Key highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { icon: CheckCircle, textKey: 'about.highlight1' },
                { icon: Star, textKey: 'about.highlight2' },
                { icon: MapPin, textKey: 'about.highlight3' },
                { icon: Phone, textKey: 'about.highlight4' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <item.icon className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{t(item.textKey)}</span>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <div className="flex flex-wrap gap-3 pt-4">
              <BookingModal>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-full sm:w-auto">
                  {t('hero.book')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </BookingModal>
            </div>
          </div>

          {/* Right content - Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-4 sm:p-6 md:p-8 rounded-lg text-center hover:bg-primary/90 transition-colors duration-300"
              >
                <stat.icon className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 text-accent" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm opacity-90">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
