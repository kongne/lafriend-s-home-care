import { Star, Quote, Sparkles, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Section } from "@/components/ui/section";
import { AnimatedSection } from "@/components/ui/animated-section";

const PROGRESS_DURATION = 6000;

const defaultTestimonials = [{
  name: "Marie Nguema",
  roleKey: "testimonials.role.homeowner",
  contentKey: "testimonials.t1",
  rating: 5,
  image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face",
  location: "Bafoussam"
}, {
  name: "Paul Kamga",
  roleKey: "testimonials.role.director",
  contentKey: "testimonials.t2",
  rating: 5,
  image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop&crop=face",
  location: "Douala"
}, {
  name: "Sandrine Bella",
  roleKey: "testimonials.role.shopmanager",
  contentKey: "testimonials.t3",
  rating: 5,
  image: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=100&h=100&fit=crop&crop=face",
  location: "Yaoundé"
}, {
  name: "Jean-Pierre Fotso",
  roleKey: "testimonials.role.foreman",
  contentKey: "testimonials.t4",
  rating: 5,
  image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  location: "Bafoussam"
}];

export const Testimonials = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const { data: adminTestimonials } = useQuery({
    queryKey: ['landing_admin_testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('client_name, role, company, content, rating, location, avatar_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(t => ({
        name: t.client_name,
        role: t.role || "Client Vérifié",
        company: t.company,
        content: t.content,
        rating: t.rating || 5,
        image: t.avatar_url,
        location: t.location || ""
      }));
    }
  });

  const { data: featuredReviews } = useQuery({
    queryKey: ['landing_featured_reviews'],
    enabled: !adminTestimonials || adminTestimonials.length === 0,
    queryFn: async () => {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, booking_id')
        .eq('is_public', true)
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      const bookingIds = reviewsData.map((r: any) => r.booking_id).filter(Boolean);
      let bookingsMap: Record<string, any> = {};

      if (bookingIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, full_name, service_type, address')
          .in('id', bookingIds);

        if (!bookingsError && bookingsData) {
          bookingsMap = Object.fromEntries(bookingsData.map((b: any) => [b.id, b]));
        }
      }

      return reviewsData.map((r: any) => ({
        ...r,
        booking: bookingsMap[r.booking_id] || null
      }));
    }
  });

  const { data: fetchedTestimonials } = useQuery({
    queryKey: ['landing_testimonials'],
    enabled: !adminTestimonials || (adminTestimonials.length === 0 && (!featuredReviews || featuredReviews.length === 0)),
    queryFn: async () => {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback_ratings')
        .select('id, rating, comment, created_at, booking_id')
        .not('comment', 'is', null)
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(5);

      if (feedbackError) throw feedbackError;
      if (!feedbackData || feedbackData.length === 0) return [];

      const bookingIds = feedbackData.map((f: any) => f.booking_id).filter(Boolean);
      let bookingsMap: Record<string, any> = {};

      if (bookingIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, full_name, address')
          .in('id', bookingIds);

        if (!bookingsError && bookingsData) {
          bookingsMap = Object.fromEntries(bookingsData.map((b: any) => [b.id, b]));
        }
      }

      return feedbackData.map((f: any) => ({
        ...f,
        bookings: bookingsMap[f.booking_id] ? [bookingsMap[f.booking_id]] : []
      }));
    }
  });

  const testimonials = adminTestimonials && adminTestimonials.length > 0
    ? adminTestimonials
    : featuredReviews && featuredReviews.length > 0
      ? featuredReviews.map((fr: any) => {
          const bookingObj = Array.isArray(fr.booking) ? fr.booking[0] : fr.booking;
          return {
            name: bookingObj?.full_name || "Client Vérifié",
            role: bookingObj?.service_type || "Client",
            content: fr.comment || "",
            rating: fr.rating,
            image: null,
            location: bookingObj?.address || ""
          };
        })
      : fetchedTestimonials && fetchedTestimonials.length > 0
        ? fetchedTestimonials.map((ft: any) => ({
            name: ft.bookings?.[0]?.full_name || ft.bookings?.full_name || "Client Anonyme",
            role: "Client Vérifié",
            content: ft.comment,
            rating: ft.rating,
            image: null,
            location: ft.bookings?.[0]?.address || ft.bookings?.address || ""
          }))
        : defaultTestimonials.map(dt => ({
            name: dt.name,
            role: t(dt.roleKey),
            content: t(dt.contentKey),
            rating: dt.rating,
            image: dt.image,
            location: dt.location
          }));

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
  return (
    <Section id="temoignages" bg="primary" tagline={t('testimonials.tagline')} title={t('testimonials.title')} subtitle={t('testimonials.subtitle')}>
      <div ref={ref}>

      {/* Featured Testimonial */}
      <div className="mb-12 relative px-6 sm:px-0" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        {/* Navigation Arrows */}
        <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-0 sm:-left-2 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" aria-label="Previous testimonial">
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-0 sm:-right-2 md:translate-x-6 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" aria-label="Next testimonial">
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </Button>

        <Card className={`relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-accent/20 p-5 sm:p-8 md:p-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <Sparkles className="absolute top-4 right-4 w-8 h-8 text-accent/30" />

          {/* Animated content wrapper */}
          <div key={activeIndex} className="flex flex-col md:flex-row items-center gap-8 animate-fade-in" aria-live="polite" aria-atomic="true">
            <div className="relative">
              {testimonials[activeIndex].image ? (
                <img src={testimonials[activeIndex].image} alt={testimonials[activeIndex].name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-accent/30 transition-transform duration-500" loading="lazy" decoding="async" width={128} height={128} />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-accent/30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-foreground/50" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-accent rounded-full p-2">
                <Quote className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-accent text-accent" />)}
              </div>
              <p className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
                "{testimonials[activeIndex].content}"
              </p>
              <p className="font-bold text-foreground text-lg">{testimonials[activeIndex].name}</p>
              <p className="text-muted-foreground">{testimonials[activeIndex].role} {testimonials[activeIndex].location ? `• ${testimonials[activeIndex].location}` : ''}</p>
              {testimonials[activeIndex].role !== "Client Vérifié" && testimonials[activeIndex].role !== "Client" && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent font-medium mt-1">
                  <Sparkles className="w-3 h-3" /> {t('trust.verified')}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div className="h-full bg-accent" style={{
              animation: isPaused ? 'none' : `progress-bar ${PROGRESS_DURATION}ms linear`
            }} />
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-accent w-8' : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'}`} aria-label={`Go to testimonial ${index + 1}`} />)}
          </div>
        </Card>
      </div>

      {/* Grid of mini-reviews */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {testimonials.slice(0, 4).map((testimonial, index) => (
          <Card
            key={index}
            className={`bg-card/50 border-accent/10 p-4 md:p-5 transition-all duration-500 hover:bg-card hover:border-accent/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              {testimonial.image ? (
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground/50" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{testimonial.name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent font-medium">
                  <Sparkles className="w-3 h-3" /> {t('trust.verified')}
                </span>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              "{testimonial.content}"
            </p>
          </Card>
        ))}
      </div>

      </div>

      {/* View all link */}
      <AnimatedSection>
        <div className="text-center">
          <Link
            to="/customer-portal#reviews"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-sm transition-colors"
          >
            {t('testimonials.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </AnimatedSection>
    </Section>
  );
};