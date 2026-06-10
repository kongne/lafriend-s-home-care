import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SlideData {
  id: string | number;
  image?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  content?: React.ReactNode;
}

interface SlideshowProps {
  slides: SlideData[];
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showProgress?: boolean;
  showPlayPause?: boolean;
  transition?: "fade" | "slide";
  className?: string;
  slideClassName?: string;
  onSlideChange?: (index: number) => void;
  pauseOnHover?: boolean;
  lazyLoad?: boolean;
  ariaLabel?: string;
}

export const Slideshow = ({
  slides,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  showProgress = true,
  showPlayPause = false,
  transition = "fade",
  className,
  slideClassName,
  onSlideChange,
  pauseOnHover = true,
  lazyLoad = true,
  ariaLabel = "Image slideshow",
}: SlideshowProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [direction, setDirection] = useState<"left" | "right">("right");
  const containerRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number, dir?: "left" | "right") => {
    const newIndex = ((index % slides.length) + slides.length) % slides.length;
    setDirection(dir || (newIndex > activeIndex ? "right" : "left"));
    setActiveIndex(newIndex);
    onSlideChange?.(newIndex);
    
    // Preload adjacent images
    if (lazyLoad) {
      setLoadedImages(prev => {
        const next = new Set(prev);
        next.add(newIndex);
        next.add((newIndex + 1) % slides.length);
        next.add((newIndex - 1 + slides.length) % slides.length);
        return next;
      });
    }
  }, [activeIndex, slides.length, onSlideChange, lazyLoad]);

  const nextSlide = useCallback(() => {
    goToSlide(activeIndex + 1, "right");
  }, [activeIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(activeIndex - 1, "left");
  }, [activeIndex, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, interval, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const shouldLoadImage = (index: number) => !lazyLoad || loadedImages.has(index);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded-lg", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative w-full aspect-video md:aspect-[21/9]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${slides.length}`}
            aria-hidden={index !== activeIndex}
            className={cn(
              "absolute inset-0 w-full h-full",
              transition === "fade" && [
                "transition-opacity duration-700 ease-in-out",
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0",
              ],
              transition === "slide" && [
                "transition-transform duration-500 ease-in-out",
                index === activeIndex && "translate-x-0 z-10",
                index !== activeIndex && direction === "right" && "translate-x-full z-0",
                index !== activeIndex && direction === "left" && "-translate-x-full z-0",
              ],
              slideClassName
            )}
          >
            {/* Background Image */}
            {slide.image && shouldLoadImage(index) && (
              <img
                src={slide.image}
                alt={slide.title || `Slide ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                width={1920}
                height={1080}
              />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end justify-start p-6 md:p-12">
              <div className="max-w-2xl text-white space-y-2 md:space-y-4">
                {slide.title && (
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight animate-fade-in">
                    {slide.title}
                  </h3>
                )}
                {slide.subtitle && (
                  <p className="text-lg md:text-xl text-white/90 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    {slide.subtitle}
                  </p>
                )}
                {slide.caption && (
                  <p className="text-sm md:text-base text-white/80 animate-fade-in" style={{ animationDelay: "200ms" }}>
                    {slide.caption}
                  </p>
                )}
                {slide.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background shadow-lg rounded-full h-10 w-10 md:h-12 md:w-12 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background shadow-lg rounded-full h-10 w-10 md:h-12 md:w-12 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </>
      )}

      {/* Play/Pause Button */}
      {showPlayPause && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPlaying(p => !p)}
          className="absolute top-4 right-4 z-20 bg-background/80 hover:bg-background rounded-full h-8 w-8 backdrop-blur-sm"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Progress Bar */}
        {showProgress && isPlaying && (
          <div className="h-1 bg-white/20">
            <div
              className="h-full bg-accent transition-all ease-linear"
              style={{
                animation: isPaused ? "none" : `slideshow-progress ${interval}ms linear`,
                animationIterationCount: "1",
              }}
              key={activeIndex}
            />
          </div>
        )}

        {/* Dots */}
        {showDots && slides.length > 1 && (
          <div className="flex justify-center gap-2 py-4 bg-gradient-to-t from-black/50 to-transparent">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "bg-accent w-8"
                    : "bg-white/50 w-2 hover:bg-white/80"
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex ? "true" : "false"}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideshow-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Slideshow;
