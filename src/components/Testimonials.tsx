import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    name: "Marie Nguema",
    role: "Propriétaire de maison",
    content: "Service exceptionnel! Mon appartement n'a jamais été aussi propre. L'équipe est ponctuelle et très professionnelle.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Paul Kamga",
    role: "Directeur d'entreprise",
    content: "Nous utilisons leurs services pour nos bureaux depuis 2 ans. Toujours satisfaits de la qualité du travail.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Sandrine Bella",
    role: "Gérante de boutique",
    content: "Le meilleur rapport qualité-prix à Douala. Je recommande vivement pour tout type de nettoyage.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Jean-Pierre Fotso",
    role: "Chef de chantier",
    content: "Après nos travaux de construction, ils ont rendu le bâtiment impeccable en un temps record.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  }
];

export const Testimonials = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="temoignages" className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">Témoignages</p>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
            Ce Que Disent Nos Clients
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            La satisfaction de nos clients est notre plus grande fierté
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`p-6 bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
