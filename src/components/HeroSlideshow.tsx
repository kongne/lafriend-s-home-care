import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingModal } from "./BookingModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
interface Slide {
  image: string;
  titleKey: string;
  subtitleKey: string;
}
const slides: Slide[] = [{
  image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  titleKey: "hero.title",
  subtitleKey: "hero.description"
}, {
  image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1920&q=80",
  titleKey: "hero.slide2.title",
  subtitleKey: "hero.slide2.subtitle"
}, {
  image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=80",
  titleKey: "hero.slide3.title",
  subtitleKey: "hero.slide3.subtitle"
}];
export const HeroSlideshow = () => {
  const {
    t
  } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);
  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);
  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);
  return <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} role="region" aria-label="Hero slideshow">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div 
          key={index} 
          className={`absolute inset-0 z-0 transition-opacity duration-700 ${index === currentSlide ? "opacity-100" : "opacity-0"}`} 
          aria-hidden={index !== currentSlide}
        >
          <img 
            src={slide.image} 
            alt="" 
            className="w-full h-full object-cover" 
            loading={index === 0 ? "eager" : "lazy"}
            {...{ fetchpriority: index === 0 ? "high" : "low" } as any}
            decoding={index === 0 ? "sync" : "async"}
            width="1920"
            height="1080"
          />
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-card/30 hover:bg-card/50 text-primary-foreground h-12 w-12 rounded-full" aria-label="Previous slide">
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-card/30 hover:bg-card/50 text-primary-foreground h-12 w-12 rounded-full" aria-label="Next slide">
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
          <div key={currentSlide} className="text-primary-foreground space-y-6 animate-fade-in">
            <p className="text-sm uppercase tracking-wider text-accent font-semibold">
              {t("hero.tagline")}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {t(slides[currentSlide].titleKey)}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              {t(slides[currentSlide].subtitleKey)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <BookingModal>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  {t("hero.book")}
                </Button>
              </BookingModal>
              <Button size="lg" variant="outline" aria-label="Découvrir nos services de nettoyage professionnel" onClick={() => document.getElementById("apropos")?.scrollIntoView({
              behavior: "smooth"
            })} className="border-2 border-primary-foreground font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 text-primary bg-primary-foreground">
                {t("hero.learnMore")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-accent w-8" : "bg-primary-foreground/40 w-3 hover:bg-primary-foreground/60"}`} aria-label={`Go to slide ${index + 1}`} aria-current={index === currentSlide ? "true" : "false"} />)}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/20 z-20">
        <div className="h-full bg-accent transition-all" style={{
        width: isPaused ? `${(currentSlide + 1) / slides.length * 100}%` : "100%",
        animation: isPaused ? "none" : "progress 6s linear infinite"
      }} />
      </div>
    </section>;
};