import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cleaning.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";

export const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional cleaning service"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-primary/80"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
          {/* Left content */}
          <div className="text-primary-foreground space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <p className="text-sm uppercase tracking-wider text-accent font-semibold">
              {t('hero.tagline')}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <BookingModal>
                <Button 
                  size="lg" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                >
                  {t('hero.book')}
                </Button>
              </BookingModal>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('apropos')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
