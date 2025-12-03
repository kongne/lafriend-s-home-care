import { Star, Quote, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export const Testimonials = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: "Marie Nguema",
      roleKey: "testimonials.role.homeowner",
      contentKey: "testimonials.t1",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      location: "Bafoussam"
    },
    {
      name: "Paul Kamga",
      roleKey: "testimonials.role.director",
      contentKey: "testimonials.t2",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      location: "Douala"
    },
    {
      name: "Sandrine Bella",
      roleKey: "testimonials.role.shopmanager",
      contentKey: "testimonials.t3",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      location: "Yaoundé"
    },
    {
      name: "Jean-Pierre Fotso",
      roleKey: "testimonials.role.foreman",
      contentKey: "testimonials.t4",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      location: "Bafoussam"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section id="temoignages" className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t('testimonials.tagline')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
            {t('testimonials.title')}
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="mb-12">
          <Card className={`relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-accent/20 p-8 md:p-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}>
            <Sparkles className="absolute top-4 right-4 w-8 h-8 text-accent/30" />
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <img 
                  src={testimonials[activeIndex].image} 
                  alt={testimonials[activeIndex].name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-accent/30"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute -bottom-2 -right-2 bg-accent rounded-full p-2">
                  <Quote className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                  {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
                  "{t(testimonials[activeIndex].contentKey)}"
                </p>
                <p className="font-bold text-foreground text-lg">{testimonials[activeIndex].name}</p>
                <p className="text-muted-foreground">{t(testimonials[activeIndex].roleKey)} • {testimonials[activeIndex].location}</p>
              </div>
            </div>
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? 'bg-accent w-6' : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Grid of testimonials */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`p-4 md:p-6 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              } ${activeIndex === index ? 'ring-2 ring-accent' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Quote className="w-6 h-6 md:w-8 md:h-8 text-accent mb-4" />
              <p className="text-muted-foreground mb-6 text-xs sm:text-sm leading-relaxed line-clamp-3">
                "{t(testimonial.contentKey)}"
              </p>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="font-semibold text-foreground text-sm md:text-base">{testimonial.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{t(testimonial.roleKey)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
