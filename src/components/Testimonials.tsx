import { Star, Quote, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback } from "react";
export const Testimonials = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const {
    t
  } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const testimonials = [{
    name: "Marie Nguema",
    roleKey: "testimonials.role.homeowner",
    contentKey: "testimonials.t1",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    location: "Bafoussam"
  }, {
    name: "Paul Kamga",
    roleKey: "testimonials.role.director",
    contentKey: "testimonials.t2",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    location: "Douala"
  }, {
    name: "Sandrine Bella",
    roleKey: "testimonials.role.shopmanager",
    contentKey: "testimonials.t3",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    location: "Yaoundé"
  }, {
    name: "Jean-Pierre Fotso",
    roleKey: "testimonials.role.foreman",
    contentKey: "testimonials.t4",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    location: "Bafoussam"
  }];
  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);
  const nextSlide = useCallback(() => {
    goToSlide((activeIndex + 1) % testimonials.length);
  }, [activeIndex, testimonials.length, goToSlide]);
  const prevSlide = useCallback(() => {
    goToSlide((activeIndex - 1 + testimonials.length) % testimonials.length);
  }, [activeIndex, testimonials.length, goToSlide]);
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);
  return <section id="temoignages" className="py-20 bg-primary">
    <div className="container mx-auto px-4">
      <div ref={ref} className={`text-center mb-16 space-y-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <p className="text-accent font-semibold uppercase tracking-wider">{t('testimonials.tagline')}</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
          {t('testimonials.title')}
        </h2>
        <p className="text-base sm:text-lg text-primary-foreground/70 max-w-2xl mx-auto">
          {t('testimonials.subtitle')}
        </p>
      </div>

      {/* Featured Testimonial */}
      <div className="mb-12 relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {/* Navigation Arrows */}
        <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-10 bg-card/80 hover:bg-card shadow-lg rounded-full h-10 w-10 md:h-12 md:w-12" aria-label="Previous testimonial">
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 bg-card/80 hover:bg-card shadow-lg rounded-full h-10 w-10 md:h-12 md:w-12" aria-label="Next testimonial">
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <Card className={`relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-accent/20 p-8 md:p-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <Sparkles className="absolute top-4 right-4 w-8 h-8 text-accent/30" />

          {/* Animated content wrapper */}
          <div key={activeIndex} className="flex flex-col md:flex-row items-center gap-8 animate-fade-in">
            <div className="relative">
              <img src={testimonials[activeIndex].image} alt={testimonials[activeIndex].name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-accent/30 transition-transform duration-500" loading="lazy" decoding="async" />
              <div className="absolute -bottom-2 -right-2 bg-accent rounded-full p-2">
                <Quote className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-accent text-accent" />)}
              </div>
              <p className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
                "{t(testimonials[activeIndex].contentKey)}"
              </p>
              <p className="font-bold text-foreground text-lg">{testimonials[activeIndex].name}</p>
              <p className="text-muted-foreground">{t(testimonials[activeIndex].roleKey)} • {testimonials[activeIndex].location}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div className="h-full bg-accent transition-all ease-linear" style={{
              width: isPaused ? `${(activeIndex + 1) / testimonials.length * 100}%` : '100%',
              animation: isPaused ? 'none' : 'progress 6s linear infinite'
            }} />
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-accent w-8' : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'}`} aria-label={`Go to testimonial ${index + 1}`} />)}
          </div>
        </Card>
      </div>

      {/* Grid of testimonials */}
      {/*<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className={`bg-card/50 border-accent/10 p-6 transition-all duration-500 hover:bg-card hover:border-accent/30 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                "{t(testimonial.contentKey)}"
              </p>
            </Card>
          ))}
        </div>*/}
    </div>
  </section>;
};