import { Award, Users, Clock, Shield, ArrowRight } from "lucide-react";
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

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="apropos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`grid lg:grid-cols-2 gap-8 md:gap-12 items-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Left content */}
          <div className="space-y-6">
            <p className="text-accent font-semibold uppercase tracking-wider">{t('about.tagline')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {t('about.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground text-base md:text-lg">
              <p dangerouslySetInnerHTML={{ __html: t('about.p1') }} />
              <p>{t('about.p2')}</p>
              <p>{t('about.p3')}</p>
            </div>
            
            {/* Dynamic buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <BookingModal>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  {t('hero.book')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </BookingModal>
              <Button 
                variant="outline" 
                size="lg"
                onClick={scrollToServices}
                className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>

          {/* Right content - Stats */}
          {/*<div className="grid grid-cols-2 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-4 sm:p-6 md:p-8 rounded-lg text-center hover:bg-primary/90 transition-colors duration-300"
              >
                <stat.icon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 text-accent" />
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm opacity-90">{t(stat.labelKey)}</div>
              </div>
            ))
          </div>*/}
        </div>
      </div>
    </section>
  );
};
