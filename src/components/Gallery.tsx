import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface GalleryItem {
  before: string;
  after: string;
  titleKey: string;
  category: string;
  stats?: { label: string; value: string };
}

const galleryItems: GalleryItem[] = [
  {
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.kitchen",
    category: "residential",
    stats: { label: "Temps", value: "3h" }
  },
  {
    before: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.office",
    category: "commercial",
    stats: { label: "Surface", value: "200m²" }
  },
  {
    before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.car",
    category: "car",
    stats: { label: "Durée", value: "1h30" }
  },
  {
    before: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.bathroom",
    category: "residential",
    stats: { label: "Temps", value: "2h" }
  }
];

const BeforeAfterCard = ({ item, index, isVisible, t }: { item: GalleryItem; index: number; isVisible: boolean; t: (key: string) => string }) => {
  const [showAfter, setShowAfter] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer group transition-all duration-700 hover:shadow-2xl hover:scale-[1.02] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onMouseEnter={() => setShowAfter(true)}
      onMouseLeave={() => setShowAfter(false)}
      onTouchStart={() => setShowAfter(!showAfter)}
    >
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-muted">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={item.before}
          alt={`${t(item.titleKey)} - ${t('gallery.before')}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            showAfter ? "opacity-0 scale-110" : "opacity-100 scale-100"
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
        />
        <img
          src={item.after}
          alt={`${t(item.titleKey)} - ${t('gallery.after')}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            showAfter ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
          loading="lazy"
          decoding="async"
        />
        
        {/* Category badge */}
        <Badge className="absolute top-4 right-4 bg-background/80 text-foreground backdrop-blur-sm">
          {item.category}
        </Badge>
        
        {/* Status label */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
          showAfter 
            ? "bg-accent text-accent-foreground" 
            : "bg-primary text-primary-foreground"
        }`}>
          {showAfter ? t('gallery.after') : t('gallery.before')}
        </div>
        
        {/* View icon on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showAfter ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-accent/90 rounded-full p-3">
            <Eye className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>
        
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">{t(item.titleKey)}</p>
              <p className="text-white/70 text-xs sm:text-sm">{t('gallery.hover')}</p>
            </div>
            {item.stats && (
              <div className="text-right">
                <p className="text-accent font-bold text-lg">{item.stats.value}</p>
                <p className="text-white/60 text-xs">{item.stats.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Gallery = () => {
  const { ref, isVisible } = useScrollReveal();
  const { t } = useLanguage();

  return (
    <section id="galerie" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`text-center mb-16 space-y-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-accent font-semibold uppercase tracking-wider">{t('gallery.tagline')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {t('gallery.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <BeforeAfterCard key={index} item={item} index={index} isVisible={isVisible} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
