import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import before1 from "@/assets/before-after/before-1.webp";
import before2 from "@/assets/before-after/before-2.webp";
import after1 from "@/assets/before-after/after-1.webp";
import after2 from "@/assets/before-after/after-2.webp";

interface GalleryItem {
  before: string;
  after: string;
  titleKey: string;
  category: string;
  stats?: { label: string; value: string };
  local?: boolean;
  overlay?: {
    client: string;
    location: string;
    propertyFr: string;
    propertyEn: string;
  };
}

const galleryItems: GalleryItem[] = [
  {
    before: before1,
    after: after1,
    titleKey: "gallery.bandjounVilla",
    category: "post-construction",
    local: true,
    stats: { label: "Bandjoun", value: "R+1" },
    overlay: {
      client: "Alexis",
      location: "Centre Climatique de Bandjoun",
      propertyFr: "Villa R+1 — 6 chambres, 5 SDB",
      propertyEn: "Two-storey villa — 6 bedrooms, 5 baths",
    },
  },
  {
    before: before2,
    after: after2,
    titleKey: "gallery.bandjounVilla",
    category: "post-construction",
    local: true,
    stats: { label: "Bandjoun", value: "R+1" },
    overlay: {
      client: "Alexis",
      location: "Centre Climatique de Bandjoun",
      propertyFr: "Villa R+1 — 6 chambres, 5 SDB",
      propertyEn: "Two-storey villa — 6 bedrooms, 5 baths",
    },
  },
  {
    before: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.kitchen",
    category: "residential",
    stats: { label: "Temps", value: "3h" }
  },
  {
    before: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.office",
    category: "commercial",
    stats: { label: "Surface", value: "200m²" }
  },
  {
    before: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.car",
    category: "car",
    stats: { label: "Durée", value: "1h30" }
  },
  {
    before: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop&auto=format&q=80",
    after: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop&auto=format&q=80",
    titleKey: "gallery.bathroom",
    category: "residential",
    stats: { label: "Temps", value: "2h" }
  }
];

const BeforeAfterCard = ({ item, index, isVisible, t }: { item: GalleryItem; index: number; isVisible: boolean; t: (key: string) => string }) => {
  const [showAfter, setShowAfter] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { language } = useLanguage();

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
      <div className="relative h-40 sm:h-56 md:h-64 overflow-hidden bg-muted">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {item.local ? (
          <>
            <img
              src={item.before}
              alt={`${t(item.titleKey)} - ${t('gallery.before')}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                showAfter ? "opacity-0 scale-110" : "opacity-100 scale-100"
              }`}
              loading="lazy"
              decoding="async"
              width={1200}
              height={800}
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
              width={1200}
              height={800}
            />
          </>
        ) : (
        <picture>
          <source media="(min-width:1024px)" srcSet={`${item.before}&w=1200 1200w, ${item.before}&w=800 800w`} />
          <source media="(min-width:640px)" srcSet={`${item.before}&w=800 800w, ${item.before}&w=600 600w`} />
          <img
            src={item.before}
            alt={`${t(item.titleKey)} - ${t('gallery.before')}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              showAfter ? "opacity-0 scale-110" : "opacity-100 scale-100"
            }`}
            loading="lazy"
            decoding="async"
            width={1200}
            height={800}
            onLoad={() => setImageLoaded(true)}
          />
        </picture>
        )}
        {!item.local && (
        <picture>
          <source media="(min-width:1024px)" srcSet={`${item.after}&w=1200 1200w, ${item.after}&w=800 800w`} />
          <source media="(min-width:640px)" srcSet={`${item.after}&w=800 800w, ${item.after}&w=600 600w`} />
          <img
            src={item.after}
            alt={`${t(item.titleKey)} - ${t('gallery.after')}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              showAfter ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
            loading="lazy"
            decoding="async"
            width={1200}
            height={800}
          />
        </picture>
        )}
        
        {/* Category badge */}
        <Badge className="absolute top-4 right-4 bg-background/80 text-foreground backdrop-blur-sm">
          {item.category}
        </Badge>
        
        {/* Service info overlay (top) */}
        {item.overlay && (
          <div className="absolute top-14 left-4 right-4 rounded-md bg-background/85 backdrop-blur-sm px-3 py-2 shadow-sm text-xs text-foreground">
            <p className="font-semibold">
              {language === "fr" ? "Client" : "Client"}: {item.overlay.client} · {item.overlay.location}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {language === "fr" ? item.overlay.propertyFr : item.overlay.propertyEn}
            </p>
          </div>
        )}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <BeforeAfterCard key={index} item={item} index={index} isVisible={isVisible} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
