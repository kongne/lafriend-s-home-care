import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";

export const Testimonials = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();

  const testimonials = [
    {
      name: "Marie Nguema",
      roleKey: "testimonials.role.homeowner",
      contentKey: "testimonials.t1",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Paul Kamga",
      roleKey: "testimonials.role.director",
      contentKey: "testimonials.t2",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Sandrine Bella",
      roleKey: "testimonials.role.shopmanager",
      contentKey: "testimonials.t3",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Jean-Pierre Fotso",
      roleKey: "testimonials.role.foreman",
      contentKey: "testimonials.t4",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ];

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`p-4 md:p-6 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Quote className="w-6 h-6 md:w-8 md:h-8 text-accent mb-4" />
              <p className="text-muted-foreground mb-6 text-xs sm:text-sm leading-relaxed">
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
