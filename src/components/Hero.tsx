import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cleaning.jpg";
import { BookingForm } from "./BookingForm";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional cleaning service"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/80"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-primary-foreground space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <p className="text-sm uppercase tracking-wider text-accent font-semibold">
              La propreté à portée de clic, l'excellence à domicile
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Services de nettoyage professionnels
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              Notre équipe d'experts offre des services de qualité supérieure pour votre maison, 
              bureau ou véhicule. Avec notre plateforme en ligne facile d'utilisation, réservez 
              en quelques clics et profitez d'un environnement impeccable.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-lg px-8 py-6"
              >
                RÉSERVER UN SERVICE
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold text-lg px-8 py-6"
              >
                EN SAVOIR PLUS
              </Button>
            </div>
          </div>

          {/* Right content - Booking form */}
          <div className="animate-in fade-in slide-in-from-right duration-700 delay-300">
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
};
